"use client";

import { useEditor } from "@/editor/use-editor";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { ZERO_MEDIA_TIME, mediaTimeFromSeconds } from "@/wasm";
import { toast } from "sonner";
import { FlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const TRANSITIONS = [
	{
		id: "fade-in",
		name: "Fade In",
		description: "Opacidade de 0% a 100% no início",
		icon: "🔅",
	},
	{
		id: "fade-out",
		name: "Fade Out",
		description: "Opacidade de 100% a 0% no final",
		icon: "🔆",
	},
	{
		id: "zoom-in",
		name: "Zoom In",
		description: "Escala cresce de 0% a 100%",
		icon: "🔍",
	},
	{
		id: "zoom-out",
		name: "Zoom Out",
		description: "Escala diminui no final",
		icon: "🔎",
	},
	{
		id: "slide-left",
		name: "Slide Esquerda",
		description: "Entra deslizando pela esquerda",
		icon: "⬅️",
	},
	{
		id: "slide-right",
		name: "Slide Direita",
		description: "Entra deslizando pela direita",
		icon: "➡️",
	},
];

export function TransitionsView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();

	const handleApplyTransition = (transitionId: string) => {
		if (selectedElements.length === 0) {
			toast.warning("Selecione um elemento na timeline para aplicar a transição.");
			return;
		}

		const selectedTrackElements = editor.timeline.getElementsWithTracks({
			elements: selectedElements,
		});

		if (selectedTrackElements.length === 0) {
			toast.warning("Selecione um elemento visual válido.");
			return;
		}

		const keyframes: any[] = [];
		const halfSec = mediaTimeFromSeconds({ seconds: 0.5 });

		const compareMediaTime = (a: any, b: any) => {
			if (typeof a === "bigint" || typeof b === "bigint") {
				return BigInt(a) < BigInt(b) ? a : b;
			}
			return Math.min(Number(a), Number(b));
		};

		const subtractMediaTime = (total: any, sub: any) => {
			if (typeof total === "bigint" || typeof sub === "bigint") {
				const diff = BigInt(total) - BigInt(sub);
				return diff < BigInt(0) ? BigInt(0) : diff;
			}
			const diff = Number(total) - Number(sub);
			return diff < 0 ? 0 : diff;
		};

		selectedTrackElements.forEach((item) => {
			const element = item.element;
			const trackId = item.track.id;
			const duration = element.duration;

			const transitionDuration = compareMediaTime(duration, halfSec);
			const endTransitionStart = subtractMediaTime(duration, transitionDuration);

			if (transitionId === "fade-in") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "opacity",
						time: ZERO_MEDIA_TIME,
						value: 0,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "opacity",
						time: transitionDuration,
						value: 1,
					}
				);
			} else if (transitionId === "fade-out") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "opacity",
						time: endTransitionStart,
						value: 1,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "opacity",
						time: duration,
						value: 0,
					}
				);
			} else if (transitionId === "zoom-in") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: ZERO_MEDIA_TIME,
						value: 0,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: ZERO_MEDIA_TIME,
						value: 0,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: transitionDuration,
						value: 1,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: transitionDuration,
						value: 1,
					}
				);
			} else if (transitionId === "zoom-out") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: endTransitionStart,
						value: 1,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: endTransitionStart,
						value: 1,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleX",
						time: duration,
						value: 0,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.scaleY",
						time: duration,
						value: 0,
					}
				);
			} else if (transitionId === "slide-left") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: ZERO_MEDIA_TIME,
						value: -1000,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: transitionDuration,
						value: 0,
					}
				);
			} else if (transitionId === "slide-right") {
				keyframes.push(
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: ZERO_MEDIA_TIME,
						value: 1000,
					},
					{
						trackId,
						elementId: element.id,
						propertyPath: "transform.positionX",
						time: transitionDuration,
						value: 0,
					}
				);
			}
		});

		try {
			editor.timeline.upsertKeyframes({ keyframes });
			toast.success(`Transição aplicada com sucesso!`);
		} catch (e) {
			console.error(e);
			toast.error("Erro ao aplicar transição.");
		}
	};

	return (
		<PanelView title="Transições">
			<div className="flex flex-col gap-4 p-2">
				<p className="text-[0.7rem] text-muted-foreground leading-normal">
					Selecione um ou mais elementos na timeline e escolha um preset para aplicar transições suaves de entrada ou saída.
				</p>
				<div className="grid grid-cols-2 gap-2.5">
					{TRANSITIONS.map((transition) => (
						<button
							key={transition.id}
							onClick={() => handleApplyTransition(transition.id)}
							className="text-left bg-accent/20 border border-border/40 hover:bg-accent/40 hover:border-border/80 transition-all duration-150 p-3 rounded-xl cursor-pointer flex flex-col gap-1.5 group active:scale-95"
						>
							<div className="flex items-center justify-between w-full">
								<span className="text-xl group-hover:scale-110 transition-transform duration-100">{transition.icon}</span>
								<HugeiconsIcon icon={FlashIcon} className="size-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
							</div>
							<div className="flex flex-col gap-0.5">
								<span className="text-xs font-semibold text-foreground">
									{transition.name}
								</span>
								<span className="text-[0.62rem] text-muted-foreground leading-snug line-clamp-2">
									{transition.description}
								</span>
							</div>
						</button>
					))}
				</div>
			</div>
		</PanelView>
	);
}
