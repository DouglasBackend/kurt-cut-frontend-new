"use client";

import { useEditor } from "@/editor/use-editor";
import { useElementSelection } from "@/timeline/hooks/element/use-element-selection";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import { buildTextElement } from "@/timeline/element-utils";
import type { MediaTime } from "@/wasm";

const BRAND_PALETTES = [
	{
		name: "Cyberpunk Neon",
		colors: ["#ff0055", "#02d6fa", "#cc00ff", "#ffffff"],
	},
	{
		name: "Midnight Sunset",
		colors: ["#ff4500", "#9400d3", "#ffd700", "#1e1b4b"],
	},
	{
		name: "Forest Moss",
		colors: ["#2e8b57", "#8fbc8f", "#d2b48c", "#14532d"],
	},
	{
		name: "Ocean Breeze",
		colors: ["#0e7490", "#06b6d4", "#a5f3fc", "#ffffff"],
	},
	{
		name: "Pastel Dream",
		colors: ["#fecdd3", "#fef08a", "#d9f99d", "#bfdbfe"],
	},
	{
		name: "Minimal Monochrome",
		colors: ["#ffffff", "#a1a1aa", "#3f3f46", "#09090b"],
	},
];

const TYPOGRAPHY_PRESETS = [
	{
		name: "Título Moderno",
		description: "Grande, Bold e Impactante",
		params: {
			fontSize: 24,
			fontWeight: "bold",
			color: "#ff0055",
			fontFamily: "Impact",
			content: "TÍTULO PRINCIPAL",
		},
	},
	{
		name: "Legenda Rápida",
		description: "Estilo TikTok com fundo",
		params: {
			fontSize: 16,
			fontWeight: "bold",
			color: "#ffffff",
			"background.enabled": true,
			"background.color": "#000000",
			"background.cornerRadius": 6,
			"background.paddingX": 20,
			"background.paddingY": 15,
			content: "Texto em destaque",
		},
	},
	{
		name: "Subtítulo Elegante",
		description: "Limpo e centralizado",
		params: {
			fontSize: 14,
			fontWeight: "normal",
			fontStyle: "italic",
			color: "#02d6fa",
			content: "Seu subtítulo inspirador...",
		},
	},
];

export function BrandKitView() {
	const editor = useEditor();
	const { selectedElements } = useElementSelection();

	const handleApplyColor = (color: string) => {
		if (selectedElements.length === 0) return;

		const updates = selectedElements.map((el) => ({
			trackId: el.trackId,
			elementId: el.elementId,
			patch: {
				params: {
					color: color,
					fill: color,
				},
			},
		}));

		editor.timeline.updateElements({ updates });
	};

	const handleAddTypographyPreset = (presetParams: typeof TYPOGRAPHY_PRESETS[0]["params"]) => {
		const currentTime = editor.playback.getCurrentTime();
		const element = buildTextElement({
			raw: {
				name: presetParams.content,
				params: presetParams as any,
			},
			startTime: currentTime,
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<PanelView title="Brand Kit">
			<div className="flex flex-col gap-5 p-2">
				{/* Colors Section */}
				<div>
					<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Paletas da Marca
					</h3>
					<div className="flex flex-col gap-3">
						{BRAND_PALETTES.map((palette) => (
							<div
								key={palette.name}
								className="bg-accent/20 border border-border/40 hover:bg-accent/30 transition-all duration-150 p-2.5 rounded-xl flex flex-col gap-2"
							>
								<div className="flex items-center justify-between">
									<span className="text-[0.72rem] text-muted-foreground font-medium">
										{palette.name}
									</span>
									{selectedElements.length > 0 && (
										<span className="text-[0.6rem] text-primary/80 animate-pulse">
											Clique para colorir seleção
										</span>
									)}
								</div>
								<div className="flex gap-2">
									{palette.colors.map((color, idx) => (
										<button
											key={idx}
											onClick={() => handleApplyColor(color)}
											className="size-7 rounded-md cursor-pointer border border-white/10 hover:scale-110 active:scale-95 transition-transform duration-100 shadow-md"
											style={{ backgroundColor: color }}
											title={color}
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="h-px bg-border/40" />

				{/* Typography Section */}
				<div>
					<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Tipografia e Estilos
					</h3>
					<div className="flex flex-col gap-2.5">
						{TYPOGRAPHY_PRESETS.map((preset) => (
							<button
								key={preset.name}
								onClick={() => handleAddTypographyPreset(preset.params)}
								className="w-full text-left bg-accent/20 border border-border/40 hover:bg-accent/40 hover:border-border/80 transition-all duration-150 p-3 rounded-xl cursor-pointer flex flex-col gap-1"
							>
								<span className="text-sm font-semibold text-foreground">
									{preset.name}
								</span>
								<span className="text-[0.68rem] text-muted-foreground leading-normal">
									{preset.description}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>
		</PanelView>
	);
}
