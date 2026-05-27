import React, { useCallback, useMemo, useRef, useState } from "react";
import { SUBTITLE_PRESETS, SubtitleCanvas } from "@/components/SubtitlePresets";
import { useEditor } from "@/editor/use-editor";
import { UpdateElementsCommand } from "@/commands";
import { getPresetPatch } from "@/subtitles/presets";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TextElement, TextTrack } from "@/timeline";
import { Check } from "lucide-react";

export function SubtitlePresetsTab({
	element,
	trackId,
}: {
	element: TextElement;
	trackId: string;
}) {
	const editor = useEditor();
	const [activeCategory, setActiveCategory] = useState("Virais");
	const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
	const lastPreviewedRef = useRef<string | null>(null);

	const categories = useMemo(() => {
		const cats = new Set(SUBTITLE_PRESETS.map((p) => p.category));
		return Array.from(cats);
	}, []);

	const getTextTrack = useCallback(() => {
		const scene = editor.scenes.getActiveSceneOrNull();
		if (!scene) return null;
		return scene.tracks.overlay.find(
			(t): t is TextTrack => t.id === trackId && t.type === "text",
		) ?? null;
	}, [editor, trackId]);

	/** Preview dinâmico ao passar o mouse — altera no canvas em tempo real */
	const handlePreview = useCallback((presetId: string) => {
		if (lastPreviewedRef.current === presetId) return;
		lastPreviewedRef.current = presetId;

		const textTrack = getTextTrack();
		if (!textTrack || textTrack.elements.length === 0) return;

		const canvasHeight = editor.project.getActive().settings.canvasSize.height;
		const patch = getPresetPatch(presetId, canvasHeight);
		if (!patch.params) return;

		const updates = textTrack.elements.map((el) => ({
			trackId,
			elementId: el.id,
			updates: {
				params: { ...el.params, ...patch.params },
				animations: patch.animations ?? {},
			},
		}));

		editor.timeline.previewElements({ updates });
	}, [editor, trackId, getTextTrack]);

	/** Ao sair do hover, cancela o preview se não foi commitado */
	const handlePreviewLeave = useCallback(() => {
		lastPreviewedRef.current = null;
		if (editor.timeline.isPreviewActive()) {
			editor.timeline.discardPreview();
		}
	}, [editor]);

	/** Clique: commita o preset selecionado definitivamente */
	const handleSelectPreset = useCallback((presetId: string) => {
		setSelectedPresetId(presetId);
		lastPreviewedRef.current = null;

		const textTrack = getTextTrack();
		if (!textTrack) return;

		const canvasHeight = editor.project.getActive().settings.canvasSize.height;
		const patch = getPresetPatch(presetId, canvasHeight);
		if (!patch.params) return;

		const updates = textTrack.elements.map((el) => ({
			trackId,
			elementId: el.id,
			patch: {
				params: { ...el.params, ...patch.params },
				animations: patch.animations ?? {},
			},
		}));

		// Se tem preview ativo, commita ele diretamente
		if (editor.timeline.isPreviewActive()) {
			editor.timeline.commitPreview();
		} else {
			editor.command.execute({
				command: new UpdateElementsCommand({ updates }),
			});
		}
	}, [editor, trackId, getTextTrack]);

	return (
		<div className="flex flex-col gap-2 mt-4 px-3 border-t border-border pt-4">
			<h3 className="text-sm font-semibold mb-2">Estilos de Legenda</h3>
			<Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
				<TabsList className="w-full grid grid-cols-3 h-8">
					{categories.map((cat) => (
						<TabsTrigger key={cat} value={cat} className="text-[10px]">
							{cat}
						</TabsTrigger>
					))}
				</TabsList>
				
				{categories.map((category) => (
					<TabsContent key={category} value={category} className="mt-2 outline-none">
						<ScrollArea className="h-[280px] w-full rounded-md border p-2">
							<div
								className="grid grid-cols-2 gap-2"
								onPointerLeave={handlePreviewLeave}
							>
								{SUBTITLE_PRESETS.filter((p) => p.category === category).map((preset) => {
									const isSelected = selectedPresetId === preset.id;
									return (
										<button
											key={preset.id}
											className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-md border p-1 transition-all text-left ${
												isSelected
													? "border-primary bg-primary/10 ring-1 ring-primary/30"
													: "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50"
											}`}
											onPointerEnter={() => handlePreview(preset.id)}
											onClick={() => handleSelectPreset(preset.id)}
											title={preset.desc}
										>
											{isSelected && (
												<div className="absolute top-1 right-1 z-10 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
													<Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />
												</div>
											)}
											<div className="w-full aspect-[16/9] rounded-sm overflow-hidden bg-black flex items-center justify-center">
												<div className="w-[120px] h-[60px] flex items-center justify-center transform scale-75 md:scale-100 origin-center">
													<SubtitleCanvas presetId={preset.id} active={isSelected} />
												</div>
											</div>
											<span className={`text-[10px] w-full text-center truncate font-medium mt-1 ${
												isSelected ? "text-primary" : "text-muted-foreground"
											}`}>
												{preset.label}
											</span>
										</button>
									);
								})}
							</div>
						</ScrollArea>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}
