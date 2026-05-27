"use client";

import { useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { processMediaAssets } from "@/media/processing";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { mediaTimeFromSeconds } from "@/wasm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const LIBRARY_TEMPLATES = [
	{
		id: "cyber-grad",
		name: "Cyberpunk Gradient",
		type: "image" as const,
		description: "Degradê Neon vibrante para fundo",
		previewStyle: "bg-gradient-to-tr from-[#ff0055] to-[#02d6fa]",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
			grad.addColorStop(0, "#ff0055");
			grad.addColorStop(0.5, "#cc00ff");
			grad.addColorStop(1, "#02d6fa");
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, 1920, 1080);
		},
	},
	{
		id: "sunset-grad",
		name: "Midnight Sunset",
		type: "image" as const,
		description: "Degradê quente com tom roxo",
		previewStyle: "bg-gradient-to-tr from-[#ff4500] to-[#9400d3]",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
			grad.addColorStop(0, "#ff4500");
			grad.addColorStop(0.6, "#9400d3");
			grad.addColorStop(1, "#1e1b4b");
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, 1920, 1080);
		},
	},
	{
		id: "forest-grad",
		name: "Deep Forest",
		type: "image" as const,
		description: "Verde floresta misterioso",
		previewStyle: "bg-gradient-to-tr from-[#14532d] to-[#8fbc8f]",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			const grad = ctx.createLinearGradient(0, 0, 1920, 1080);
			grad.addColorStop(0, "#052e16");
			grad.addColorStop(0.5, "#14532d");
			grad.addColorStop(1, "#8fbc8f");
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, 1920, 1080);
		},
	},
	{
		id: "grid-overlay",
		name: "Abstract Tech Grid",
		type: "image" as const,
		description: "Grid geométrico futurista",
		previewStyle: "bg-neutral-900 border border-neutral-700/30 flex items-center justify-center text-xs font-mono text-neutral-500",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.fillStyle = "#0c0c0e";
			ctx.fillRect(0, 0, 1920, 1080);
			
			ctx.strokeStyle = "rgba(2, 214, 250, 0.15)";
			ctx.lineWidth = 1;
			const gridSize = 40;
			for (let x = 0; x < 1920; x += gridSize) {
				ctx.beginPath();
				ctx.moveTo(x, 0);
				ctx.lineTo(x, 1080);
				ctx.stroke();
			}
			for (let y = 0; y < 1080; y += gridSize) {
				ctx.beginPath();
				ctx.moveTo(0, y);
				ctx.lineTo(1920, y);
				ctx.stroke();
			}
		},
	},
];

export function LibraryView() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const [loadingId, setLoadingId] = useState<string | null>(null);

	const handleAddTemplate = async (template: typeof LIBRARY_TEMPLATES[0]) => {
		if (!activeProject) {
			toast.error("Nenhum projeto ativo");
			return;
		}

		setLoadingId(template.id);
		const toastId = toast.loading(`Gerando "${template.name}"...`);

		try {
			// Generate standard 1080p template offline
			const canvas = document.createElement("canvas");
			canvas.width = 1920;
			canvas.height = 1080;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not get canvas context");

			template.generate(canvas, ctx);

			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((b) => (b ? resolve(b) : reject("Blob creation failed")), "image/png");
			});

			const file = new File([blob], `${template.id}.png`, { type: "image/png" });
			const processedAssets = await processMediaAssets({ files: [file] });

			if (processedAssets.length === 0) {
				throw new Error("Asset processing failed");
			}

			const asset = processedAssets[0];
			const addedAsset = await editor.media.addMediaAsset({
				projectId: activeProject.metadata.id,
				asset,
			});

			if (!addedAsset) {
				throw new Error("Could not register library asset");
			}

			// Now insert into the timeline
			const currentTime = editor.playback.getCurrentTime();
			const element = buildElementFromMedia({
				mediaId: addedAsset.id,
				mediaType: "image",
				name: template.name,
				duration: mediaTimeFromSeconds({ seconds: 5 }),
				startTime: currentTime,
			});

			editor.timeline.insertElement({
				element,
				placement: { mode: "auto" },
			});

			toast.success(`"${template.name}" adicionado à timeline e biblioteca!`, { id: toastId });
		} catch (err) {
			console.error(err);
			toast.error(`Erro ao gerar "${template.name}"`, { id: toastId });
		} finally {
			setLoadingId(null);
		}
	};

	return (
		<PanelView title="Bibliotecas">
			<div className="flex flex-col gap-4 p-2">
				<p className="text-[0.7rem] text-muted-foreground leading-normal">
					Adicione fundos geométricos e degradês gerados localmente em alta resolução diretamente para o seu projeto.
				</p>
				<div className="grid grid-cols-1 gap-3">
					{LIBRARY_TEMPLATES.map((template) => (
						<div
							key={template.id}
							className="bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all duration-150 rounded-xl overflow-hidden flex"
						>
							<div className={`w-28 h-20 shrink-0 ${template.previewStyle} relative`}>
								{template.id === "grid-overlay" && <span className="absolute inset-0 flex items-center justify-center text-[0.6rem] opacity-50">Grid</span>}
							</div>
							<div className="flex-1 p-3 flex flex-col justify-between">
								<div className="flex flex-col gap-0.5">
									<h4 className="text-xs font-semibold text-foreground truncate">
										{template.name}
									</h4>
									<span className="text-[0.65rem] text-muted-foreground line-clamp-1">
										{template.description}
									</span>
								</div>
								<div className="flex justify-end">
									<Button
										size="sm"
										variant="secondary"
										className="h-6 px-2 text-[0.68rem] font-medium"
										disabled={loadingId !== null}
										onClick={() => handleAddTemplate(template)}
									>
										{loadingId === template.id ? (
											<span className="animate-spin mr-1">⚡</span>
										) : (
											<HugeiconsIcon icon={PlayIcon} className="size-3 mr-1" />
										)}
										Inserir
									</Button>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</PanelView>
	);
}
