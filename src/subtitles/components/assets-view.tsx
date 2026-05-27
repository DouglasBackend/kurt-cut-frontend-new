import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useReducer, useRef, useState, useEffect } from "react";
import { extractTimelineAudio } from "@/media/mediabunny";
import { useEditor } from "@/editor/use-editor";
import { TRANSCRIPTION_DIAGNOSTICS_SCOPE } from "@/transcription/diagnostics";
import { DEFAULT_TRANSCRIPTION_SAMPLE_RATE } from "@/transcription/audio";
import { TRANSCRIPTION_LANGUAGES } from "@/transcription/supported-languages";
import type {
	CaptionChunk,
	TranscriptionLanguage,
	TranscriptionProgress,
	TranscriptionSegment,
} from "@/transcription/types";
import { transcriptionService } from "@/services/transcription/service";
import { decodeAudioToFloat32 } from "@/media/audio";
import { buildCaptionChunks } from "@/transcription/caption";
import { DEFAULT_WORDS_PER_CAPTION } from "@/transcription/caption-defaults";
import { insertCaptionChunksAsTextTrack } from "@/subtitles/insert";
import { parseSubtitleFile } from "@/subtitles/parse";
import { getPresetPatch } from "@/subtitles/presets";
import { SUBTITLE_PRESETS } from "@/components/SubtitlePresets";
import { Spinner } from "@/components/ui/spinner";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
} from "@/components/section";
import { AlertCircleIcon, CloudUploadIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { DiagnosticSeverity } from "@/diagnostics/types";
import { mediaTimeFromSeconds, mediaTimeToSeconds } from "@/wasm";
import { UpdateElementsCommand, RemoveTrackCommand } from "@/commands";
import type { TextTrack } from "@/timeline";

const DIAGNOSTIC_BUTTON_VARIANT: Record<
	DiagnosticSeverity,
	"caution" | "destructive-foreground"
> = {
	caution: "caution",
	error: "destructive-foreground",
};

type ProcessingState =
	| { status: "idle"; error: string | null; warnings: string[] }
	| { status: "processing"; step: string };

type ProcessingAction =
	| { type: "start"; step: string }
	| { type: "update_step"; step: string }
	| { type: "succeed"; warnings: string[] }
	| { type: "fail"; error: string };

const IDLE_STATE: ProcessingState = {
	status: "idle",
	error: null,
	warnings: [],
};


function processingReducer(
	state: ProcessingState,
	action: ProcessingAction,
): ProcessingState {
	switch (action.type) {
		case "start":
			return { status: "processing", step: action.step };
		case "update_step":
			if (state.status !== "processing") return state;
			return { status: "processing", step: action.step };
		case "succeed":
			return { status: "idle", error: null, warnings: action.warnings };
		case "fail":
			return { status: "idle", error: action.error, warnings: [] };
	}
}


export function Captions() {
	const [selectedLanguage, setSelectedLanguage] =
		useState<TranscriptionLanguage>("auto");
	const [selectedPreset, setSelectedPreset] = useState<string>("highlight");
	const [wordsPerCaption, setWordsPerCaption] = useState<number>(DEFAULT_WORDS_PER_CAPTION);
	const [rawSegments, setRawSegments] = useState<TranscriptionSegment[] | null>(null);
	const [processing, dispatch] = useReducer(processingReducer, IDLE_STATE);
	const containerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editor = useEditor();

	const activeScene = useEditor((state) => state.scenes.getActiveSceneOrNull());
	const textTrack = activeScene?.tracks.overlay.find((t): t is TextTrack => t.type === "text");

	const isProcessing = processing.status === "processing";

	const activeDiagnostics = useEditor((e) =>
		e.diagnostics.getActive({ scope: TRANSCRIPTION_DIAGNOSTICS_SCOPE }),
	);

	/** Reconstrói segmentos brutos de palavras a partir dos elementos de legenda existentes no timeline */
	const getRawSegmentsFromTimeline = (): TranscriptionSegment[] => {
		const scene = editor.scenes.getActiveSceneOrNull();
		if (!scene) return [];
		const currentTextTrack = scene.tracks.overlay.find((t): t is TextTrack => t.type === "text");
		if (!currentTextTrack || currentTextTrack.elements.length === 0) return [];

		const words: TranscriptionSegment[] = [];
		const sortedElements = [...currentTextTrack.elements].sort((a, b) => {
			const startA = mediaTimeToSeconds({ time: a.startTime });
			const startB = mediaTimeToSeconds({ time: b.startTime });
			return startA - startB;
		});

		for (const el of sortedElements) {
			const content = String(el.params.content || "");
			const elWords = content.trim().split(/\s+/).filter((w) => w.length > 0);
			if (elWords.length === 0) continue;

			const startSec = mediaTimeToSeconds({ time: el.startTime });
			const durationSec = mediaTimeToSeconds({ time: el.duration });
			const wordDuration = durationSec / elWords.length;

			for (let j = 0; j < elWords.length; j++) {
				words.push({
					text: elWords[j],
					start: startSec + j * wordDuration,
					end: startSec + (j + 1) * wordDuration,
				});
			}
		}
		return words;
	};

	/** Ao selecionar um preset, aplica imediatamente nas legendas existentes */
	const handlePresetChange = (presetKey: string) => {
		setSelectedPreset(presetKey);

		const scene = editor.scenes.getActiveSceneOrNull();
		if (!scene) return;
		const currentTextTrack = scene.tracks.overlay.find((t): t is TextTrack => t.type === "text");
		if (!currentTextTrack || currentTextTrack.elements.length === 0) return;

		const canvasHeight = editor.project.getActive().settings.canvasSize.height;
		const patch = getPresetPatch(presetKey, canvasHeight);
		if (!patch.params) return;

		const updates = currentTextTrack.elements.map((element) => ({
			trackId: currentTextTrack.id,
			elementId: element.id,
			patch: {
				params: { ...element.params, ...patch.params },
				animations: patch.animations ?? {},
			}
		}));

		editor.command.execute({
			command: new UpdateElementsCommand({ updates })
		});
	};

	const handleProgress = (progress: TranscriptionProgress) => {
		if (progress.status === "loading-model") {
			dispatch({
				type: "update_step",
				step: `Carregando modelo ${Math.round(progress.progress)}%`,
			});
		} else if (progress.status === "transcribing") {
			dispatch({ type: "update_step", step: "Transcrevendo..." });
		}
	};

	const insertCaptions = ({
		captions,
	}: {
		captions: CaptionChunk[];
	}): boolean => {
		const trackId = insertCaptionChunksAsTextTrack({ editor, captions, presetId: selectedPreset });
		return trackId !== null;
	};

	const handleGenerateTranscript = async () => {
		dispatch({ type: "start", step: "Extraindo áudio..." });
		try {
			const audioBlob = await extractTimelineAudio({
				tracks: editor.scenes.getActiveScene().tracks,
				mediaAssets: editor.media.getAssets(),
				totalDuration: editor.timeline.getTotalDuration(),
			});

			dispatch({ type: "update_step", step: "Preparando áudio..." });
			const { samples } = await decodeAudioToFloat32({
				audioBlob,
				sampleRate: DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
			});

			const result = await transcriptionService.transcribe({
				audioData: samples,
				language: selectedLanguage === "auto" ? undefined : selectedLanguage,
				onProgress: handleProgress,
			});

			dispatch({ type: "update_step", step: "Gerando legendas..." });
			setRawSegments(result.segments);
			const captionChunks = buildCaptionChunks({ segments: result.segments, wordsPerChunk: wordsPerCaption });

			if (!insertCaptions({ captions: captionChunks })) {
				dispatch({ type: "fail", error: "Nenhuma legenda foi gerada" });
				return;
			}

			dispatch({ type: "succeed", warnings: [] });
		} catch (error) {
			console.error("Transcription failed:", error);
			dispatch({
				type: "fail",
				error:
					error instanceof Error
						? error.message
						: "Ocorreu um erro inesperado",
			});
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleImportFile = async ({ file }: { file: File }) => {
		dispatch({ type: "start", step: "Lendo arquivo de legenda..." });
		try {
			const input = await file.text();
			const result = parseSubtitleFile({
				fileName: file.name,
				input,
			});

			if (result.captions.length === 0) {
				dispatch({
					type: "fail",
					error: "Nenhuma legenda válida foi encontrada no arquivo de legenda",
				});
				return;
			}

			dispatch({ type: "update_step", step: "Importando legendas..." });

			if (!insertCaptions({ captions: result.captions })) {
				dispatch({ type: "fail", error: "Nenhuma legenda foi gerada" });
				return;
			}

			const nextWarnings = [...result.warnings];
			if (result.skippedCueCount > 0) {
				nextWarnings.unshift(
					`Importada(s) ${result.captions.length} legenda(s) e ignorada(s) ${result.skippedCueCount} legenda(s) malformada(s).`,
				);
			}

			dispatch({ type: "succeed", warnings: nextWarnings });
		} catch (error) {
			console.error("Subtitle import failed:", error);
			dispatch({
				type: "fail",
				error:
					error instanceof Error
						? error.message
						: "Ocorreu um erro inesperado",
			});
		}
	};

	const handleFileChange = async ({
		event,
	}: {
		event: React.ChangeEvent<HTMLInputElement>;
	}) => {
		const file = event.target.files?.[0];
		if (event.target) {
			event.target.value = "";
		}
		if (!file) return;

		await handleImportFile({ file });
	};

	const handleLanguageChange = ({ value }: { value: string }) => {
		if (value === "auto") {
			setSelectedLanguage("auto");
			return;
		}

		const matchedLanguage = TRANSCRIPTION_LANGUAGES.find(
			(language) => language.code === value,
		);
		if (!matchedLanguage) return;
		setSelectedLanguage(matchedLanguage.code);
	};

	const error = processing.status === "idle" ? processing.error : null;
	const warnings = processing.status === "idle" ? processing.warnings : [];

	return (
		<PanelView
			title="Legendas"
			contentClassName="px-0 flex flex-col h-full"
			actions={
				<TooltipProvider>
					<div className="flex items-center gap-1.5">
						{!isProcessing &&
							activeDiagnostics.map((diagnostic) => (
								<Tooltip key={diagnostic.id}>
									<TooltipTrigger asChild>
										<Button
											variant={DIAGNOSTIC_BUTTON_VARIANT[diagnostic.severity]}
											size="icon"
											aria-label={diagnostic.message}
										>
											<HugeiconsIcon icon={AlertCircleIcon} size={16} />
										</Button>
									</TooltipTrigger>
									<TooltipContent>{diagnostic.message}</TooltipContent>
								</Tooltip>
							))}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleImportClick}
							disabled={isProcessing}
							className="items-center justify-center gap-1.5"
						>
							<HugeiconsIcon icon={CloudUploadIcon} />
							Importar
						</Button>
					</div>
				</TooltipProvider>
			}
			ref={containerRef}
		>
			<input
				ref={fileInputRef}
				type="file"
				accept=".srt,.ass"
				className="hidden"
				onChange={(event) => void handleFileChange({ event })}
			/>
			<Section
				showTopBorder={false}
				showBottomBorder={false}
				className="flex-1"
			>
				<SectionContent className="flex flex-col gap-4 h-full pt-1">
					<SectionFields>
						<SectionField label="Estilo">
							<Select
								value={selectedPreset}
								onValueChange={handlePresetChange}
							>
								<SelectTrigger>
									<SelectValue placeholder="Selecione um estilo" />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{["Virais", "Clássicos", "Novos 2025"].map((category) => (
										<SelectGroup key={category}>
											<SelectLabel className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</SelectLabel>
											{SUBTITLE_PRESETS.filter(p => p.category === category).map((preset) => (
												<SelectItem key={preset.id} value={preset.id}>
													{preset.label}
												</SelectItem>
											))}
										</SelectGroup>
									))}
								</SelectContent>
							</Select>
						</SectionField>
						<SectionField label="Palavras por Legenda">
							<Input
								type="number"
								min={1}
								max={20}
								value={wordsPerCaption}
								onChange={(e) => {
									const newWordsPerCaption = Math.max(1, parseInt(e.target.value) || 1);
									setWordsPerCaption(newWordsPerCaption);
									
									const segmentsToUse = rawSegments || getRawSegmentsFromTimeline();
									if (segmentsToUse.length > 0) {
										if (!rawSegments) {
											setRawSegments(segmentsToUse);
										}
										const captionChunks = buildCaptionChunks({ 
											segments: segmentsToUse, 
											wordsPerChunk: newWordsPerCaption 
										});
										const currentScene = editor.scenes.getActiveSceneOrNull();
										const currentTextTrack = currentScene?.tracks.overlay.find((t): t is TextTrack => t.type === "text");
										if (currentTextTrack) {
											editor.command.execute({ command: new RemoveTrackCommand(currentTextTrack.id) });
										}
										insertCaptions({ captions: captionChunks });
									}
								}}
							/>
						</SectionField>
					</SectionFields>
					
					{textTrack && textTrack.elements.length > 0 && (
						<div className="mt-4 flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium">Editar Legendas</h3>
							</div>
							<div className="flex flex-col gap-2 overflow-y-auto pr-1 pb-4" style={{ maxHeight: "calc(100vh - 450px)" }}>
								{textTrack.elements.map((el) => (
									<CaptionInput 
										key={el.id}
										trackId={textTrack.id}
										elementId={el.id}
										initialValue={String(el.params.content || "")}
										editor={editor}
									/>
								))}
							</div>
						</div>
					)}
				</SectionContent>
			</Section>
		</PanelView>
	);
}

function CaptionInput({
	trackId,
	elementId,
	initialValue,
	editor,
}: {
	trackId: string;
	elementId: string;
	initialValue: string;
	editor: any;
}) {
	const [value, setValue] = useState(initialValue);

	useEffect(() => {
		setValue(initialValue);
	}, [initialValue]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newValue = e.target.value;
		setValue(newValue);
		editor.timeline.previewElements([
			{
				trackId,
				elementId,
				updates: { params: { content: newValue } },
			},
		]);
	};

	const handleBlur = () => {
		if (value !== initialValue) {
			editor.timeline.commitPreview();
			editor.command.execute({
				command: new UpdateElementsCommand({
					updates: [
						{
							trackId,
							elementId,
							patch: { params: { content: value } },
						},
					],
				}),
			});
		} else {
			editor.timeline.discardPreview();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.currentTarget.blur();
		}
	};

	return (
		<Input
			value={value}
			onChange={handleChange}
			onBlur={handleBlur}
			onKeyDown={handleKeyDown}
			className="h-8 text-xs"
			placeholder="Digite o texto da legenda..."
		/>
	);
}
