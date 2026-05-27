"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { PlayCircleIcon } from "lucide-react";
import { ColorPickerContent } from "@/components/ui/color-picker";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import {
	BACKGROUND_BLUR_INTENSITY_PRESETS,
	DEFAULT_BACKGROUND_BLUR_INTENSITY,
} from "@/background/blur";
import { DEFAULT_BACKGROUND_COLOR } from "@/background/color";
import { patternCraftGradients } from "@/data/colors/pattern-craft";
const SOLID_COLORS = [
	"transparent",
	"#000000",
	"#ffffff",
	"#0f172b", // dark navy
	"#18181b", // dark charcoal
	"#1e1b4b", // dark indigo
	"#064e3b", // dark green
	"#7f1d1d", // dark red
	"#78350f", // brown
];
import { syntaxUIGradients } from "@/data/colors/syntax-ui";
import { useEditor } from "@/editor/use-editor";
import { effectPreviewService } from "@/services/renderer/effect-preview";
import { cn } from "@/utils/ui";

const BLUR_PREVIEW_UNIFORM_DIMENSIONS = {
	width: 1920,
	height: 1080,
} as const;

const CUSTOM_COLOR_SWATCH_BACKGROUND =
	"conic-gradient(from 180deg at 50% 50%, #ff5e5e 0deg, #ffb35e 55deg, #fff26b 110deg, #6bff8f 165deg, #5ee7ff 220deg, #6f7cff 275deg, #d76bff 330deg, #ff5e9b 360deg)";

const BlurPreview = memo(
	({
		blur,
		isSelected,
		onSelect,
		onHover,
	}: {
		blur: { label: string; value: number };
		isSelected: boolean;
		onSelect: () => void;
		onHover?: (value: number) => void;
	}) => {
		const canvasRef = useRef<HTMLCanvasElement>(null);

		useEffect(() => {
			const renderPreview = () => {
				if (!canvasRef.current) return;

				effectPreviewService.renderPreview({
					effectType: "blur",
					params: { intensity: blur.value },
					targetCanvas: canvasRef.current,
					uniformDimensions: BLUR_PREVIEW_UNIFORM_DIMENSIONS,
				});
			};

			renderPreview();
			return effectPreviewService.onPreviewImageReady({
				callback: renderPreview,
			});
		}, [blur.value]);

		return (
			<button
				className={cn(
					"border-foreground/15 hover:border-primary relative w-[calc(25%-6px)] aspect-[2/3] cursor-pointer overflow-hidden rounded-md border transition-all duration-150",
					isSelected && "border-primary border-2 shadow-[0_0_8px_rgba(255,138,0,0.5)]",
				)}
				onClick={onSelect}
				onPointerEnter={onHover ? () => onHover(blur.value) : undefined}
				type="button"
				aria-label={`Select ${blur.label} blur`}
			>
				<canvas
					ref={canvasRef}
					className="absolute inset-0 h-full w-full object-cover"
				/>
				<div className="absolute right-1 bottom-1 flex items-center justify-center size-5 bg-black/60 rounded-full backdrop-blur-sm">
					<PlayCircleIcon className="size-3 text-white fill-white/20" />
				</div>
			</button>
		);
	},
);

BlurPreview.displayName = "BlurPreview";

const BackgroundPreviews = memo(
	({
		backgrounds,
		currentBackgroundColor,
		isColorBackground,
		onSelect,
		onHover,
		useBackgroundColor = false,
		variant = "gradient",
	}: {
		backgrounds: readonly string[];
		currentBackgroundColor: string;
		isColorBackground: boolean;
		onSelect: (bg: string) => void;
		onHover?: (bg: string) => void;
		useBackgroundColor?: boolean;
		variant?: "color" | "gradient" | "animated";
	}) => {
		return useMemo(
			() =>
				backgrounds.map((bg) => (
					<button
						key={bg}
						className={cn(
							"border-foreground/15 hover:border-primary cursor-pointer border transition-all duration-150",
							variant === "color" && "size-7 rounded-full shrink-0",
							variant === "gradient" && "w-[calc(25%-6px)] aspect-[2/3] rounded-md",
							isColorBackground &&
								bg.toLowerCase() === currentBackgroundColor.toLowerCase() &&
								variant === "color" && "border-primary border-[1.5px] ring-2 ring-primary ring-offset-2 ring-offset-background",
							isColorBackground &&
								bg.toLowerCase() === currentBackgroundColor.toLowerCase() &&
								variant !== "color" && "border-primary border-2 shadow-[0_0_8px_rgba(255,138,0,0.5)]",
						)}
						style={
							variant === "color" && bg === "transparent"
								? {
										backgroundImage:
											"linear-gradient(45deg, #3f3f46 25%, transparent 25%), linear-gradient(-45deg, #3f3f46 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #3f3f46 75%), linear-gradient(-45deg, transparent 75%, #3f3f46 75%)",
										backgroundSize: "8px 8px",
										backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
										backgroundColor: "#27272a",
									}
								: useBackgroundColor
									? { backgroundColor: bg }
									: {
											background: bg,
											backgroundSize: "cover",
											backgroundPosition: "center",
											backgroundRepeat: "no-repeat",
										}
						}
						onClick={() => onSelect(bg)}
						onPointerEnter={onHover ? () => onHover(bg) : undefined}
						type="button"
						aria-label={`Select background ${bg}`}
					/>
				)),
			[
				backgrounds,
				isColorBackground,
				currentBackgroundColor,
				onSelect,
				onHover,
				useBackgroundColor,
				variant,
			],
		);
	},
);

BackgroundPreviews.displayName = "BackgroundPreviews";

function CustomColorPreview({
	currentBackgroundColor,
	isSelected,
	onPreview,
	onCommit,
}: {
	currentBackgroundColor: string;
	isSelected: boolean;
	onPreview: (color: string) => void;
	onCommit: (color: string) => void;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					className={cn(
						"border-foreground/15 hover:border-primary relative h-7 w-12 cursor-pointer overflow-hidden rounded-sm border shrink-0 transition-all duration-150",
						isSelected && "border-primary border-[1.5px] ring-2 ring-primary ring-offset-2 ring-offset-background",
					)}
					type="button"
					aria-label="Pick a custom background color"
				>
					<span
						className="absolute inset-0"
						style={{ background: CUSTOM_COLOR_SWATCH_BACKGROUND }}
					/>
					<span
						className="absolute inset-0"
						style={{ backgroundColor: currentBackgroundColor }}
					/>
				</button>
			</PopoverTrigger>
			<ColorPickerContent
				value={currentBackgroundColor.replace(/^#/, "").toUpperCase()}
				onChange={(color) => onPreview(`#${color}`)}
				onChangeEnd={(color) => onCommit(`#${color}`)}
			/>
		</Popover>
	);
}

const COLOR_SECTIONS = [
	{ id: "colors", title: "Color", backgrounds: SOLID_COLORS, useBackgroundColor: true, showCustomPicker: true, variant: "color" as const },
	{ id: "gradients", title: "Gradients", backgrounds: [...patternCraftGradients, ...syntaxUIGradients], showCustomPicker: false, variant: "gradient" as const },
] as const;

export function BackgroundContent() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());

	const initialBackgroundRef = useRef(activeProject.settings.background);
	const isHoveringRef = useRef(false);

	useEffect(() => {
		if (!isHoveringRef.current) {
			initialBackgroundRef.current = activeProject.settings.background;
		}
	}, [activeProject.settings.background]);

	useEffect(() => {
		return () => {
			if (isHoveringRef.current) {
				void editor.project.updateSettings({
					settings: { background: initialBackgroundRef.current },
					pushHistory: false,
				});
			}
		};
	}, [editor.project]);

	const previewBackground = useCallback(
		async (bgSetting: any) => {
			isHoveringRef.current = true;
			await editor.project.updateSettings({
				settings: { background: bgSetting },
				pushHistory: false,
			});
		},
		[editor.project],
	);

	const commitBackground = useCallback(
		async (bgSetting: any) => {
			initialBackgroundRef.current = bgSetting;
			isHoveringRef.current = false;
			await editor.project.updateSettings({
				settings: { background: bgSetting },
				pushHistory: true,
			});
		},
		[editor.project],
	);

	const handleBlurSelect = useCallback(
		(blurIntensity: number) => {
			void commitBackground({ type: "blur", blurIntensity });
		},
		[commitBackground],
	);

	const handleBlurHover = useCallback(
		(blurIntensity: number) => {
			void previewBackground({ type: "blur", blurIntensity });
		},
		[previewBackground],
	);

	const previewBackgroundColor = useCallback(
		async (color: string) => {
			await editor.project.updateSettings({
				settings: { background: { type: "color", color } },
				pushHistory: false,
			});
		},
		[editor.project],
	);

	const commitBackgroundColor = useCallback(
		async (color: string) => {
			await editor.project.updateSettings({
				settings: { background: { type: "color", color } },
				pushHistory: true,
			});
		},
		[editor.project],
	);

	const isBlurBackground = activeProject.settings.background.type === "blur";
	const isColorBackground = activeProject.settings.background.type === "color";

	const currentBlurIntensity = isBlurBackground
		? (activeProject.settings.background as { blurIntensity: number })
				.blurIntensity
		: DEFAULT_BACKGROUND_BLUR_INTENSITY;

	const currentBackgroundColor = isColorBackground
		? (activeProject.settings.background as { color: string }).color
		: DEFAULT_BACKGROUND_COLOR;

	const hasPresetColorMatch = SOLID_COLORS.some(
		(color) => color.toLowerCase() === currentBackgroundColor.toLowerCase(),
	);

	const handlePresetColorSelect = useCallback(
		(color: string) => {
			void commitBackground({ type: "color", color });
		},
		[commitBackground],
	);

	const handlePresetColorHover = useCallback(
		(color: string) => {
			void previewBackground({ type: "color", color });
		},
		[previewBackground],
	);

	const handlePointerLeave = useCallback(() => {
		if (isHoveringRef.current) {
			isHoveringRef.current = false;
			void editor.project.updateSettings({
				settings: { background: initialBackgroundRef.current },
				pushHistory: false,
			});
		}
	}, [editor.project]);

	const blurPreviews = useMemo(
		() =>
			BACKGROUND_BLUR_INTENSITY_PRESETS.map((blur) => (
				<BlurPreview
					key={blur.value}
					blur={blur}
					isSelected={isBlurBackground && currentBlurIntensity === blur.value}
					onSelect={() => handleBlurSelect(blur.value)}
					onHover={handleBlurHover}
				/>
			)),
		[isBlurBackground, currentBlurIntensity, handleBlurSelect, handleBlurHover],
	);

	return (
		<div className="flex flex-col p-4 gap-6" onPointerLeave={handlePointerLeave}>
			<div className="flex flex-col gap-4">
				<h3 className="font-semibold text-[0.82rem] text-foreground">Background</h3>
				
				{COLOR_SECTIONS.map((section) => (
					<div key={section.id} className="flex flex-col gap-2">
						<span className="text-[0.75rem] font-medium text-muted-foreground">{section.title}</span>
						<div className="flex flex-wrap gap-2">
							<BackgroundPreviews
								backgrounds={section.backgrounds.filter(bg => bg === "transparent")}
								currentBackgroundColor={currentBackgroundColor}
								isColorBackground={isColorBackground}
								onSelect={handlePresetColorSelect}
								onHover={handlePresetColorHover}
								useBackgroundColor={
									"useBackgroundColor" in section
										? section.useBackgroundColor
										: false
								}
								variant={section.variant}
							/>
							{section.showCustomPicker ? (
								<CustomColorPreview
									currentBackgroundColor={currentBackgroundColor}
									isSelected={isColorBackground && !hasPresetColorMatch}
									onPreview={previewBackgroundColor}
									onCommit={commitBackgroundColor}
								/>
							) : null}
							<BackgroundPreviews
								backgrounds={section.backgrounds.filter(bg => bg !== "transparent")}
								currentBackgroundColor={currentBackgroundColor}
								isColorBackground={isColorBackground}
								onSelect={handlePresetColorSelect}
								onHover={handlePresetColorHover}
								useBackgroundColor={
									"useBackgroundColor" in section
										? section.useBackgroundColor
										: false
								}
								variant={section.variant}
							/>
						</div>
					</div>
				))}

				<div className="flex flex-col gap-2 mt-2">
					<span className="text-[0.75rem] font-medium text-muted-foreground">Animated</span>
					<div className="flex flex-wrap gap-2">{blurPreviews}</div>
				</div>
			</div>
		</div>
	);
}
