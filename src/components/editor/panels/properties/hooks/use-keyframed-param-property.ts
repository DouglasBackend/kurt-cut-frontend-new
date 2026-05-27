"use client";

import { useEditor } from "@/editor/use-editor";
import {
	buildGraphicParamPath,
	getKeyframeAtTime,
	hasKeyframesForPath,
	upsertPathKeyframe,
} from "@/animation";
import type {
	AnimationPath,
	ElementAnimations,
} from "@/animation/types";
import {
	coerceParamValue,
	getParamChannelLayout,
	type ParamDefinition,
} from "@/params";
import { writeElementParamValue } from "@/params/registry";
import type { TimelineElement, TextTrack } from "@/timeline";
import type { MediaTime } from "@/wasm";

export interface KeyframedParamPropertyResult {
	hasAnimatedKeyframes: boolean;
	isKeyframedAtTime: boolean;
	keyframeIdAtTime: string | null;
	onPreview: (value: number | string | boolean) => void;
	onCommit: () => void;
	toggleKeyframe: () => void;
}

export function useKeyframedParamProperty({
	param,
	trackId,
	elementId,
	animations,
	propertyPath,
	localTime,
	isPlayheadWithinElementRange,
	resolvedValue,
	buildBaseUpdates,
}: {
	param: ParamDefinition;
	trackId: string;
	elementId: string;
	animations: ElementAnimations | undefined;
	propertyPath?: AnimationPath;
	localTime: MediaTime;
	isPlayheadWithinElementRange: boolean;
	resolvedValue: number | string | boolean;
	buildBaseUpdates: ({
		value,
	}: {
		value: number | string | boolean;
	}) => Partial<TimelineElement>;
}): KeyframedParamPropertyResult {
	const editor = useEditor();
	const resolvedPropertyPath =
		propertyPath ?? buildGraphicParamPath({ paramKey: param.key });
	const hasAnimatedKeyframes = hasKeyframesForPath({
		animations,
		propertyPath: resolvedPropertyPath,
	});
	const keyframeAtTime = isPlayheadWithinElementRange
		? getKeyframeAtTime({
				animations,
				propertyPath: resolvedPropertyPath,
				time: localTime,
			})
		: null;
	const keyframeIdAtTime = keyframeAtTime?.id ?? null;
	const isKeyframedAtTime = keyframeAtTime !== null;
	const shouldUseAnimatedChannel =
		hasAnimatedKeyframes && isPlayheadWithinElementRange;

	const previewValue: KeyframedParamPropertyResult["onPreview"] = (value) => {
		const isTextTrack = (() => {
			const scene = editor.scenes.getActiveSceneOrNull();
			const textTrack = scene?.tracks.overlay.find((t) => t.id === trackId);
			return textTrack && textTrack.type === "text";
		})();

		if (isTextTrack && param.key !== "content") {
			const scene = editor.scenes.getActiveSceneOrNull();
			if (scene) {
				const textTracks = scene.tracks.overlay.filter((t): t is TextTrack => t.type === "text");
				if (shouldUseAnimatedChannel) {
					const updates = textTracks.flatMap((track) =>
						track.elements.map((el) => ({
							trackId: track.id,
							elementId: el.id,
							updates: {
								animations: upsertPathKeyframe({
									animations: el.animations ?? {},
									propertyPath: resolvedPropertyPath,
									time: localTime,
									value,
									channelLayout: getParamChannelLayout({ param }),
									coerceValue: ({ value: nextValue }) =>
										coerceParamValue({
											param,
											value: nextValue,
										}),
								}),
							},
						}))
					);
					editor.timeline.previewElements({ updates });
				} else {
					const updates = textTracks.flatMap((track) =>
						track.elements.map((el) => ({
							trackId: track.id,
							elementId: el.id,
							updates: writeElementParamValue({ element: el, param, value }),
						}))
					);
					editor.timeline.previewElements({ updates });
				}
				return;
			}
		}

		if (shouldUseAnimatedChannel) {
			editor.timeline.previewElements({
				updates: [
					{
						trackId,
						elementId,
						updates: {
							animations: upsertPathKeyframe({
								animations,
								propertyPath: resolvedPropertyPath,
								time: localTime,
								value,
								channelLayout: getParamChannelLayout({ param }),
								coerceValue: ({ value: nextValue }) =>
									coerceParamValue({
										param,
										value: nextValue,
									}),
							}),
						},
					},
				],
			});
			return;
		}

		editor.timeline.previewElements({
			updates: [
				{
					trackId,
					elementId,
					updates: buildBaseUpdates({ value }),
				},
			],
		});
	};

	const toggleKeyframe = () => {
		if (!isPlayheadWithinElementRange) {
			return;
		}

		if (keyframeIdAtTime) {
			editor.timeline.removeKeyframes({
				keyframes: [
					{
						trackId,
						elementId,
						propertyPath: resolvedPropertyPath,
						keyframeId: keyframeIdAtTime,
					},
				],
			});
			return;
		}

		editor.timeline.upsertKeyframes({
			keyframes: [
				{
					trackId,
					elementId,
					propertyPath: resolvedPropertyPath,
					time: localTime,
					value: resolvedValue,
				},
			],
		});
	};

	return {
		hasAnimatedKeyframes,
		isKeyframedAtTime,
		keyframeIdAtTime,
		onPreview: previewValue,
		onCommit: () => editor.timeline.commitPreview(),
		toggleKeyframe,
	};
}
