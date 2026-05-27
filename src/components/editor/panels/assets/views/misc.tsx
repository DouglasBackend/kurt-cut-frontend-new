"use client";

import { useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { usePreviewStore } from "@/preview/preview-store";
import { processMediaAssets } from "@/media/processing";
import { buildElementFromMedia } from "@/timeline/element-utils";
import { mediaTimeFromSeconds } from "@/wasm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { SlidersHorizontalIcon, MusicNote03Icon } from "@hugeicons/core-free-icons";

// WAV encoder helper
function encodeWAV(samples: Float32Array, sampleRate: number) {
	const buffer = new ArrayBuffer(44 + samples.length * 2);
	const view = new DataView(buffer);

	/* RIFF identifier */
	writeString(view, 0, 'RIFF');
	/* file length */
	view.setUint32(4, 36 + samples.length * 2, true);
	/* RIFF type */
	writeString(view, 8, 'WAVE');
	/* format chunk identifier */
	writeString(view, 12, 'fmt ');
	/* format chunk length */
	view.setUint32(16, 16, true);
	/* sample format (raw) */
	view.setUint16(20, 1, true);
	/* channel count */
	view.setUint16(22, 1, true);
	/* sample rate */
	view.setUint32(24, sampleRate, true);
	/* byte rate (sample rate * block align) */
	view.setUint32(28, sampleRate * 2, true);
	/* block align (channel count * bytes per sample) */
	view.setUint16(32, 2, true);
	/* bits per sample */
	view.setUint16(34, 16, true);
	/* data chunk identifier */
	writeString(view, 36, 'data');
	/* chunk length */
	view.setUint32(40, samples.length * 2, true);

	floatTo16BitPCM(view, 44, samples);

	return new Blob([view], { type: 'audio/wav' });
}

function floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
	for (let i = 0; i < input.length; i++, offset += 2) {
		let s = Math.max(-1, Math.min(1, input[i]));
		output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
	}
}

function writeString(view: DataView, offset: number, string: string) {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}

const SFX_PRESETS = [
	{
		id: "laser",
		name: "Laser Retro",
		description: "Disparo clássico de ficção científica com varredura exponencial.",
		icon: "🔫",
		generate: (sampleRate: number) => {
			const durationSec = 0.4;
			const numSamples = Math.floor(sampleRate * durationSec);
			const samples = new Float32Array(numSamples);
			for (let i = 0; i < numSamples; i++) {
				const t = i / sampleRate;
				const freq = 1200 * Math.exp(-8 * t);
				const amp = Math.exp(-6 * t);
				samples[i] = Math.sin(2 * Math.PI * freq * t) * amp;
			}
			return { samples, durationSec };
		},
	},
	{
		id: "explosion",
		name: "Explosão",
		description: "Impacto grave procedural simulado com ruído e rumble.",
		icon: "💥",
		generate: (sampleRate: number) => {
			const durationSec = 0.9;
			const numSamples = Math.floor(sampleRate * durationSec);
			const samples = new Float32Array(numSamples);
			let lastNoise = 0;
			for (let i = 0; i < numSamples; i++) {
				const t = i / sampleRate;
				const noise = Math.random() - 0.5;
				lastNoise = 0.88 * lastNoise + 0.12 * noise;
				const amp = Math.exp(-3.5 * t);
				const rumble = Math.sin(2 * Math.PI * 55 * t) * 0.35;
				samples[i] = (lastNoise * 0.75 + rumble) * amp;
			}
			return { samples, durationSec };
		},
	},
	{
		id: "coin",
		name: "Moeda (Coin)",
		description: "Toque clássico de arcade de 8 bits (B5 seguido de E6).",
		icon: "🪙",
		generate: (sampleRate: number) => {
			const durationSec = 0.3;
			const numSamples = Math.floor(sampleRate * durationSec);
			const samples = new Float32Array(numSamples);
			for (let i = 0; i < numSamples; i++) {
				const t = i / sampleRate;
				const freq = t < 0.08 ? 987.77 : 1318.51;
				const amp = Math.exp(-4.5 * t);
				samples[i] = Math.sin(2 * Math.PI * freq * t) * amp;
			}
			return { samples, durationSec };
		},
	},
	{
		id: "powerup",
		name: "Power Up",
		description: "Varredura retro ascendente de onda triangular com vibrato.",
		icon: "⚡",
		generate: (sampleRate: number) => {
			const durationSec = 0.7;
			const numSamples = Math.floor(sampleRate * durationSec);
			const samples = new Float32Array(numSamples);
			for (let i = 0; i < numSamples; i++) {
				const t = i / sampleRate;
				const baseFreq = 220 + (880 - 220) * (t / durationSec);
				const vibrato = Math.sin(2 * Math.PI * 18 * t) * 15;
				const freq = baseFreq + vibrato;
				const rawPhase = (t * freq) % 1.0;
				const triVal = rawPhase < 0.5 ? 4.0 * rawPhase - 1.0 : 3.0 - 4.0 * rawPhase;
				const amp = Math.exp(-2.5 * t);
				samples[i] = triVal * amp * 0.6;
			}
			return { samples, durationSec };
		},
	},
];

export function MiscView() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());

	const activeGuide = usePreviewStore((state) => state.activeGuide);
	const toggleGuide = usePreviewStore((state) => state.toggleGuide);

	const [generatingId, setGeneratingId] = useState<string | null>(null);

	const handleGenerateSfx = async (preset: typeof SFX_PRESETS[0]) => {
		if (!activeProject) return;

		setGeneratingId(preset.id);
		const toastId = toast.loading(`Sintetizando "${preset.name}"...`);

		setTimeout(async () => {
			try {
				const sampleRate = 22050;
				const { samples, durationSec } = preset.generate(sampleRate);
				const wavBlob = encodeWAV(samples, sampleRate);
				const file = new File([wavBlob], `${preset.id}_${Date.now()}.wav`, { type: "audio/wav" });

				const processed = await processMediaAssets({ files: [file] });
				if (processed.length === 0) {
					throw new Error("Erro ao processar arquivo de áudio.");
				}

				const asset = await editor.media.addMediaAsset({
					projectId: activeProject.metadata.id,
					asset: processed[0],
				});

				if (!asset) {
					throw new Error("Erro ao adicionar áudio ao projeto.");
				}

				const currentTime = editor.playback.getCurrentTime();
				const element = buildElementFromMedia({
					mediaId: asset.id,
					mediaType: "audio",
					name: preset.name,
					duration: mediaTimeFromSeconds({ seconds: durationSec }),
					startTime: currentTime,
				});

				editor.timeline.insertElement({
					element,
					placement: { mode: "auto" },
				});

				toast.success(`Efeito "${preset.name}" adicionado à timeline!`, { id: toastId });
			} catch (e) {
				console.error(e);
				toast.error(`Falha ao gerar o efeito "${preset.name}"`, { id: toastId });
			} finally {
				setGeneratingId(null);
			}
		}, 1000);
	};

	return (
		<PanelView title="Diversos & SFX">
			<div className="flex flex-col gap-5 p-2">
				{/* Safe Zones / Grid Overlays */}
				<div className="flex flex-col gap-2">
					<h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
						<HugeiconsIcon icon={SlidersHorizontalIcon} className="size-3.5 text-primary" />
						Guias e Zonas de Segurança
					</h3>
					<p className="text-[0.68rem] text-muted-foreground leading-normal mb-1">
						Alterne overlays visuais para garantir que seus textos e elementos cruciais não fiquem escondidos pela interface das redes sociais.
					</p>
					<div className="grid grid-cols-2 gap-2">
						<Button
							size="sm"
							variant={activeGuide === "tiktok" ? "default" : "secondary"}
							className="h-7 text-[0.68rem] font-medium transition-all"
							onClick={() => toggleGuide("tiktok")}
						>
							TikTok
						</Button>
						<Button
							size="sm"
							variant={activeGuide === "ig-reels" ? "default" : "secondary"}
							className="h-7 text-[0.68rem] font-medium transition-all"
							onClick={() => toggleGuide("ig-reels")}
						>
							Instagram Reels
						</Button>
						<Button
							size="sm"
							variant={activeGuide === "yt-shorts" ? "default" : "secondary"}
							className="h-7 text-[0.68rem] font-medium transition-all"
							onClick={() => toggleGuide("yt-shorts")}
						>
							YouTube Shorts
						</Button>
						<Button
							size="sm"
							variant={activeGuide === "grid" ? "default" : "secondary"}
							className="h-7 text-[0.68rem] font-medium transition-all"
							onClick={() => toggleGuide("grid")}
						>
							Regra dos Terços (Grid)
						</Button>
					</div>
				</div>

				<hr className="border-border/30" />

				{/* Synthesized SFX */}
				<div className="flex flex-col gap-2">
					<h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
						<HugeiconsIcon icon={MusicNote03Icon} className="size-3.5 text-primary" />
						Gerador de SFX Retro (8-bit)
					</h3>
					<p className="text-[0.68rem] text-muted-foreground leading-normal mb-2">
						Sintetize efeitos sonoros procedurais instantaneamente sem precisar de arquivos externos.
					</p>
					<div className="flex flex-col gap-2.5">
						{SFX_PRESETS.map((preset) => (
							<div
								key={preset.id}
								className="bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all rounded-xl p-3 flex items-center justify-between gap-3"
							>
								<div className="flex gap-2.5 items-center min-w-0">
									<span className="text-2xl select-none">{preset.icon}</span>
									<div className="flex flex-col min-w-0">
										<span className="text-[0.72rem] font-semibold text-foreground truncate">
											{preset.name}
										</span>
										<span className="text-[0.62rem] text-muted-foreground line-clamp-1">
											{preset.description}
										</span>
									</div>
								</div>
								<Button
									size="sm"
									variant="secondary"
									className="h-6 px-2 text-[0.65rem] shrink-0 font-medium"
									disabled={generatingId !== null}
									onClick={() => handleGenerateSfx(preset)}
								>
									{generatingId === preset.id ? (
										<span className="animate-spin">⚡</span>
									) : (
										"Sintetizar"
									)}
								</Button>
							</div>
						))}
					</div>
				</div>
			</div>
		</PanelView>
	);
}
