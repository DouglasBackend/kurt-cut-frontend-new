import { PRESET_STYLE_MAP } from "@/components/SubtitlePresets";
import type { TextElement } from "@/timeline";

export function getPresetPatch(presetId: string, canvasHeight?: number): Partial<TextElement> {
	const preset = PRESET_STYLE_MAP[presetId];
	if (!preset) return {};

	const params: Record<string, any> = {};

	// Guard the preset ID so the renderer knows which style to use
	params["subtitle_preset"] = presetId;

	// ── Font ──────────────────────────────────────────────────────────────
	if (preset.font_family) params["fontFamily"] = preset.font_family;
	if (preset.font_color) params["color"] = preset.font_color;
	params["fontWeight"] = "bold";

	// ── Position / posY ──────────────────────────────────────────────────
	if (canvasHeight != null && typeof preset.posY === "number") {
		params["transform.positionY"] = canvasHeight * (preset.posY / 100 - 0.5);
	}

	// ── Outline / Stroke ─────────────────────────────────────────────────
	if (preset.outline_width > 0) {
		params["stroke.enabled"] = true;
		params["stroke.width"] = preset.outline_width;
		params["stroke.color"] = preset.outline_color || "#000000";
	} else {
		params["stroke.enabled"] = false;
		params["stroke.width"] = 0;
		params["stroke.color"] = "#000000";
	}

	// ── Background ───────────────────────────────────────────────────────
	if (preset.background_color && preset.background_color !== "transparent") {
		params["background.enabled"] = true;
		params["background.color"] = preset.background_color;
		params["background.paddingX"] = 10;
		params["background.paddingY"] = 6;
		params["background.cornerRadius"] = 4;
	} else {
		params["background.enabled"] = false;
		params["background.color"] = "rgba(0,0,0,0.5)";
	}

	// ── Karaoke / Highlight animations ───────────────────────────────────
	if (
		preset.animation === "karaoke" ||
		preset.animation === "highlight" ||
		preset.animation === "wordbyword"
	) {
		params["karaoke.enabled"] = true;
		params["karaoke.highlightColor"] = preset.highlight_color || "#FFE500";
		params["karaoke.baseColor"] = preset.font_color || "#FFFFFF";
	} else {
		params["karaoke.enabled"] = false;
		params["karaoke.highlightColor"] = preset.highlight_color || "#FFE500";
		params["karaoke.baseColor"] = preset.font_color || "#FFFFFF";
	}

	// Return patch with params and clear animations (animations are
	// handled by the CSS preview layer / backend Canvas renderer, not
	// by timeline keyframes).
	return { params: params as any, animations: {} as any };
}
