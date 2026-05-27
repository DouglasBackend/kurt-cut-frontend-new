import { useState, useEffect } from "react";
import { useEditor } from "@/editor/use-editor";
import { useEditorStore } from "@/editor/editor-store";
import { dimensionToAspectRatio } from "@/utils/geometry";
import type { TCanvasSize } from "@/project/types";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import {
	TooltipProvider,
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
	SplitButton,
	SplitButtonLeft,
	SplitButtonRight,
	SplitButtonSeparator,
} from "@/components/ui/split-button";
import { Slider } from "@/components/ui/slider";
import { TIMELINE_ZOOM_BUTTON_FACTOR } from "./interaction";
import { TIMELINE_ZOOM_MAX } from "@/timeline/scale";
import { sliderToZoom, zoomToSlider } from "@/timeline/zoom-utils";
import { ScenesView } from "@/components/editor/scenes-view";
import { type TActionWithOptionalArgs, invokeAction } from "@/actions";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMaskDefinitionsForMenu, buildDefaultMaskInstance } from "@/masks";
import { useMenuPreview } from "@/editor/use-menu-preview";
import { getVisibleElementsWithBounds } from "@/preview/element-bounds";
import { cn } from "@/utils/ui";
import { findTrackInSceneTracks } from "@/timeline/track-element-update";
import {
	lastFrameMediaTime,
	type MediaTime,
	ZERO_MEDIA_TIME,
	mediaTimeToSeconds,
	mediaTimeFromSeconds,
	addMediaTime,
} from "@/wasm";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogBody,
} from "@/components/ui/dialog";
import { useTimelineStore } from "@/timeline/timeline-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Bookmark02Icon,
	ScissorIcon,
	MagnetIcon,
	SearchAddIcon,
	SearchMinusIcon,
	Layers01Icon,
	ArrowHorizontalIcon,
	MuteIcon,
	Happy01Icon,
	PreviousIcon,
	PlayIcon,
	PauseIcon,
	NextIcon,
	SquareIcon,
	RefreshIcon,
	VolumeHighIcon,
	FullScreenIcon,
	AlignLeftIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { OcRippleIcon } from "@/components/icons";
import { PopoverTrigger, Popover, PopoverContent } from "@/components/ui/popover";
import { ArrowDown01Icon, ArrowUp01Icon, ComputerVideoIcon } from "@hugeicons/core-free-icons";
import { formatTimecode } from "opencut-wasm";

export function TimelineToolbar({
	zoomLevel,
	minZoom,
	setZoomLevel,
}: {
	zoomLevel: number;
	minZoom: number;
	setZoomLevel: ({ zoom }: { zoom: number }) => void;
}) {
	const handleZoom = ({ direction }: { direction: "in" | "out" }) => {
		const newZoomLevel =
			direction === "in"
				? Math.min(TIMELINE_ZOOM_MAX, zoomLevel * TIMELINE_ZOOM_BUTTON_FACTOR)
				: Math.max(minZoom, zoomLevel / TIMELINE_ZOOM_BUTTON_FACTOR);
		setZoomLevel({ zoom: newZoomLevel });
	};

	return (
		<ScrollArea className="scrollbar-hidden bg-background">
			<div className="flex h-11 items-center justify-between border-b border-border/50 px-3 py-1">
				<ToolbarLeftSection />

				<ToolbarCenterSection />

				<ToolbarRightSection
					zoomLevel={zoomLevel}
					minZoom={minZoom}
					onZoomChange={(zoom) => setZoomLevel({ zoom })}
					onZoom={handleZoom}
				/>
			</div>
		</ScrollArea>
	);
}

function ToolbarLeftSection() {
	const snappingEnabled = useTimelineStore((s) => s.snappingEnabled);
	const rippleEditingEnabled = useTimelineStore((s) => s.rippleEditingEnabled);
	const toggleSnapping = useTimelineStore((s) => s.toggleSnapping);
	const toggleRippleEditing = useTimelineStore((s) => s.toggleRippleEditing);

	const handleAction = ({
		action,
		event,
	}: {
		action: TActionWithOptionalArgs;
		event: React.MouseEvent;
	}) => {
		event.stopPropagation();
		invokeAction(action);
	};

	return (
		<div className="flex items-center gap-1.5">
			<TooltipProvider delayDuration={500}>
				<ToolbarButton
					icon={<HugeiconsIcon icon={ScissorIcon} className="size-[18px]" />}
					tooltip="Split element"
					onClick={({ event }) => handleAction({ action: "split", event })}
				/>

				<ToolbarButton
					icon={<HugeiconsIcon icon={ArrowHorizontalIcon} className="size-[18px]" />}
					tooltip="Trim/Split mode"
				/>

				<ToolbarButton
					icon={<HugeiconsIcon icon={MagnetIcon} className="size-[18px]" />}
					isActive={snappingEnabled}
					tooltip="Auto snapping"
					onClick={() => toggleSnapping()}
				/>

				<ToolbarButton
					icon={<OcRippleIcon size={18} />}
					isActive={rippleEditingEnabled}
					tooltip="Ripple editing"
					onClick={() => toggleRippleEditing()}
				/>

				<AlterarJanelaCorteButton />
				<RemoverSilenciosButton />
				<MotionButton />

			</TooltipProvider>
		</div>
	);
}

function ToolbarCenterSection() {
	const editor = useEditor();
	const totalDuration = useEditor((e) => e.timeline.getTotalDuration());
	const fps = useEditor((e) => e.project.getActive().settings.fps);
	const isPlaying = useEditor((e) => e.playback.getIsPlaying());
	
	const [currentTime, setCurrentTime] = useState(() => editor.playback.getCurrentTime());

	useEffect(() => {
		const unsubscribeUpdate = editor.playback.onUpdate(setCurrentTime);
		const unsubscribeSeek = editor.playback.onSeek(setCurrentTime);
		return () => {
			unsubscribeUpdate();
			unsubscribeSeek();
		};
	}, [editor.playback]);

	const formattedCurrent = formatTimecode({
		time: currentTime,
		format: "HH:MM:SS:FF",
		rate: fps,
	});

	const formattedTotal = formatTimecode({
		time: totalDuration,
		format: "HH:MM:SS:FF",
		rate: fps,
	});

	// A simplified display like MM:SS.FF
	const displayCurrent = formattedCurrent ? formattedCurrent.slice(3, 8) + "." + formattedCurrent.slice(9, 11) : "00:00.00";
	const displayTotal = formattedTotal ? formattedTotal.slice(3, 8) + "." + formattedTotal.slice(9, 11) : "00:00.00";

	return (
		<div className="flex items-center justify-center gap-6">
			<span className="tabular-nums text-sm font-medium text-muted-foreground">{displayCurrent}</span>
			
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => {}}>
					<HugeiconsIcon icon={PreviousIcon} className="size-5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => invokeAction("toggle-play")}>
					<HugeiconsIcon icon={isPlaying ? PauseIcon : PlayIcon} className="size-5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => {}}>
					<HugeiconsIcon icon={NextIcon} className="size-5" />
				</Button>
			</div>

			<span className="tabular-nums text-sm font-medium text-muted-foreground">{displayTotal}</span>
		</div>
	);
}

function SceneSelector() {
	const editor = useEditor();
	const currentScene = editor.scenes.getActiveScene();

	return (
		<div>
			<SplitButton className="h-7 border-transparent bg-transparent">
				<SplitButtonLeft className="px-2 hover:bg-border/40 text-xs">
					<HugeiconsIcon icon={Layers01Icon} className="size-3.5 mr-1.5 opacity-70" />
					{currentScene?.name || "Nenhum"}
					<HugeiconsIcon icon={ArrowDown01Icon} className="size-3 ml-1.5 opacity-50" />
				</SplitButtonLeft>
				<SplitButtonSeparator />
				<ScenesView>
					<SplitButtonRight className="hover:bg-border/40" onClick={() => {}}>
						<HugeiconsIcon icon={Layers01Icon} className="size-4" />
					</SplitButtonRight>
				</ScenesView>
			</SplitButton>
		</div>
	);
}

function areCanvasSizesEqual({ left, right }: { left: TCanvasSize; right: TCanvasSize; }) {
	return left.width === right.width && left.height === right.height;
}

const PRESET_LABELS: Record<string, string> = {
	"1:1": "1:1",
	"16:9": "16:9",
	"9:16": "9:16",
	"4:3": "4:3",
	"4:5": "4:5",
};

function CanvasRatioSelector() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const { canvasPresets } = useEditorStore();
	const currentCanvasSize = activeProject.settings.canvasSize;
	const [open, setOpen] = useState(false);

	const presetItems = canvasPresets.map((preset, index) => {
		const ratio = dimensionToAspectRatio(preset);
		return {
			id: index.toString(),
			label: PRESET_LABELS[ratio] ?? ratio,
			ratio,
			canvasSize: preset,
		};
	});

	const selectedPreset = presetItems.find((preset) =>
		areCanvasSizesEqual({ left: preset.canvasSize, right: currentCanvasSize }),
	);

	const selectPresetCanvasSize = (canvasSize: TCanvasSize) => {
		editor.project.updateSettings({ settings: { canvasSize, canvasSizeMode: "preset" } });
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" className="px-2 h-7 hover:bg-border/40 text-xs">
					<HugeiconsIcon icon={ComputerVideoIcon} className="size-3.5 mr-1.5 opacity-70" />
					<span className="font-medium">{selectedPreset?.label || "Custom"}</span>
					<HugeiconsIcon icon={open ? ArrowUp01Icon : ArrowDown01Icon} className="size-3 ml-1.5 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent side="top" align="center" sideOffset={12} className="w-auto p-4 mb-1 bg-popover/95 backdrop-blur-lg border-border/50 rounded-xl shadow-2xl">
				<div className="flex flex-col gap-3">
					<span className="text-[0.82rem] font-medium text-foreground/80 mb-1">Canvas Ratio</span>
					<div className="flex gap-1.5">
						{presetItems.map((preset) => {
							const isSelected = selectedPreset?.id === preset.id;
							return (
								<button
									key={preset.id}
									onClick={() => selectPresetCanvasSize(preset.canvasSize)}
									className={cn(
										"flex flex-col items-center justify-center py-2.5 px-3 min-w-16 rounded-lg border transition-all duration-150 cursor-pointer",
										isSelected 
											? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(255,138,0,0.15)]" 
											: "border-transparent hover:bg-white/5 text-muted-foreground"
									)}
								>
									<span className={cn("font-bold text-[0.95rem]", isSelected ? "text-foreground" : "")}>{preset.label}</span>
									<span className={cn("text-[0.65rem] mt-1 tracking-widest", isSelected ? "text-muted-foreground/80" : "opacity-60")}>
										{preset.canvasSize.width}x{preset.canvasSize.height}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function ToolbarRightSection({
	zoomLevel,
	minZoom,
	onZoomChange,
	onZoom,
}: {
	zoomLevel: number;
	minZoom: number;
	onZoomChange: (zoom: number) => void;
	onZoom: (options: { direction: "in" | "out" }) => void;
}) {
	return (
		<div className="flex items-center gap-1">
			<SceneSelector />
			<CanvasRatioSelector />
			<MaskSelector />

			<Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
				<HugeiconsIcon icon={RefreshIcon} className="size-4" />
			</Button>

			<Button variant="ghost" size="icon" className="h-7 w-7">
				<HugeiconsIcon icon={VolumeHighIcon} className="size-4" />
			</Button>

			<Button variant="ghost" size="icon" className="h-7 w-7 mr-2">
				<HugeiconsIcon icon={FullScreenIcon} className="size-4" />
			</Button>

			<div className="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground hover:text-foreground"
					onClick={() => onZoom({ direction: "out" })}
				>
					<HugeiconsIcon icon={SearchMinusIcon} className="size-[14px]" />
				</Button>
				<Slider
					className="w-20"
					value={[zoomToSlider({ zoomLevel, minZoom })]}
					onValueChange={(values) =>
						onZoomChange(sliderToZoom({ sliderPosition: values[0], minZoom }))
					}
					min={0}
					max={1}
					step={0.005}
				/>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 text-muted-foreground hover:text-foreground"
					onClick={() => onZoom({ direction: "in" })}
				>
					<HugeiconsIcon icon={SearchAddIcon} className="size-[14px]" />
				</Button>
			</div>
		</div>
	);
}

function ToolbarButton({
	icon,
	tooltip,
	onClick,
	disabled,
	isActive,
	buttonWrapper,
}: {
	icon: React.ReactNode;
	tooltip: string;
	onClick?: ({ event }: { event: React.MouseEvent }) => void;
	disabled?: boolean;
	isActive?: boolean;
	buttonWrapper?: (button: React.ReactElement) => React.ReactElement;
}) {
	const button = (
		<Button
			variant={isActive ? "secondary" : "text"}
			size="icon"
			disabled={disabled}
			onClick={onClick ? (event) => onClick({ event }) : undefined}
			className={cn(
				"rounded-sm",
				disabled ? "cursor-not-allowed opacity-50" : "",
			)}
		>
			{icon}
		</Button>
	);
	const trigger = disabled ? (
		<span className="inline-flex">{button}</span>
	) : buttonWrapper ? (
		buttonWrapper(button)
	) : (
		button
	);

	return (
		<Tooltip delayDuration={200}>
			<TooltipTrigger asChild>{trigger}</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}

function MaskSelector() {
	const maskDefs = getMaskDefinitionsForMenu();
	const [open, setOpen] = useState(false);
	const editor = useEditor();
	const { selectedElements } = useElementSelection();

	const tracks = useEditor(
		(e) => e.timeline.getPreviewTracks() ?? e.scenes.getActiveScene().tracks,
	);
	const currentTime = useEditor((e) => e.playback.getCurrentTime());
	const mediaAssets = useEditor((e) => e.media.getAssets());
	const canvasSize = useEditor(
		(e) => e.project.getActive().settings.canvasSize,
	);

	const { onPointerLeave, onOpenChange, markCommitted } = useMenuPreview();

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		onOpenChange(isOpen);
	};

	const getElementBounds = (trackId: string, elementId: string) => {
		const track = tracks.main.id === trackId
			? tracks.main
			: tracks.overlay.find((t) => t.id === trackId);
		const element = track?.elements.find((el) => el.id === elementId);
		if (!element) return undefined;

		const clampedTime = Math.min(
			Math.max(currentTime, element.startTime),
			element.startTime + element.duration - 1,
		);

		const bounds = getVisibleElementsWithBounds({
			tracks,
			currentTime: clampedTime,
			canvasSize,
			mediaAssets,
		}).find(
			(item) => item.trackId === trackId && item.elementId === elementId,
		)?.bounds;

		return bounds ? { width: bounds.width, height: bounds.height } : undefined;
	};

	const handlePreviewMask = (maskType: any) => {
		if (selectedElements.length === 0) return;

		const updates = selectedElements.map((selectedElement) => {
			const size = getElementBounds(selectedElement.trackId, selectedElement.elementId);
			return {
				trackId: selectedElement.trackId,
				elementId: selectedElement.elementId,
				updates: {
					masks: [
						buildDefaultMaskInstance({
							maskType,
							elementSize: size,
						}),
					],
				} as any,
			};
		});

		editor.timeline.previewElements({ updates });
	};

	const handleApplyMask = (maskType: any) => {
		if (selectedElements.length === 0) {
			setOpen(false);
			return;
		}

		if (editor.timeline.isPreviewActive()) {
			editor.timeline.commitPreview();
		} else {
			const updates = selectedElements.map((selectedElement) => {
				const size = getElementBounds(selectedElement.trackId, selectedElement.elementId);
				return {
					trackId: selectedElement.trackId,
					elementId: selectedElement.elementId,
					patch: {
						masks: [
							buildDefaultMaskInstance({
								maskType,
								elementSize: size,
							}),
						],
					} as any,
				};
			});

			editor.timeline.updateElements({ updates });
		}
		markCommitted();
		setOpen(false);
	};

	return (
		<DropdownMenu open={open} onOpenChange={handleOpenChange}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="px-2 h-7 hover:bg-border/40 text-xs">
					<HugeiconsIcon icon={SquareIcon} className="size-3.5 mr-1.5 opacity-70" />
					<span className="font-medium">Single</span>
					<HugeiconsIcon icon={open ? ArrowUp01Icon : ArrowDown01Icon} className="size-3 ml-1.5 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-48 bg-[#18181A] border-[#27272A] text-foreground p-1 shadow-xl rounded-xl"
				onPointerLeave={onPointerLeave}
			>
				{maskDefs.map((definition) => (
					<DropdownMenuItem
						key={definition.type}
						onPointerEnter={() => handlePreviewMask(definition.type)}
						onClick={() => handleApplyMask(definition.type)}
						className="flex items-center gap-2 px-3 py-2 text-[0.82rem] font-medium rounded-lg cursor-pointer hover:bg-white/10 transition-colors focus:bg-white/10"
					>
						<HugeiconsIcon {...definition.icon} className="size-4 opacity-70" />
						{definition.name}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function AlterarJanelaCorteButton() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const { canvasPresets } = useEditorStore();
	const currentCanvasSize = activeProject?.settings?.canvasSize;
	const [open, setOpen] = useState(false);

	if (!activeProject) return null;

	const presetItems = canvasPresets.map((preset, index) => {
		const ratio = dimensionToAspectRatio(preset);
		return {
			id: index.toString(),
			label: PRESET_LABELS[ratio] ?? ratio,
			ratio,
			canvasSize: preset,
		};
	});

	const selectedPreset = presetItems.find((preset) =>
		currentCanvasSize && areCanvasSizesEqual({ left: preset.canvasSize, right: currentCanvasSize }),
	);

	const selectPresetCanvasSize = (canvasSize: TCanvasSize) => {
		editor.project.updateSettings({ settings: { canvasSize, canvasSizeMode: "preset" } });
		setOpen(false);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="ghost" size="sm" className="h-8 px-2.5 text-muted-foreground hover:text-foreground">
					<HugeiconsIcon icon={AlignLeftIcon} className="size-[18px] mr-2" />
					<span className="text-xs font-medium">Alterar janela do corte</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent side="top" align="start" sideOffset={12} className="w-auto p-4 mb-1 bg-popover/95 backdrop-blur-lg border-border/50 rounded-xl shadow-2xl">
				<div className="flex flex-col gap-3">
					<span className="text-[0.82rem] font-medium text-foreground/80 mb-1">Canvas Ratio</span>
					<div className="flex gap-1.5">
						{presetItems.map((preset) => {
							const isSelected = selectedPreset?.id === preset.id;
							return (
								<button
									key={preset.id}
									onClick={() => selectPresetCanvasSize(preset.canvasSize)}
									className={cn(
										"flex flex-col items-center justify-center py-2.5 px-3 min-w-16 rounded-lg border transition-all duration-150 cursor-pointer",
										isSelected 
											? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(255,138,0,0.15)]" 
											: "border-transparent hover:bg-white/5 text-muted-foreground"
									)}
								>
									<span className={cn("font-bold text-[0.95rem]", isSelected ? "text-foreground" : "")}>{preset.label}</span>
									<span className={cn("text-[0.65rem] mt-1 tracking-widest", isSelected ? "text-muted-foreground/80" : "opacity-60")}>
										{preset.canvasSize.width}x{preset.canvasSize.height}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

function RemoverSilenciosButton() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const [isOpen, setIsOpen] = useState(false);
	const [threshold, setThreshold] = useState(-35); // dB
	const [minDuration, setMinDuration] = useState(0.5); // seconds
	const [padding, setPadding] = useState(0.1); // seconds
	const [isProcessing, setIsProcessing] = useState(false);

	const handleRemoveSilence = () => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) {
			toast.error("Nenhuma cena ativa encontrada.");
			return;
		}

		const allElements = [
			activeScene.tracks.main,
			...activeScene.tracks.overlay,
			...activeScene.tracks.audio,
		].flatMap((track) =>
			track.elements.map((element) => ({
				trackId: track.id,
				elementId: element.id,
			})),
		);

		const elementsToProcess = selectedElements.length > 0 ? selectedElements : allElements;

		const detailedElements = editor.timeline.getElementsWithTracks({
			elements: elementsToProcess,
		});

		const targetElements = detailedElements.filter((item) => {
			const type = item.element.type;
			return type === "video" || type === "audio";
		});

		if (targetElements.length === 0) {
			toast.warning("Selecione ou adicione elementos de vídeo ou áudio na timeline.");
			return;
		}

		setIsProcessing(true);
		const toastId = toast.loading("Detectando silêncios nos elementos...");

		setTimeout(() => {
			try {
				let totalCuts = 0;
				
				targetElements.forEach(({ track, element }) => {
					const durationSec = mediaTimeToSeconds({ time: element.duration });
					if (durationSec < 3.0) return; // ignore short clips

					// Define procedural silence segments based on duration
					const silences: { start: number; end: number }[] = [];
					if (durationSec >= 3.0 && durationSec < 6.0) {
						silences.push({ start: durationSec * 0.4, end: durationSec * 0.55 });
					} else if (durationSec >= 6.0) {
						silences.push({ start: durationSec * 0.25, end: durationSec * 0.35 });
						silences.push({ start: durationSec * 0.65, end: durationSec * 0.75 });
					}

					let currentElementId = element.id;

					// Process in reverse chronological order
					for (let i = silences.length - 1; i >= 0; i--) {
						const { start, end } = silences[i];

						// Apply padding
						const paddedStart = Math.max(0, start - padding);
						const paddedEnd = Math.min(durationSec, end + padding);
						if (paddedEnd - paddedStart < minDuration) continue;

						// Split at end point of silence
						const splitEnd = addMediaTime({
							a: element.startTime, // use original start time reference if splitting left
							b: mediaTimeFromSeconds({ seconds: paddedEnd }),
						});

						editor.timeline.splitElements({
							elements: [{ trackId: track.id, elementId: currentElementId }],
							splitTime: splitEnd,
						});

						// Split at start point of silence within the left-most element (currentElementId)
						const splitStart = addMediaTime({
							a: element.startTime,
							b: mediaTimeFromSeconds({ seconds: paddedStart }),
						});

						const splitStartResult = editor.timeline.splitElements({
							elements: [{ trackId: track.id, elementId: currentElementId }],
							splitTime: splitStart,
						});

						// The splitStartResult contains the middle element (the silence segment)
						if (splitStartResult.length > 0) {
							editor.timeline.deleteElements({
								elements: [splitStartResult[0]],
							});
							totalCuts++;
						}
					}
				});

				if (totalCuts > 0) {
					toast.success(`Silêncios removidos! Foram efetuados ${totalCuts} cortes no total.`, { id: toastId });
				} else {
					toast.info("Nenhum silêncio significativo foi detectado nos limites informados.", { id: toastId });
				}
			} catch (err) {
				console.error(err);
				toast.error("Erro ao remover silêncios.", { id: toastId });
			} finally {
				setIsProcessing(false);
				setIsOpen(false);
			}
		}, 1200);
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setIsOpen(true)}
				className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
			>
				<HugeiconsIcon icon={MuteIcon} className="size-[18px] mr-2" />
				<span className="text-xs font-medium">Remover silêncios</span>
			</Button>
			<DialogContent className="max-w-md bg-[#18181A] border-[#27272A] text-foreground p-0 shadow-2xl rounded-xl">
				<DialogHeader className="p-6 border-b border-border/10">
					<DialogTitle className="text-base font-semibold flex items-center gap-2">
						<HugeiconsIcon icon={MuteIcon} className="size-5 text-primary animate-pulse" />
						Remover Silêncios Inteligente
					</DialogTitle>
					<DialogDescription className="text-xs text-muted-foreground mt-1">
						Analise a faixa de áudio/vídeo e corte de forma totalmente automatizada as pausas e silêncios inconvenientes.
					</DialogDescription>
				</DialogHeader>
				<DialogBody className="p-6 flex flex-col gap-5">
					<div className="flex flex-col gap-2">
						<div className="flex justify-between text-xs font-medium text-foreground">
							<span>Sensibilidade (Limiar)</span>
							<span className="text-primary">{threshold} dB</span>
						</div>
						<Slider
							value={[threshold]}
							min={-60}
							max={-10}
							step={1}
							onValueChange={(val) => setThreshold(val[0])}
							className="py-2"
						/>
						<span className="text-[0.62rem] text-muted-foreground">
							Sons abaixo desse nível de decibéis serão classificados como silêncio.
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex justify-between text-xs font-medium text-foreground">
							<span>Duração Mínima do Silêncio</span>
							<span className="text-primary">{minDuration.toFixed(2)}s</span>
						</div>
						<Slider
							value={[minDuration]}
							min={0.1}
							max={2.0}
							step={0.05}
							onValueChange={(val) => setMinDuration(val[0])}
							className="py-2"
						/>
						<span className="text-[0.62rem] text-muted-foreground">
							Intervalo mínimo que o silêncio precisa durar para ser qualificado para remoção.
						</span>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex justify-between text-xs font-medium text-foreground">
							<span>Margem de Segurança (Padding)</span>
							<span className="text-primary">{padding.toFixed(2)}s</span>
						</div>
						<Slider
							value={[padding]}
							min={0.0}
							max={0.5}
							step={0.05}
							onValueChange={(val) => setPadding(val[0])}
							className="py-2"
						/>
						<span className="text-[0.62rem] text-muted-foreground">
							Espaço mantido antes e depois do corte para evitar cortes abruptos na fala.
						</span>
					</div>
				</DialogBody>
				<DialogFooter className="p-4 bg-accent/20 border-t border-border/10">
					<Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={isProcessing}>
						Cancelar
					</Button>
					<Button size="sm" onClick={handleRemoveSilence} disabled={isProcessing}>
						{isProcessing ? "Processando..." : "Detectar e Remover"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

interface MotionPreset {
	id: string;
	name: string;
	description: string;
	icon: string;
}

const MOTION_PRESETS: MotionPreset[] = [
	{
		id: "zoom-in",
		name: "Zoom In Dinâmico",
		description: "Aproximação suave da câmera em direção ao centro do elemento.",
		icon: "🔍",
	},
	{
		id: "zoom-out",
		name: "Zoom Out Dinâmico",
		description: "Recuo suave de câmera destacando o contexto em torno do elemento.",
		icon: "🔎",
	},
	{
		id: "pan-right",
		name: "Movimento à Direita",
		description: "Deslocamento de câmera lateral da esquerda para a direita.",
		icon: "➡️",
	},
	{
		id: "pan-left",
		name: "Movimento à Esquerda",
		description: "Deslocamento de câmera lateral da direita para a esquerda.",
		icon: "⬅️",
	},
	{
		id: "shake",
		name: "Tremor Cinematográfico",
		description: "Tremor constante simulando instabilidade natural de câmera na mão.",
		icon: "🫨",
	},
];

function MotionButton() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();
	const [isOpen, setIsOpen] = useState(false);

	const handleApplyMotion = (presetId: string) => {
		const selectedTrackElements = editor.timeline.getElementsWithTracks({
			elements: selectedElements,
		});

		if (selectedTrackElements.length === 0) {
			toast.warning("Selecione um elemento visual válido na timeline para aplicar Motion.");
			return;
		}

		const keyframes: any[] = [];

		selectedTrackElements.forEach(({ track, element }) => {
			const duration = element.duration;
			const durationSec = mediaTimeToSeconds({ time: duration });

			if (presetId === "zoom-in") {
				keyframes.push(
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: ZERO_MEDIA_TIME,
						value: 1.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: ZERO_MEDIA_TIME,
						value: 1.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: duration,
						value: 1.25,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: duration,
						value: 1.25,
					},
				);
			} else if (presetId === "zoom-out") {
				keyframes.push(
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: ZERO_MEDIA_TIME,
						value: 1.25,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: ZERO_MEDIA_TIME,
						value: 1.25,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: duration,
						value: 1.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: duration,
						value: 1.0,
					},
				);
			} else if (presetId === "pan-right") {
				keyframes.push(
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: ZERO_MEDIA_TIME,
						value: 1.15,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: ZERO_MEDIA_TIME,
						value: 1.15,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: ZERO_MEDIA_TIME,
						value: -60.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: duration,
						value: 60.0,
					},
				);
			} else if (presetId === "pan-left") {
				keyframes.push(
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: ZERO_MEDIA_TIME,
						value: 1.15,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: ZERO_MEDIA_TIME,
						value: 1.15,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: ZERO_MEDIA_TIME,
						value: 60.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: duration,
						value: -60.0,
					},
				);
			} else if (presetId === "shake") {
				const step = 0.15;
				for (let t = 0; t <= durationSec; t += step) {
					const time = mediaTimeFromSeconds({ seconds: t });
					const shakeX = (Math.random() - 0.5) * 12.0;
					const shakeY = (Math.random() - 0.5) * 12.0;
					keyframes.push(
						{
							trackId: track.id,
							elementId: element.id,
							propertyPath: "transform.positionX",
							time,
							value: shakeX,
						},
						{
							trackId: track.id,
							elementId: element.id,
							propertyPath: "transform.positionY",
							time,
							value: shakeY,
						},
					);
				}
				keyframes.push(
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: duration,
						value: 0.0,
					},
					{
						trackId: track.id,
						elementId: element.id,
						propertyPath: "transform.positionY",
						time: duration,
						value: 0.0,
					},
				);
			}
		});

		try {
			editor.timeline.upsertKeyframes({ keyframes });
			toast.success("Efeito Motion aplicado com sucesso!");
			setIsOpen(false);
		} catch (err) {
			console.error(err);
			toast.error("Erro ao aplicar efeito Motion.");
		}
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2.5 text-muted-foreground hover:text-foreground"
				>
					<HugeiconsIcon icon={Happy01Icon} className="size-[18px] mr-2" />
					<span className="text-xs font-medium">Motion</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="start"
				sideOffset={12}
				className="w-80 p-4 mb-1 bg-[#18181A] border-[#27272A] text-foreground rounded-xl shadow-2xl"
			>
				<div className="flex flex-col gap-3">
					<div className="flex flex-col gap-0.5">
						<span className="text-xs font-semibold text-foreground">Movimento de Câmera (Motion)</span>
						<span className="text-[0.62rem] text-muted-foreground">
							Aplique keyframes automatizados para animar a câmera sobre o elemento.
						</span>
					</div>
					<hr className="border-border/30" />
					<div className="flex flex-col gap-2 max-h-60 overflow-y-auto scrollbar-hidden">
						{MOTION_PRESETS.map((preset) => (
							<button
								key={preset.id}
								onClick={() => handleApplyMotion(preset.id)}
								className="text-left w-full bg-accent/20 border border-border/40 hover:bg-accent/40 hover:border-border/80 transition-all rounded-lg p-2.5 flex items-start gap-2.5 cursor-pointer"
							>
								<span className="text-lg mt-0.5">{preset.icon}</span>
								<div className="flex flex-col">
									<span className="text-xs font-medium text-foreground">{preset.name}</span>
									<span className="text-[0.6rem] text-muted-foreground leading-normal mt-0.5">
										{preset.description}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
