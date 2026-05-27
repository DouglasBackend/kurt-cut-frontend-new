import type { TranscriptionSegment, CaptionChunk } from "@/transcription/types";
import {
	DEFAULT_WORDS_PER_CAPTION,
	MIN_CAPTION_DURATION_SECONDS,
} from "@/transcription/caption-defaults";

export function buildCaptionChunks({
	segments,
	wordsPerChunk = DEFAULT_WORDS_PER_CAPTION,
	minDuration = MIN_CAPTION_DURATION_SECONDS,
}: {
	segments: TranscriptionSegment[];
	wordsPerChunk?: number;
	minDuration?: number;
}): CaptionChunk[] {
	interface WordWithTime {
		text: string;
		start: number;
		end: number;
	}

	const allWords: WordWithTime[] = [];
	for (const segment of segments) {
		const words = segment.text.trim().split(/\s+/).filter((w) => w.length > 0);
		if (words.length === 0) continue;

		const segmentDuration = segment.end - segment.start;
		const wordDuration = segmentDuration / words.length;

		for (let j = 0; j < words.length; j++) {
			allWords.push({
				text: words[j],
				start: segment.start + j * wordDuration,
				end: segment.start + (j + 1) * wordDuration,
			});
		}
	}

	const captions: CaptionChunk[] = [];
	let globalEndTime = 0;

	for (let i = 0; i < allWords.length; i += wordsPerChunk) {
		const group = allWords.slice(i, i + wordsPerChunk);
		if (group.length === 0) continue;

		const text = group.map((w) => w.text).join(" ");
		const startTime = group[0].start;
		const endTime = group[group.length - 1].end;

		const rawDuration = endTime - startTime;
		const chunkDuration = Math.max(minDuration, rawDuration);
		const adjustedStartTime = Math.max(startTime, globalEndTime);

		captions.push({
			text,
			startTime: adjustedStartTime,
			duration: chunkDuration,
		});

		globalEndTime = adjustedStartTime + chunkDuration;
	}

	return captions;
}
