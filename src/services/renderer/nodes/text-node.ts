import { BaseNode } from "./base-node";
import type { TextElement } from "@/timeline";
import type { EffectPass } from "@/effects/types";
import type { BlendMode, Transform } from "@/rendering";
import { drawMeasuredTextLayout, strokeMeasuredTextLayout, drawKaraokeTextLayout } from "@/text/primitives";
import type { MeasuredTextElement } from "@/text/measure-element";
import { mediaTimeToSeconds, TICKS_PER_SECOND } from "@/wasm";
import { renderWordByWordPreset } from "@/text/word-renderer";

export type TextNodeParams = TextElement & {
	transform: Transform;
	opacity: number;
	blendMode?: BlendMode;
	canvasCenter: { x: number; y: number };
	canvasHeight: number;
	textBaseline?: CanvasTextBaseline;
};

export interface ResolvedTextNodeState {
	localTime: number;
	transform: Transform;
	opacity: number;
	textColor: string;
	backgroundColor: string;
	strokeEnabled: boolean;
	strokeColor: string;
	strokeWidth: number;
	karaokeEnabled: boolean;
	karaokeHighlightColor: string;
	karaokeBaseColor: string;
	karaokeProgress: number;
	effectPasses: EffectPass[][];
	measuredText: MeasuredTextElement;
}

export class TextNode extends BaseNode<TextNodeParams, ResolvedTextNodeState> {}

export function renderTextToContext({
	node,
	ctx,
}: {
	node: TextNode;
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}): void {
	const resolved = node.resolved;
	if (!resolved) {
		return;
	}

	const x = resolved.transform.position.x + node.params.canvasCenter.x;
	const y = resolved.transform.position.y + node.params.canvasCenter.y;
	const baseline = node.params.textBaseline ?? "middle";

	ctx.save();
	ctx.translate(x, y);
	ctx.scale(resolved.transform.scaleX, resolved.transform.scaleY);
	if (resolved.transform.rotate) {
		ctx.rotate((resolved.transform.rotate * Math.PI) / 180);
	}

	const presetId = node.params.params["subtitle_preset"];
	if (typeof presetId === "string" && presetId) {
		const duration = mediaTimeToSeconds({ time: node.params.duration });
		renderWordByWordPreset({
			ctx,
			content: String(node.params.params.content ?? ""),
			presetId,
			localTime: resolved.localTime / TICKS_PER_SECOND,
			duration,
			fontFamily: typeof node.params.params.fontFamily === "string" ? node.params.params.fontFamily : "Arial",
			fontSizePx: resolved.measuredText.scaledFontSize,
			fontColor: resolved.textColor,
			highlightColor: resolved.karaokeHighlightColor,
			outlineColor: resolved.strokeColor,
			outlineWidth: resolved.strokeWidth,
			bgColor: resolved.backgroundColor,
			textAlign: typeof node.params.params.textAlign === "string" ? node.params.params.textAlign : "center",
		});
	} else {
		if (resolved.strokeEnabled) {
			strokeMeasuredTextLayout({
				ctx,
				layout: resolved.measuredText,
				strokeColor: resolved.strokeColor,
				strokeWidth: resolved.strokeWidth,
				textBaseline: baseline,
			});
		}

		if (resolved.karaokeEnabled) {
			drawKaraokeTextLayout({
				ctx,
				layout: resolved.measuredText,
				baseColor: resolved.karaokeBaseColor,
				highlightColor: resolved.karaokeHighlightColor,
				progress: resolved.karaokeProgress,
				textBaseline: baseline,
			});
		} else {
			drawMeasuredTextLayout({
				ctx,
				layout: resolved.measuredText,
				textColor: resolved.textColor,
				background: resolved.measuredText.resolvedBackground,
				backgroundColor: resolved.backgroundColor,
				textBaseline: baseline,
			});
		}
	}

	ctx.restore();
}


