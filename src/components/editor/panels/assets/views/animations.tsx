"use client";

import { useEditor } from "@/editor/use-editor";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { mediaTimeFromSeconds, mediaTimeToSeconds } from "@/wasm";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { StarIcon } from "@hugeicons/core-free-icons";

interface AnimationPreset {
	id: string;
	name: string;
	description: string;
	icon: string;
}

const ANIMATION_PRESETS: AnimationPreset[] = [
	{
		id: "spin",
		name: "Spin (Giro)",
		description: "Giro contínuo tridimensional suave sobre o próprio eixo.",
		icon: "🔄",
	},
	{
		id: "shake",
		name: "Shake (Tremor)",
		description: "Tremor dinâmico rápido simulando instabilidade de câmera.",
		icon: "🫨",
	},
	{
		id: "pulse",
		name: "Pulse (Pulso)",
		description: "Efeito rítmico de zoom in/out suave simulando batimentos.",
		icon: "💓",
	},
	{
		id: "blink",
		name: "Blink (Piscado)",
		description: "Oscilação suave de opacidade para criar efeito de brilho/piscar.",
		icon: "💡",
	},
];

export function AnimationsView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();

	const handleApplyAnimation = (animationId: string) => {
		const selectedTrackElements = editor.timeline.getElementsWithTracks({
			elements: selectedElements,
		});

		if (selectedTrackElements.length === 0) {
			toast.warning("Selecione um elemento visual válido na timeline.");
			return;
		}

		const keyframes: any[] = [];

		selectedTrackElements.forEach((item) => {
			const element = item.element;
			const trackId = item.track.id;
			const duration = element.duration;
			const durationSec = mediaTimeToSeconds({ time: duration });

			// Sample keyframes at 0.1s intervals
			const step = 0.1;
			for (let t = 0; t <= durationSec; t += step) {
				const time = mediaTimeFromSeconds({ seconds: t });

				if (animationId === "spin") {
					// 360 degrees rotation every 2 seconds
					const rotateValue = (t / 2.0) * 360.0;
					keyframes.push({
						trackId,
						elementId: element.id,
						propertyPath: "transform.rotate",
						time,
						value: rotateValue,
					});
				} else if (animationId === "shake") {
					// 10Hz oscillation, 15px amplitude
					const positionX = Math.sin(t * Math.PI * 2 * 10) * 15;
					keyframes.push({
						trackId,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time,
						value: positionX,
					});
				} else if (animationId === "pulse") {
					// Pulse scale between 1.0 and 1.2
					const scaleValue = 1.0 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.18;
					keyframes.push(
						{
							trackId,
							elementId: element.id,
							propertyPath: "transform.scaleX",
							time,
							value: scaleValue,
						},
						{
							trackId,
							elementId: element.id,
							propertyPath: "transform.scaleY",
							time,
							value: scaleValue,
						}
					);
				} else if (animationId === "blink") {
					// Fade opacity between 0.3 and 1.0
					const opacityValue = 0.4 + Math.abs(Math.sin(t * Math.PI * 2)) * 0.6;
					keyframes.push({
						trackId,
						elementId: element.id,
						propertyPath: "opacity",
						time,
						value: opacityValue,
					});
				}
			}

			// Ensure a final keyframe at the exact element duration to loop or terminate cleanly
			const endTime = duration;
			if (animationId === "spin") {
				keyframes.push({
					trackId,
					elementId: element.id,
					propertyPath: "transform.rotate",
					time: endTime,
					value: (durationSec / 2.0) * 360.0,
				});
			} else if (animationId === "shake") {
				keyframes.push({
					trackId,
					elementId: element.id,
					propertyPath: "transform.positionX",
					time: endTime,
					value: 0,
				});
			} else if (animationId === "pulse") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: endTime,
						value: 1.0,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: endTime,
						value: 1.0,
					}
				);
			} else if (animationId === "blink") {
				keyframes.push({
					trackId,
					elementId: element.id,
					propertyPath: "opacity",
					time: endTime,
					value: 1.0,
				});
			}
		});

		try {
			editor.timeline.upsertKeyframes({ keyframes });
			toast.success(`Animação aplicada com sucesso!`);
		} catch (e) {
			console.error(e);
			toast.error("Erro ao aplicar animação.");
		}
	};

	return (
		<PanelView title="Animações">
			<div className="flex flex-col gap-4 p-2">
				<p className="text-[0.7rem] text-muted-foreground leading-normal">
					Selecione um elemento na timeline e selecione uma animação contínua para aplicar sequências automáticas de keyframes.
				</p>
				<div className="grid grid-cols-2 gap-2.5">
					{ANIMATION_PRESETS.map((preset) => (
						<button
							key={preset.id}
							onClick={() => handleApplyAnimation(preset.id)}
							className="text-left bg-accent/20 border border-border/40 hover:bg-accent/40 hover:border-border/80 transition-all duration-150 p-3 rounded-xl cursor-pointer flex flex-col gap-1.5 group active:scale-95"
						>
							<div className="flex items-center justify-between w-full">
								<span className="text-xl group-hover:scale-110 transition-transform duration-100">{preset.icon}</span>
								<HugeiconsIcon icon={StarIcon} className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-semibold text-foreground">
									{preset.name}
								</span>
								<span className="text-[0.62rem] text-muted-foreground leading-snug line-clamp-2">
									{preset.description}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>
		</PanelView>
	);
}
