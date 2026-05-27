import type { EditorCore } from "@/core";
import {
	AddTrackCommand,
	BatchCommand,
	InsertElementCommand,
} from "@/commands";
import { buildSubtitleTextElement } from "./build-subtitle-text-element";
import { getPresetPatch } from "./presets";
import type { SubtitleCue } from "./types";

export function insertCaptionChunksAsTextTrack({
	editor,
	captions,
	presetId = "highlight",
}: {
	editor: EditorCore;
	captions: SubtitleCue[];
	presetId?: string;
}): string | null {
	if (captions.length === 0) {
		return null;
	}

	const addTrackCommand = new AddTrackCommand({ type: "text", index: 0 });
	const trackId = addTrackCommand.getTrackId();
	const canvasSize = editor.project.getActive().settings.canvasSize;
	
	const presetPatch = getPresetPatch(presetId, canvasSize.height);

	const insertCommands = captions.map(
		(caption, index) => {
			const element = buildSubtitleTextElement({
				index,
				caption,
				canvasSize,
			});
			if (presetPatch.params) {
				element.params = { ...element.params, ...presetPatch.params };
			}
			if (presetPatch.animations) {
				element.animations = presetPatch.animations as any;
			}
			return new InsertElementCommand({
				placement: { mode: "explicit", trackId },
				element,
			});
		}
	);
	editor.command.execute({
		command: new BatchCommand([addTrackCommand, ...insertCommands]),
	});

	return trackId;
}
