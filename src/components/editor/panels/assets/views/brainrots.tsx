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

const BRAINROT_TEMPLATES = [
	{
		id: "subway-surfers",
		name: "Subway Surfers Simulator",
		description: "Simulador procedural de Subway Surfers 3D",
		previewStyle: "bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-xs text-orange-500 font-bold",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			// Sky and ground
			const sky = ctx.createLinearGradient(0, 0, 0, 960);
			sky.addColorStop(0, "#bae6fd");
			sky.addColorStop(1, "#38bdf8");
			ctx.fillStyle = sky;
			ctx.fillRect(0, 0, 1080, 960);

			const ground = ctx.createLinearGradient(0, 960, 0, 1920);
			ground.addColorStop(0, "#451a03");
			ground.addColorStop(1, "#78350f");
			ctx.fillStyle = ground;
			ctx.fillRect(0, 960, 1080, 960);

			// Rails (Perspective lines)
			ctx.strokeStyle = "#475569";
			ctx.lineWidth = 15;
			const vanishingX = 540;
			const vanishingY = 800;

			// Draw 3 tracks
			const tracks = [-400, 0, 400];
			tracks.forEach((offset) => {
				ctx.beginPath();
				ctx.moveTo(vanishingX, vanishingY);
				ctx.lineTo(vanishingX + offset * 3, 1920);
				ctx.stroke();

				// Draw sleepers / rail ties
				ctx.strokeStyle = "#78350f";
				ctx.lineWidth = 10;
				for (let i = 0.1; i <= 1.0; i += 0.1) {
					const y = vanishingY + (1920 - vanishingY) * i;
					const x = vanishingX + offset * 3 * i;
					const w = 150 * i;
					ctx.beginPath();
					ctx.moveTo(x - w, y);
					ctx.lineTo(x + w, y);
					ctx.stroke();
				}
			});

			// Draw train/cube obstacles
			ctx.fillStyle = "#ef4444";
			ctx.fillRect(400, 1100, 280, 450); // Center train
			// Highlights
			ctx.fillStyle = "#fee2e2";
			ctx.fillRect(430, 1130, 70, 70);
			ctx.fillRect(580, 1130, 70, 70);

			// Floating coins
			ctx.fillStyle = "#eab308";
			ctx.shadowColor = "#facc15";
			ctx.shadowBlur = 30;
			for (let i = 0; i < 5; i++) {
				ctx.beginPath();
				ctx.arc(300 - i * 40, 1400 + i * 80, 25, 0, 2 * Math.PI);
				ctx.fill();
			}
			ctx.shadowBlur = 0; // reset

			// UI text overlay
			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 80px sans-serif";
			ctx.textAlign = "center";
			ctx.fillText("SCORE: 98,241", 540, 250);
		},
	},
	{
		id: "minecraft-parkour",
		name: "Minecraft Parkour",
		description: "Plataformas flutuantes em perspectiva isométrica",
		previewStyle: "bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-xs text-green-500 font-bold",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			// Sky gradient
			const sky = ctx.createLinearGradient(0, 0, 0, 1920);
			sky.addColorStop(0, "#082f49");
			sky.addColorStop(0.5, "#0284c7");
			sky.addColorStop(1, "#38bdf8");
			ctx.fillStyle = sky;
			ctx.fillRect(0, 0, 1080, 1920);

			// Draw clouds
			ctx.fillStyle = "rgba(255,255,255,0.7)";
			ctx.beginPath();
			ctx.arc(300, 400, 120, 0, Math.PI * 2);
			ctx.arc(450, 400, 160, 0, Math.PI * 2);
			ctx.arc(600, 400, 120, 0, Math.PI * 2);
			ctx.fill();

			// Isometric floating dirt blocks
			const drawBlock = (x: number, y: number, size: number) => {
				// Top grass
				ctx.fillStyle = "#22c55e";
				ctx.beginPath();
				ctx.moveTo(x, y - size / 2);
				ctx.lineTo(x + size, y - size);
				ctx.lineTo(x + size * 2, y - size / 2);
				ctx.lineTo(x + size, y);
				ctx.closePath();
				ctx.fill();

				// Left side (Dark dirt)
				ctx.fillStyle = "#78350f";
				ctx.beginPath();
				ctx.moveTo(x, y - size / 2);
				ctx.lineTo(x + size, y);
				ctx.lineTo(x + size, y + size);
				ctx.lineTo(x, y + size - size / 2);
				ctx.closePath();
				ctx.fill();

				// Right side (Light dirt)
				ctx.fillStyle = "#a16207";
				ctx.beginPath();
				ctx.moveTo(x + size, y);
				ctx.lineTo(x + size * 2, y - size / 2);
				ctx.lineTo(x + size * 2, y + size - size / 2);
				ctx.lineTo(x + size, y + size);
				ctx.closePath();
				ctx.fill();
			};

			drawBlock(100, 1300, 200);
			drawBlock(400, 1100, 200);
			drawBlock(700, 900, 200);

			// Cute retro logo overlay
			ctx.fillStyle = "rgba(0,0,0,0.5)";
			ctx.fillRect(100, 1750, 880, 100);
			ctx.fillStyle = "#ffffff";
			ctx.font = "bold 42px monospace";
			ctx.textAlign = "center";
			ctx.fillText("MODO PARKOUR ATIVADO", 540, 1815);
		},
	},
	{
		id: "slime-satisfying",
		name: "Slime Neon Marble",
		description: "Cores neon vibrantes e mesclas orgânicas",
		previewStyle: "bg-neutral-800 border border-neutral-700/50 flex items-center justify-center text-xs text-purple-500 font-bold",
		generate: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
			ctx.fillStyle = "#09090b";
			ctx.fillRect(0, 0, 1080, 1920);

			// Overlapping glowing slime waves
			for (let i = 0; i < 15; i++) {
				const x = 540 + Math.sin(i) * 300;
				const y = 960 + Math.cos(i) * 500;
				const r = 200 + Math.sin(i * 1.5) * 150;

				const grad = ctx.createRadialGradient(x, y, 10, x, y, r);
				if (i % 3 === 0) {
					grad.addColorStop(0, "#a855f7");
					grad.addColorStop(1, "transparent");
				} else if (i % 3 === 1) {
					grad.addColorStop(0, "#22c55e");
					grad.addColorStop(1, "transparent");
				} else {
					grad.addColorStop(0, "#3b82f6");
					grad.addColorStop(1, "transparent");
				}
				ctx.fillStyle = grad;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, 2 * Math.PI);
				ctx.fill();
			}

			// Swirl overlay lines
			ctx.strokeStyle = "rgba(255,255,255,0.08)";
			ctx.lineWidth = 5;
			for (let j = 0; j < 5; j++) {
				ctx.beginPath();
				ctx.arc(540, 960, 100 + j * 180, 0, Math.PI * 2);
				ctx.stroke();
			}
		},
	},
];

export function BrainrotsView() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const [generatingId, setGeneratingId] = useState<string | null>(null);

	const handleGenerateBrainrot = async (template: typeof BRAINROT_TEMPLATES[0]) => {
		if (!activeProject) {
			toast.error("Nenhum projeto ativo");
			return;
		}

		setGeneratingId(template.id);
		const toastId = toast.loading(`Criando fundo "${template.name}"...`);

		try {
			// Generate vertical HD image offline
			const canvas = document.createElement("canvas");
			canvas.width = 1080;
			canvas.height = 1920;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not get canvas 2d context");

			template.generate(canvas, ctx);

			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob((b) => (b ? resolve(b) : reject("Blob creation failed")), "image/png");
			});

			const file = new File([blob], `brainrot_${template.id}.png`, { type: "image/png" });
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
				throw new Error("Could not register generated brainrot asset");
			}

			// Now insert into the timeline
			const currentTime = editor.playback.getCurrentTime();
			const element = buildElementFromMedia({
				mediaId: addedAsset.id,
				mediaType: "image",
				name: template.name,
				duration: mediaTimeFromSeconds({ seconds: 6 }),
				startTime: currentTime,
			});

			editor.timeline.insertElement({
				element,
				placement: { mode: "auto" },
			});

			toast.success(`"${template.name}" adicionado à timeline!`, { id: toastId });
		} catch (err) {
			console.error(err);
			toast.error(`Erro ao gerar "${template.name}"`, { id: toastId });
		} finally {
			setGeneratingId(null);
		}
	};

	return (
		<PanelView title="Fundo Brainrot">
			<div className="flex flex-col gap-4 p-2">
				<p className="text-[0.7rem] text-muted-foreground leading-normal">
					Gere fundos procedurais de alta retenção visual e insira diretamente na sua timeline para preencher o espaço vertical.
				</p>
				<div className="grid grid-cols-1 gap-3">
					{BRAINROT_TEMPLATES.map((template) => (
						<div
							key={template.id}
							className="bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all duration-150 rounded-xl overflow-hidden flex"
						>
							<div className={`w-28 h-20 shrink-0 ${template.previewStyle} relative`}>
								{template.id === "subway-surfers" && <span>Subway</span>}
								{template.id === "minecraft-parkour" && <span>Minecraft</span>}
								{template.id === "slime-satisfying" && <span>Slime</span>}
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
										disabled={generatingId !== null}
										onClick={() => handleGenerateBrainrot(template)}
									>
										{generatingId === template.id ? (
											<span className="animate-spin mr-1">⚡</span>
										) : (
											<HugeiconsIcon icon={PlayIcon} className="size-3 mr-1" />
										)}
										Adicionar
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
