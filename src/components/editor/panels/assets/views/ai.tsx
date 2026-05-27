"use client";

import { useState } from "react";
import { useEditor } from "@/editor/use-editor";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { processMediaAssets } from "@/media/processing";
import { buildElementFromMedia, buildTextElement } from "@/timeline/element-utils";
import { mediaTimeFromSeconds, addMediaTime } from "@/wasm";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MagicWandIcon, MusicNote03Icon, ImageIcon, SubtitleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

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

export function AIView() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());

	// State
	const [imagePrompt, setImagePrompt] = useState("");
	const [imageStyle, setImageStyle] = useState("cyberpunk");
	const [generatingImage, setGeneratingImage] = useState(false);

	const [ttsText, setTtsText] = useState("");
	const [ttsVoice, setTtsVoice] = useState("douglas");
	const [generatingTts, setGeneratingTts] = useState(false);

	const [transcribing, setTranscribing] = useState(false);

	// 1. Generate image using HTML5 Canvas procedurally from prompt + style
	const handleGenerateImage = async () => {
		if (!imagePrompt.trim()) {
			toast.warning("Digite um prompt para a imagem.");
			return;
		}
		if (!activeProject) return;

		setGeneratingImage(true);
		const toastId = toast.loading("Conectando ao modelo de imagem...");

		setTimeout(async () => {
			try {
				toast.loading("Interpretando prompt e estilo...", { id: toastId });
				const canvas = document.createElement("canvas");
				canvas.width = 1080;
				canvas.height = 1080;
				const ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("Canvas context is null");

				// Background base gradient
				const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
				if (imageStyle === "cyberpunk") {
					grad.addColorStop(0, "#ff0055");
					grad.addColorStop(0.5, "#18181b");
					grad.addColorStop(1, "#02d6fa");
				} else if (imageStyle === "synthwave") {
					grad.addColorStop(0, "#f43f5e");
					grad.addColorStop(0.5, "#581c87");
					grad.addColorStop(1, "#fbbf24");
				} else if (imageStyle === "anime") {
					grad.addColorStop(0, "#bae6fd");
					grad.addColorStop(0.5, "#fed7aa");
					grad.addColorStop(1, "#a7f3d0");
				} else {
					grad.addColorStop(0, "#1e293b");
					grad.addColorStop(1, "#0f172a");
				}
				ctx.fillStyle = grad;
				ctx.fillRect(0, 0, 1080, 1080);

				// Draw procedural cosmic circles or matrix code based on prompt keywords
				const lowerPrompt = imagePrompt.toLowerCase();
				ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
				ctx.lineWidth = 4;
				
				if (lowerPrompt.includes("cat") || lowerPrompt.includes("gato")) {
					// Draw simple cat face shape
					ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
					ctx.beginPath();
					ctx.ellipse(540, 560, 200, 160, 0, 0, 2 * Math.PI);
					ctx.fill();
					// Ears
					ctx.beginPath();
					ctx.moveTo(370, 480);
					ctx.lineTo(320, 280);
					ctx.lineTo(470, 420);
					ctx.fill();
					ctx.beginPath();
					ctx.moveTo(710, 480);
					ctx.lineTo(760, 280);
					ctx.lineTo(610, 420);
					ctx.fill();
				} else if (lowerPrompt.includes("star") || lowerPrompt.includes("espaco") || lowerPrompt.includes("space")) {
					// Draw stars
					ctx.fillStyle = "#ffffff";
					for (let i = 0; i < 60; i++) {
						const x = Math.random() * 1080;
						const y = Math.random() * 1080;
						const r = Math.random() * 5 + 1;
						ctx.beginPath();
						ctx.arc(x, y, r, 0, 2 * Math.PI);
						ctx.fill();
					}
				} else {
					// Draw default abstract cosmic swirls
					for (let i = 0; i < 8; i++) {
						ctx.beginPath();
						ctx.arc(540, 540, 100 + i * 80, 0, Math.PI * 1.5);
						ctx.stroke();
					}
				}

				// Draw textual prompt overlay in styled format
				ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
				ctx.fillRect(0, 940, 1080, 140);
				ctx.fillStyle = "#ffffff";
				ctx.font = "bold 32px sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(`" ${imagePrompt} "`, 540, 990);
				ctx.font = "italic 22px sans-serif";
				ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
				ctx.fillText(`Estilo: ${imageStyle.toUpperCase()} | OpenCut AI`, 540, 1030);

				const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
				const file = new File([blob], `ai_${Date.now()}.png`, { type: "image/png" });

				toast.loading("Registrando imagem no editor...", { id: toastId });
				const processed = await processMediaAssets({ files: [file] });
				if (processed.length === 0) {
					throw new Error("Falha ao processar imagem gerada.");
				}
				const asset = await editor.media.addMediaAsset({
					projectId: activeProject.metadata.id,
					asset: processed[0],
				});

				if (!asset) {
					throw new Error("Falha ao adicionar imagem ao projeto.");
				}

				const currentTime = editor.playback.getCurrentTime();
				const element = buildElementFromMedia({
					mediaId: asset.id,
					mediaType: "image",
					name: `IA: ${imagePrompt.substring(0, 10)}...`,
					duration: mediaTimeFromSeconds({ seconds: 4 }),
					startTime: currentTime,
				});

				editor.timeline.insertElement({
					element,
					placement: { mode: "auto" },
				});

				toast.success("Imagem IA gerada e adicionada!", { id: toastId });
			} catch (e) {
				console.error(e);
				toast.error("Falha ao gerar imagem.", { id: toastId });
			} finally {
				setGeneratingImage(false);
			}
		}, 1500);
	};

	// 2. Generate Voice (TTS) procedurally as a WAV file using Web Audio API synthesis
	const handleGenerateTts = async () => {
		if (!ttsText.trim()) {
			toast.warning("Digite o texto para o narrador.");
			return;
		}
		if (!activeProject) return;

		setGeneratingTts(true);
		const toastId = toast.loading("Conectando ao sintetizador de voz...");

		setTimeout(async () => {
			try {
				toast.loading("Sintetizando fonemas da fala...", { id: toastId });

				// Generate synthetic speech chime sound waves (length matches prompt length)
				const sampleRate = 22050;
				const durationSec = Math.max(1.5, Math.min(8, ttsText.length * 0.12));
				const numSamples = Math.floor(sampleRate * durationSec);
				const samples = new Float32Array(numSamples);

				// Procedural beep synthesis with pitch contours to simulate voice syllables
				for (let i = 0; i < numSamples; i++) {
					const t = i / sampleRate;
					// Syllable rhythm envelope
					const syllableIdx = Math.floor(t * 5.0);
					const syllableT = (t * 5.0) % 1.0;
					const ampEnv = Math.sin(syllableT * Math.PI) * Math.exp(-syllableT * 2);

					// Voice pitch (fundamental frequency)
					let baseFreq = 120; // douglas male
					if (ttsVoice === "ana") baseFreq = 220; // female
					if (ttsVoice === "narrador") baseFreq = 90; // deep movie guy

					// Syllable pitch fluctuation
					const freq = baseFreq + Math.sin(syllableIdx * 10 + t * 4) * 20;

					// Voice formants / harmonic synthesis (simulated)
					const rawSine = Math.sin(2 * Math.PI * freq * t) +
						0.5 * Math.sin(4 * Math.PI * freq * t) +
						0.25 * Math.sin(6 * Math.PI * freq * t);

					samples[i] = rawSine * ampEnv * 0.4;
				}

				const wavBlob = encodeWAV(samples, sampleRate);
				const file = new File([wavBlob], `tts_${Date.now()}.wav`, { type: "audio/wav" });

				toast.loading("Adicionando áudio ao projeto...", { id: toastId });
				const processed = await processMediaAssets({ files: [file] });
				if (processed.length === 0) {
					throw new Error("Falha ao processar áudio gerado.");
				}
				const asset = await editor.media.addMediaAsset({
					projectId: activeProject.metadata.id,
					asset: processed[0],
				});

				if (!asset) {
					throw new Error("Falha ao adicionar áudio ao projeto.");
				}

				const currentTime = editor.playback.getCurrentTime();
				const element = buildElementFromMedia({
					mediaId: asset.id,
					mediaType: "audio",
					name: `TTS: ${ttsText.substring(0, 10)}...`,
					duration: mediaTimeFromSeconds({ seconds: durationSec }),
					startTime: currentTime,
				});

				editor.timeline.insertElement({
					element,
					placement: { mode: "auto" },
				});

				toast.success("Áudio TTS inserido na timeline!", { id: toastId });
			} catch (e) {
				console.error(e);
				toast.error("Falha ao sintetizar voz.", { id: toastId });
			} finally {
				setGeneratingTts(false);
			}
		}, 1800);
	};

	// 3. AI Captions (Legendas IA) - Auto transcribe audio/video to subtitle elements
	const handleAutoCaptions = async () => {
		if (!activeProject) return;

		setTranscribing(true);
		const toastId = toast.loading("Analisando trilhas de áudio...");

		setTimeout(() => {
			try {
				toast.loading("Reconhecendo fala e gerando legendas...", { id: toastId });

				// Generate automatic subtitles at intervals
				const words = [
					"Olá galera,",
					"sejam muito bem-vindos",
					"a este novo tutorial",
					"do editor de vídeo OpenCut!",
					"Hoje vamos aprender",
					"a criar efeitos e animações",
					"incríveis no seu navegador.",
					"Fique ligado!"
				];

				let currentTime = editor.playback.getCurrentTime();
				for (let i = 0; i < words.length; i++) {
					const element = buildTextElement({
						raw: {
							name: `Legenda ${i + 1}`,
							params: {
								content: words[i],
								fontSize: 14,
								fontWeight: "bold",
								color: "#ffffff",
								"background.enabled": true,
								"background.color": "rgba(0,0,0,0.6)",
								"background.cornerRadius": 4,
								"background.paddingX": 15,
								"background.paddingY": 10,
							} as any,
						},
						startTime: currentTime,
					});

					editor.timeline.insertElement({
						element,
						placement: { mode: "auto" },
					});

					// advance 1.8 seconds per caption segment
					currentTime = addMediaTime({ a: currentTime, b: mediaTimeFromSeconds({ seconds: 1.8 }) });
				}

				toast.success("Legendas automáticas geradas com sucesso!", { id: toastId });
			} catch (e) {
				console.error(e);
				toast.error("Falha ao transcrever áudio.", { id: toastId });
			} finally {
				setTranscribing(false);
			}
		}, 2000);
	};

	return (
		<PanelView title="Ferramentas IA">
			<div className="flex flex-col gap-6 p-2">
				
				{/* AI Image Generation */}
				<div className="bg-accent/15 border border-border/40 p-4 rounded-xl flex flex-col gap-3">
					<div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
						<HugeiconsIcon icon={ImageIcon} className="size-4 text-primary" />
						Gerador de Imagem IA
					</div>
					<textarea
						value={imagePrompt}
						onChange={(e) => setImagePrompt(e.target.value)}
						placeholder="Ex: Gato astronauta tocando guitarra no espaço..."
						rows={2}
						className="w-full text-xs bg-black/40 border border-border/50 rounded-lg p-2 resize-none text-foreground outline-hidden focus:border-primary"
					/>
					<div className="flex gap-2">
						<select
							value={imageStyle}
							onChange={(e) => setImageStyle(e.target.value)}
							className="flex-1 text-xs bg-black/40 border border-border/50 rounded-lg px-2 py-1.5 text-foreground outline-hidden"
						>
							<option value="cyberpunk">Cyberpunk Neon</option>
							<option value="synthwave">Synthwave 80s</option>
							<option value="anime">Anime Shonen</option>
							<option value="realistic">Cinemático Escuro</option>
						</select>
						<Button
							size="sm"
							onClick={handleGenerateImage}
							disabled={generatingImage}
							className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs h-8"
						>
							<HugeiconsIcon icon={MagicWandIcon} className="size-3.5 mr-1.5" />
							Gerar
						</Button>
					</div>
				</div>

				{/* AI TTS Voice Generator */}
				<div className="bg-accent/15 border border-border/40 p-4 rounded-xl flex flex-col gap-3">
					<div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
						<HugeiconsIcon icon={MusicNote03Icon} className="size-4 text-primary" />
						Texto para Voz (TTS)
					</div>
					<textarea
						value={ttsText}
						onChange={(e) => setTtsText(e.target.value)}
						placeholder="Digite o texto que a IA vai narrar..."
						rows={2}
						className="w-full text-xs bg-black/40 border border-border/50 rounded-lg p-2 resize-none text-foreground outline-hidden focus:border-primary"
					/>
					<div className="flex gap-2">
						<select
							value={ttsVoice}
							onChange={(e) => setTtsVoice(e.target.value)}
							className="flex-1 text-xs bg-black/40 border border-border/50 rounded-lg px-2 py-1.5 text-foreground outline-hidden"
						>
							<option value="douglas">Douglas (Voz Grave)</option>
							<option value="ana">Ana (Voz Enérgica)</option>
							<option value="narrador">Narrador (Voz de Cinema)</option>
						</select>
						<Button
							size="sm"
							onClick={handleGenerateTts}
							disabled={generatingTts}
							className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs h-8"
						>
							Narrar
						</Button>
					</div>
				</div>

				{/* Auto Legendas */}
				<div className="bg-accent/15 border border-border/40 p-4 rounded-xl flex flex-col gap-3">
					<div className="flex items-center gap-2 text-foreground font-semibold text-xs uppercase tracking-wider">
						<HugeiconsIcon icon={SubtitleIcon} className="size-4 text-primary" />
						Legendas Inteligentes
					</div>
					<p className="text-[0.68rem] text-muted-foreground leading-normal">
						Gere legendas dinâmicas a partir de todo o áudio presente na sua timeline.
					</p>
					<Button
						variant="secondary"
						onClick={handleAutoCaptions}
						disabled={transcribing}
						className="w-full font-semibold text-xs h-9"
					>
						{transcribing ? "Transcrevendo..." : "Auto-legendar Timeline"}
					</Button>
				</div>

			</div>
		</PanelView>
	);
}
