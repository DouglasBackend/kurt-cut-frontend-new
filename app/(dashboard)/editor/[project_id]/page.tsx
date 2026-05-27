"use client";

import { useParams } from "next/navigation";
import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import { AssetsPanel } from "@/components/editor/panels/assets";
import { PropertiesPanel } from "@/components/editor/panels/properties";
import { Timeline } from "@/timeline/components";
import { PreviewPanel } from "@/preview/components";
import { EditorHeader } from "@/components/editor/editor-header";
import { EditorProvider } from "@/components/providers/editor-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePanelStore } from "@/editor/panel-store";
import { usePasteMedia } from "@/media/use-paste-media";
import { MobileGate } from "@/components/editor/mobile-gate";
import { useMemo, useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	createPreviewOverlayControl,
	isPreviewOverlayVisible,
	mergePreviewOverlaySources,
} from "@/preview/overlays";
import { usePreviewStore } from "@/preview/preview-store";
import { getGuidePreviewOverlaySource } from "@/guides";
import {
	bookmarkNotesPreviewOverlay,
	getBookmarkPreviewOverlaySource,
} from "@/timeline/bookmarks/index";

import { useEffect } from "react";
import { toast } from "sonner";
import { parseSubtitleFile } from "@/subtitles/parse";
import { insertCaptionChunksAsTextTrack } from "@/subtitles/insert";
import { AddMediaAssetCommand } from "@/commands/media";
import { InsertElementCommand } from "@/commands/timeline";
import { BatchCommand } from "@/commands";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { processMediaAssets } from "@/media/processing";
import { mediaTimeFromSeconds } from "@/wasm";

function KurtCutImporter({ projectId }: { projectId: string }) {
	const editor = useEditor();

	useEffect(() => {
		async function importData() {
			const videoUrl = sessionStorage.getItem(`import_video_${projectId}`);
			const srtText = sessionStorage.getItem(`import_srt_text_${projectId}`);

			if (!videoUrl) return;

			sessionStorage.removeItem(`import_video_${projectId}`);
			if (srtText) sessionStorage.removeItem(`import_srt_text_${projectId}`);

			try {
				toast.loading("Importing your video...", { id: "import-video" });

				// 1. Fetch Video Blob
				const videoRes = await fetch(videoUrl);
				const videoBlob = await videoRes.blob();
				const file = new File([videoBlob], "imported-video.mp4", { type: videoBlob.type || "video/mp4" });

				// 2. Add as Asset
				const processedAssets = await processMediaAssets({ files: [file] }); 
				if (!processedAssets || processedAssets.length === 0) throw new Error("Failed to process media asset");
				const asset = processedAssets[0];

				const addMediaCmd = new AddMediaAssetCommand({
					projectId: projectId,
					asset,
				});
				const assetId = addMediaCmd.getAssetId();

				// 3. Add to Timeline
				const duration = asset.duration != null ? mediaTimeFromSeconds({ seconds: asset.duration }) : mediaTimeFromSeconds({ seconds: 5 });
				const element = buildElementFromMedia({
					mediaId: assetId,
					mediaType: "video",
					name: "imported-video.mp4",
					duration: duration,
					startTime: mediaTimeFromSeconds({ seconds: 0 }),
				});

				const insertCmd = new InsertElementCommand({
					element,
					placement: { mode: "auto", trackType: "video" },
				});

				editor.command.execute({ command: new BatchCommand([addMediaCmd, insertCmd]) });
				toast.success("Video imported!", { id: "import-video" });

				// 4. Import SRT if exists
				if (srtText) {
					toast.loading("Importing subtitles...", { id: "import-srt" });
					
					const { captions, warnings } = parseSubtitleFile({ fileName: "subtitles.srt", input: srtText });
					
					if (captions.length > 0) {
						insertCaptionChunksAsTextTrack({ editor, captions });
						toast.success("Subtitles imported!", { id: "import-srt" });
					} else {
						toast.error("No valid subtitles found", { id: "import-srt" });
					}
				}
			} catch (err: any) {
				console.error("Failed to import Kurt Cut data:", err);
				toast.error("Failed to import video: " + err.message, { id: "import-video" });
			}
		}

		// Wait for project initialization
		const project = editor.project.getActiveOrNull();
		if (project && project.metadata.id === projectId) {
			importData();
		}
	}, [projectId, editor]);

	return null;
}

export default function Editor() {
	const params = useParams();
	const projectId = params.project_id as string;

	return (
		<MobileGate>
			<TooltipProvider>
				<EditorProvider projectId={projectId}>
					<div className="bg-background editor-workspace flex h-screen w-screen flex-col overflow-hidden">
						<DegradedRendererBanner />
						<EditorHeader />
						<div className="min-h-0 min-w-0 flex-1">
							<KurtCutImporter projectId={projectId} />
							<EditorLayout />
						</div>
					</div>
				</EditorProvider>
			</TooltipProvider>
		</MobileGate>
	);
}

function DegradedRendererBanner() {
	const isDegraded = useEditor((e) => e.renderer.isDegraded);
	const [dismissed, setDismissed] = useState(false);
	if (!isDegraded || dismissed) return null;

	return (
		<div className="bg-accent/50 border-b border-border/30 h-7 flex items-center justify-center gap-2 text-[0.7rem] text-muted-foreground">
			<span>For the best experience, open OpenCut in Chrome.</span>
			<Button
				variant="text"
				size="icon"
				className="p-0 w-auto [&_svg]:size-3.5"
				onClick={() => setDismissed(true)}
				aria-label="Dismiss"
			>
				<HugeiconsIcon icon={Cancel01Icon} />
			</Button>
		</div>
	);
}

function EditorLayout() {
	usePasteMedia();
	const { panels, setPanel } = usePanelStore();
	const activeScene = useEditor((editor) =>
		editor.scenes.getActiveSceneOrNull(),
	);
	const currentTime = useEditor((editor) => editor.playback.getCurrentTime());
	const activeGuide = usePreviewStore((state) => state.activeGuide);
	const overlays = usePreviewStore((state) => state.overlays);
	const setOverlayVisibility = usePreviewStore(
		(state) => state.setOverlayVisibility,
	);
	const showBookmarkNotes = isPreviewOverlayVisible({
		overlay: bookmarkNotesPreviewOverlay,
		overlays,
	});

	const overlaySource = useMemo(
		() =>
			mergePreviewOverlaySources({
				sources: [
					getGuidePreviewOverlaySource({
						guideId: activeGuide,
					}),
					activeScene
						? getBookmarkPreviewOverlaySource({
								bookmarks: activeScene.bookmarks,
								time: currentTime,
								isVisible: showBookmarkNotes,
							})
						: {
								definitions: [bookmarkNotesPreviewOverlay],
								instances: [],
							},
				],
			}),
		[activeGuide, activeScene, currentTime, showBookmarkNotes],
	);

	const overlayControls = useMemo(
		() =>
			overlaySource.definitions.map((overlay) =>
				createPreviewOverlayControl({ overlay, overlays }),
			),
		[overlaySource.definitions, overlays],
	);

	return (
		<ResizablePanelGroup
			direction="vertical"
			className="size-full gap-px"
			onLayout={(sizes) => {
				setPanel({
					panel: "mainContent",
					size: sizes[0] ?? panels.mainContent,
				});
				setPanel({
					panel: "timeline",
					size: sizes[1] ?? panels.timeline,
				});
			}}
		>
			<ResizablePanel
				defaultSize={panels.mainContent}
				minSize={30}
				maxSize={85}
				className="min-h-0"
			>
				<ResizablePanelGroup
					direction="horizontal"
					className="size-full gap-px px-2"
					onLayout={(sizes) => {
						setPanel({ panel: "tools", size: sizes[0] ?? panels.tools });
						setPanel({ panel: "preview", size: sizes[1] ?? panels.preview });
						setPanel({
							panel: "properties",
							size: sizes[2] ?? panels.properties,
						});
					}}
				>
					<ResizablePanel
						defaultSize={panels.tools}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<AssetsPanel />
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.preview}
						minSize={30}
						className="min-h-0 min-w-0 flex-1"
					>
						<PreviewPanel
							overlayControls={overlayControls}
							overlayInstances={overlaySource.instances}
							onOverlayVisibilityChange={setOverlayVisibility}
						/>
					</ResizablePanel>

					<ResizableHandle withHandle />

					<ResizablePanel
						defaultSize={panels.properties}
						minSize={15}
						maxSize={40}
						className="min-w-0"
					>
						<PropertiesPanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			</ResizablePanel>

			<ResizableHandle withHandle />

			<ResizablePanel
				defaultSize={panels.timeline}
				minSize={15}
				maxSize={70}
				className="min-h-0 px-2 pb-1.5"
			>
				<Timeline />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
