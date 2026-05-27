"use client";

import { useState } from "react";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { FPS_PRESETS } from "@/fps/presets";
import { floatToFrameRate, frameRateToFloat } from "@/fps/utils";
import { useEditor } from "@/editor/use-editor";
import {
	Section,
	SectionContent,
	SectionHeader,
	SectionTitle,
} from "@/components/section";
import { BackgroundContent } from "./background";
import { formatTimecode } from "opencut-wasm";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/ui/number-field";
import { useEditorStore } from "@/editor/editor-store";
import { usePropertyDraft } from "@/components/editor/panels/properties/hooks/use-property-draft";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/utils/ui";
import { dimensionToAspectRatio } from "@/utils/geometry";
import { formatNumberForDisplay } from "@/utils/math";
import { OcSquarePlusIcon } from "@/components/icons";
import type { TCanvasSize } from "@/project/types";


const PRESET_LABELS: Record<string, string> = {
	"1:1": "1:1",
	"16:9": "16:9",
	"9:16": "9:16",
	"4:3": "4:3",
};

function areCanvasSizesEqual({
	left,
	right,
}: {
	left: TCanvasSize;
	right: TCanvasSize;
}) {
	return left.width === right.width && left.height === right.height;
}

function formatCanvasDimension({ value }: { value: number }) {
	return formatNumberForDisplay({ value, maxFractionDigits: 0 });
}

function parseCanvasDimension({ input }: { input: string }): number | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	const parsed = Number(trimmed);
	if (!Number.isFinite(parsed)) return null;

	const rounded = Math.round(parsed);
	return rounded > 0 ? rounded : null;
}

function useCanvasDimensionDraft({
	value,
	onCommit,
}: {
	value: number;
	onCommit: (value: number) => void;
}) {
	const [pendingValue, setPendingValue] = useState(value);

	return usePropertyDraft({
		displayValue: formatCanvasDimension({ value }),
		parse: (input) => parseCanvasDimension({ input }),
		onStartEditing: () => {
			setPendingValue(value);
		},
		onPreview: (nextValue) => {
			setPendingValue(nextValue);
		},
		onCommit: () => {
			if (pendingValue !== value) {
				onCommit(pendingValue);
			}
		},
	});
}

export function SettingsView() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const { canvasPresets } = useEditorStore();
	const currentCanvasSize = activeProject.settings.canvasSize;
	const canvasSizeMode = activeProject.settings.canvasSizeMode ?? "preset";
	const lastCustomCanvasSize =
		activeProject.settings.lastCustomCanvasSize ?? null;

	const presetItems = canvasPresets.map((preset, index) => {
		const ratio = dimensionToAspectRatio(preset);
		return {
			id: index.toString(),
			label: PRESET_LABELS[ratio] ?? ratio,
			ratio,
			canvasSize: preset,
		};
	});

	const selectedPresetId = canvasSizeMode === "preset"
		? (presetItems.find((preset) =>
				areCanvasSizesEqual({
					left: preset.canvasSize,
					right: currentCanvasSize,
				}),
			)?.id ?? null)
		: null;

	const updateCustomCanvasSize = ({
		canvasSize,
	}: {
		canvasSize: TCanvasSize;
	}) => {
		const shouldUpdateCanvasSize = !areCanvasSizesEqual({
			left: canvasSize,
			right: currentCanvasSize,
		});
		const shouldUpdateLastCustomCanvasSize =
			lastCustomCanvasSize === null ||
			!areCanvasSizesEqual({
				left: canvasSize,
				right: lastCustomCanvasSize,
			});
		const shouldUpdateCanvasSizeMode = canvasSizeMode !== "custom";

		if (
			!shouldUpdateCanvasSize &&
			!shouldUpdateLastCustomCanvasSize &&
			!shouldUpdateCanvasSizeMode
		) {
			return;
		}

		editor.project.updateSettings({
			settings: {
				...(shouldUpdateCanvasSize ? { canvasSize } : {}),
				...(shouldUpdateCanvasSizeMode
					? { canvasSizeMode: "custom" as const }
					: {}),
				lastCustomCanvasSize: canvasSize,
			},
		});
	};

	const selectPresetCanvasSize = ({
		canvasSize,
	}: {
		canvasSize: TCanvasSize;
	}) => {
		const shouldUpdateCanvasSize = !areCanvasSizesEqual({
			left: canvasSize,
			right: currentCanvasSize,
		});
		const shouldUpdateCanvasSizeMode = canvasSizeMode !== "preset";

		if (!shouldUpdateCanvasSize && !shouldUpdateCanvasSizeMode) return;

		editor.project.updateSettings({
			settings: {
				...(shouldUpdateCanvasSize ? { canvasSize } : {}),
				...(shouldUpdateCanvasSizeMode
					? { canvasSizeMode: "preset" as const }
					: {}),
			},
		});
	};

	const selectCustomCanvasSize = () => {
		updateCustomCanvasSize({
			canvasSize: lastCustomCanvasSize ?? currentCanvasSize,
		});
	};

	const widthDraft = useCanvasDimensionDraft({
		value: currentCanvasSize.width,
		onCommit: (width) =>
			updateCustomCanvasSize({
				canvasSize: { width, height: currentCanvasSize.height },
			}),
	});

	const heightDraft = useCanvasDimensionDraft({
		value: currentCanvasSize.height,
		onCommit: (height) =>
			updateCustomCanvasSize({
				canvasSize: { width: currentCanvasSize.width, height },
			}),
	});

	const isCustomSelected = canvasSizeMode === "custom";

	const totalDuration = useEditor((e) => e.timeline.getTotalDuration());

	return (
		<PanelView
			contentClassName="px-0"
			scrollClassName="pt-0"
		>
			<div className="flex flex-col gap-4 p-4 pb-0">
				<div className="flex flex-col gap-2">
					<h3 className="font-semibold text-[0.82rem] text-foreground">Duration</h3>
					<span className="text-sm text-muted-foreground">
						{formatTimecode({
							time: totalDuration,
							format: "HH:MM:SS:FF",
							rate: activeProject.settings.fps,
						})}
					</span>
				</div>
				<div className="h-px bg-border/50 -mx-4" />
			</div>

			<BackgroundContent />
		</PanelView>
	);
}

function AspectRatioItem({
	label,
	previewIcon,
	isSelected,
	onClick,
	uiOptions,
}: {
	label: string;
	previewIcon: React.ReactNode;
	isSelected: boolean;
	onClick: () => void;
	uiOptions?: React.ReactNode;
}) {
	return (
		<Button
			variant={isSelected ? "secondary" : "ghost"}
			className={cn(
				"px-2 py-0 flex flex-col h-fit w-full",
				!isSelected && "border border-transparent opacity-75!",
			)}
			onClick={onClick}
		>
			<div className="w-full flex justify-between items-center h-8">
				<div className="flex-1 flex items-center gap-2">
					<div className="flex items-center justify-center size-5">
						{previewIcon}
					</div>
					<span className="text-sm truncate">{label}</span>
				</div>
				<div>
					{isSelected && <HugeiconsIcon icon={Tick02Icon} className="size-4" />}
				</div>
			</div>
			{uiOptions && isSelected && (
				<div className="w-full pb-2">{uiOptions}</div>
			)}
		</Button>
	);
}

function AspectRatioPreview({ ratio }: { ratio?: string }) {
	if (!ratio) return null;

	const [w, h] = ratio.split(":").map(Number);
	const maxSize = 16;
	const width = w >= h ? maxSize : (w / h) * maxSize;
	const height = h >= w ? maxSize : (h / w) * maxSize;

	return (
		<div
			style={{ width, height, borderWidth: 1.5 }}
			className="rounded-xs border-current opacity-60"
		/>
	);
}
