import type { TrackType } from "@/timeline";

export const TIMELINE_AUDIO_WAVEFORM_COLOR = "rgba(255, 255, 255, 0.7)";

export const TIMELINE_TRACK_THEME: Record<
	TrackType,
	{
		elementClassName: string;
		waveformColor?: string;
	}
> = {
	video: { elementClassName: "transparent" },
	text: { elementClassName: "bg-[#FF8A00]" }, // Orange like in the screenshot
	audio: {
		elementClassName: "bg-[#2563EB]", // Blue track with waveform
		waveformColor: TIMELINE_AUDIO_WAVEFORM_COLOR,
	},
	graphic: { elementClassName: "bg-[#D96A8C]" },
	effect: { elementClassName: "bg-[#8B5CF6]" },
} as const;

export const SELECTED_TRACK_ROW_CLASS = "bg-primary/10";
export const DEFAULT_TIMELINE_BOOKMARK_COLOR = "#009dff";

export function getTimelineElementClassName({
	type,
}: {
	type: TrackType;
}): string {
	return TIMELINE_TRACK_THEME[type].elementClassName.trim();
}
