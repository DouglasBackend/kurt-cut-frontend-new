"use client";

// Fixed TypeScript compilation errors by resolving draggable-item params & svg props.

import { useEditor } from "@/editor/use-editor";
import { buildGraphicElement } from "@/timeline/element-utils";
import { DraggableItem } from "@/components/editor/panels/assets/draggable-item";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import type { MediaTime } from "@/wasm";

const SHAPE_PRESETS = [
	{
		id: "rectangle",
		name: "Retângulo",
		icon: (
			<div className="size-12 rounded border border-primary/40 bg-primary/20 flex items-center justify-center shadow-lg" />
		),
	},
	{
		id: "ellipse",
		name: "Círculo",
		icon: (
			<div className="size-12 rounded-full border border-primary/40 bg-primary/20 flex items-center justify-center shadow-lg" />
		),
	},
	{
		id: "polygon",
		name: "Triângulo",
		icon: (
			<svg className="size-12 text-primary/20 drop-shadow-md stroke-primary/40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
				<polygon points="12,3 2,21 22,21" />
			</svg>
		),
	},
	{
		id: "star",
		name: "Estrela",
		icon: (
			<svg className="size-12 text-primary/20 drop-shadow-md stroke-primary/40" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
				<polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
			</svg>
		),
	},
];

export function ShapesView() {
	const editor = useEditor();

	const handleAddToTimeline = (definitionId: string, { currentTime }: { currentTime: MediaTime }) => {
		const activeScene = editor.scenes.getActiveScene();
		if (!activeScene) return;

		const element = buildGraphicElement({
			definitionId,
			startTime: currentTime,
			params: {
				fill: "#0099ff",
				stroke: "#ffffff",
				strokeWidth: 2,
			},
		});

		editor.timeline.insertElement({
			element,
			placement: { mode: "auto" },
		});
	};

	return (
		<PanelView title="Formas">
			<div className="grid grid-cols-2 gap-3 p-2">
				{SHAPE_PRESETS.map((preset) => (
					<div key={preset.id} className="relative group">
						<DraggableItem
							name={preset.name}
							preview={
								<div className="bg-accent/40 border border-border/50 flex size-full items-center justify-center rounded-xl hover:bg-accent/60 transition-all duration-150 p-4">
									{preset.icon}
								</div>
							}
							dragData={{
								id: `temp-${preset.id}-id`,
								type: "graphic",
								definitionId: preset.id,
								name: preset.name,
								params: {
									fill: "#0099ff",
									stroke: "#ffffff",
									strokeWidth: 2,
								},
							}}
							aspectRatio={1}
							onAddToTimeline={(args) => handleAddToTimeline(preset.id, args)}
							shouldShowLabel={true}
						/>
					</div>
				))}
			</div>
		</PanelView>
	);
}
