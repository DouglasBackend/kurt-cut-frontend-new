import { clamp } from "@/utils/math";

// Helpers
const spring = (t: number) => {
	if (t < 0) return 0;
	return 1 - Math.exp(-t * 4) * Math.cos(t * 6);
};
const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 3);

function parseColor(css: string, fallback = '#FFFFFF'): string {
	if (!css || css === 'transparent') return 'transparent';
	const rgbaMatch = css.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
	if (rgbaMatch) {
		const [, r, g, b, a] = rgbaMatch;
		const alpha = a !== undefined ? parseFloat(a) : 1;
		return `rgba(${r},${g},${b},${alpha})`;
	}
	return css || fallback;
}

function hslToStr(h: number, s: number, l: number, a = 1): string {
	return `hsla(${h},${s}%,${l}%,${a})`;
}

export function renderWordByWordPreset({
	ctx,
	content,
	presetId,
	localTime,
	duration,
	fontFamily,
	fontSizePx,
	fontColor: rawFontColor,
	highlightColor: rawHighlightColor,
	outlineColor: rawOutlineColor,
	outlineWidth,
	bgColor: rawBgColor,
	textAlign,
}: {
	ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	content: string;
	presetId: string;
	localTime: number;
	duration: number;
	fontFamily: string;
	fontSizePx: number;
	fontColor: string;
	highlightColor: string;
	outlineColor: string;
	outlineWidth: number;
	bgColor: string;
	textAlign: string;
}): void {
	const words = content.replace(/\n/g, " ").trim().split(/\s+/).filter(w => w.length > 0);
	if (words.length === 0) return;

	const preset = presetId.toLowerCase();
	const fontColor = parseColor(rawFontColor);
	const highlightColor = parseColor(rawHighlightColor);
	const outlineColor = parseColor(rawOutlineColor);
	const bgColor = parseColor(rawBgColor);

	const fontStr = `bold ${fontSizePx}px '${fontFamily}', 'Arial Black', sans-serif`;
	ctx.font = fontStr;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	const wordTexts = words.map(w => w.toUpperCase());
	const spaceWidth = ctx.measureText(' ').width;

	let totalWidth = spaceWidth * (words.length - 1);
	const wordWidths: number[] = [];
	for (const t of wordTexts) {
		const m = ctx.measureText(t);
		wordWidths.push(m.width);
		totalWidth += m.width;
	}

	let cursorX: number;
	if (textAlign === "left") {
		cursorX = 0;
	} else if (textAlign === "right") {
		cursorX = -totalWidth;
	} else {
		cursorX = -totalWidth / 2;
	}

	// Calculate active word index
	const N = words.length;
	const wordDuration = duration / N;
	const activeIndex = Math.floor(clamp({ value: localTime / wordDuration, min: 0, max: N - 1 }));

	for (let wi = 0; wi < N; wi++) {
		const text = wordTexts[wi];
		const ww = wordWidths[wi];
		const cx = cursorX + ww / 2;

		const isActive = wi === activeIndex;
		const isPast = wi < activeIndex;

		const wordStart = wi * wordDuration;
		const t = Math.max(0, localTime - wordStart);

		ctx.save();
		ctx.translate(cx, 0); // vertical position is handled by text-node translation

		const drawText = (
			textStr: string,
			color: string | CanvasGradient,
			strokeColor?: string,
			strokeW?: number,
			shadowColor?: string,
			shadowBlur?: number,
			shadowX = 0,
			shadowY = 0,
		) => {
			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;

			if (shadowColor && shadowBlur) {
				ctx.shadowColor = shadowColor;
				ctx.shadowBlur = shadowBlur;
				ctx.shadowOffsetX = shadowX;
				ctx.shadowOffsetY = shadowY;
			}
			if (strokeColor && strokeW && strokeColor !== 'transparent' && strokeW > 0) {
				ctx.strokeStyle = strokeColor;
				ctx.lineWidth = strokeW * 2;
				ctx.lineJoin = 'round';
				ctx.strokeText(textStr, 0, 0);
			}
			ctx.fillStyle = color;
			ctx.fillText(textStr, 0, 0);
			ctx.fillText(textStr, 0, 0);

			ctx.shadowColor = 'transparent';
			ctx.shadowBlur = 0;
		};

		const applyGradientText = (stops: [number, string][], angle = 135) => {
			const rad = (angle * Math.PI) / 180;
			const hw = ww / 2 + 10;
			const hh = fontSizePx / 2 + 4;
			const x1 = -Math.cos(rad) * hw;
			const y1 = -Math.sin(rad) * hh;
			const x2 = Math.cos(rad) * hw;
			const y2 = Math.sin(rad) * hh;
			const grad = ctx.createLinearGradient(x1, y1, x2, y2);
			for (const [pos, color] of stops) grad.addColorStop(pos, color);
			return grad;
		};

		const applyScale = (sx: number, sy = sx) => {
			ctx.scale(sx, sy);
		};

		const applyRotate = (deg: number) => {
			ctx.rotate((deg * Math.PI) / 180);
		};

		// Preset drawing logic (same as backend)
		switch (preset) {
			case 'highlight': {
				const sp = spring(t * 3.5);
				if (isActive) {
					const sc = 1 + sp * 0.15;
					const rot = (1 - sp) * -4;
					applyRotate(rot);
					applyScale(sc);
					drawText(text, highlightColor, undefined, 0, 'rgba(0,0,0,1)', 6, 3, 4);
				} else {
					ctx.globalAlpha = 0.5;
					applyScale(0.95);
					drawText(text, 'rgba(180,180,180,0.5)', undefined, 0, 'rgba(0,0,0,0.6)', 3, 2, 2);
					ctx.globalAlpha = 1;
				}
				break;
			}
			case 'tiktok': {
				const ow = Math.max(1, (fontSizePx / 100) * 1.5);
				drawText(text, highlightColor, outlineColor, ow, 'rgba(0,0,0,0.6)', 6, 2, 2);
				break;
			}
			case 'karaoke': {
				const fillPct = isPast ? 1 : isActive ? Math.min(1, t / wordDuration) : 0;
				ctx.globalAlpha = 0.45;
				drawText(text, 'rgba(255,255,255,0.3)');
				ctx.globalAlpha = 1;
				ctx.save();
				ctx.beginPath();
				ctx.rect(-ww / 2 - 4, -fontSizePx, (ww + 8) * fillPct, fontSizePx * 2);
				ctx.clip();
				drawText(text, highlightColor);
				ctx.restore();
				break;
			}
			case 'instagram': {
				const sp = spring(t * 3);
				if (isActive) {
					const bounce = (1 - sp) * (fontSizePx * -0.15);
					const sc = 1 + sp * 0.08;
					ctx.translate(0, bounce);
					applyScale(sc);
					const stops: [number, string][] = [
						[0, '#ff8a2b'], [0.33, '#e5156b'], [0.66, '#9b30ff'], [1, '#4f5bd5']
					];
					const igGrad = applyGradientText(stops, 90);
					drawText(text, igGrad, 'rgba(0,0,0,0.15)', 1, 'rgba(0,0,0,0.5)', 8, 0, 3);
				} else {
					ctx.globalAlpha = 0.45;
					applyScale(0.95);
					drawText(text, 'rgba(180,180,180,0.5)', undefined, 0, 'rgba(0,0,0,0.3)', 4, 0, 1);
					ctx.globalAlpha = 1;
				}
				break;
			}
			case 'capcut': {
				const bw = ww + fontSizePx * 1.0;
				const bh = fontSizePx * 1.3;
				const rr = fontSizePx * 0.4;
				const isActiveCap = isActive || isPast;
				ctx.fillStyle = isActiveCap ? highlightColor : "rgba(40,40,40,0.8)";
				ctx.beginPath();
				ctx.roundRect(-bw/2, -bh/2, bw, bh, rr);
				ctx.fill();
				const isLight = highlightColor === "#FFE500" || highlightColor === "#FFFFFF";
				const color = isActiveCap ? (isLight ? "#000000" : "#FFFFFF") : "rgba(255,255,255,0.5)";
				drawText(text, color);
				break;
			}
			case 'impact': {
				const sc = isActive ? 1.2 - easeOut(t * 2) * 0.05 : 1;
				const rot = isActive ? Math.sin(t * 3) * 3 : 0;
				applyScale(sc);
				applyRotate(rot);
				const glowBlur = isActive ? 10 + Math.sin(t * 4) * 4 : 0;
				drawText(text, isActive ? highlightColor : fontColor, outlineColor, outlineWidth,
					isActive ? fontColor : undefined, isActive ? glowBlur : 0);
				break;
			}
			case 'gradient':
			case 'gradientorig': {
				const hue = (t * 120) % 360;
				const sc = isActive ? 1 + spring(t * 2) * 0.05 : 0.9;
				applyScale(sc);
				const grad = applyGradientText([
					[0, hslToStr(hue, 100, 60)],
					[0.5, hslToStr((hue + 120) % 360, 100, 60)],
					[1, hslToStr((hue + 240) % 360, 100, 60)],
				], 135);
				ctx.fillStyle = grad;
				ctx.fillText(text, 0, 0);
				break;
			}
			case 'cinematic': {
				const alpha = isActive ? Math.min(1, t * 4) : 0.7;
				const bw = ww + fontSizePx * 1.5;
				const bh = fontSizePx * 1.6;
				ctx.fillStyle = bgColor !== 'transparent' ? bgColor : `rgba(0,0,0,0.8)`;
				ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
				ctx.globalAlpha = alpha;
				if (isActive) {
					ctx.shadowColor = highlightColor;
					ctx.shadowBlur = 8 + Math.sin(t * 4) * 3;
				}
				ctx.fillStyle = fontColor;
				ctx.fillText(text, 0, 0);
				ctx.globalAlpha = 1;
				ctx.shadowBlur = 0;
				break;
			}
			case 'neon': {
				const oX = isActive ? Math.sin(t * 5) * 3 : 0;
				const oY = isActive ? Math.cos(t * 4) * 2 : 0;
				ctx.translate(oX, oY);
				if (isActive) {
					ctx.save();
					ctx.globalCompositeOperation = 'screen';
					ctx.fillStyle = '#ff00ff';
					ctx.fillText(text, -5, 0);
					ctx.fillStyle = '#00ffff';
					ctx.fillText(text, 5, 0);
					ctx.restore();
					drawText(text, fontColor, outlineColor, outlineWidth, highlightColor, 12 + Math.sin(t * 6) * 4);
				} else {
					drawText(text, fontColor, outlineColor, outlineWidth, highlightColor, 6);
				}
				break;
			}
			case 'matrix': {
				const alpha = isActive ? 0.5 + Math.sin(t * 5) * 0.5 : 0.4;
				const glowSize = isActive ? 10 + Math.sin(t * 4) * 4 : 6;
				const sc = isActive ? 1 + Math.sin(t * 4) * 0.02 : 1;
				applyScale(sc);
				const bw = ww + fontSizePx;
				const bh = fontSizePx * 1.5;
				ctx.fillStyle = `rgba(0,255,0,${isActive ? 0.15 : 0.05})`;
				ctx.beginPath();
				ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 4);
				ctx.fill();
				drawText(text, `rgba(0,255,0,${alpha})`, undefined, 0, '#00FF00', glowSize);
				break;
			}
			case 'pop3d': {
				const sc = isActive ? 1 + spring(t * 3) * 0.15 : 1;
				applyScale(sc);
				for (let i = 5; i >= 1; i--) {
					ctx.fillStyle = outlineColor;
					ctx.fillText(text, i, i);
				}
				drawText(text, isActive ? highlightColor : fontColor, outlineColor, outlineWidth);
				break;
			}
			case 'liquid': {
				const hue = (t * 90) % 360;
				const w1 = isActive ? Math.sin(t * 3) * 4 : 0;
				const w2 = isActive ? Math.cos(t * 2.5) * 3 : 0;
				ctx.translate(w2, w1 * 0.5);
				if (isActive) {
					ctx.shadowColor = 'rgba(180,180,255,0.6)';
					ctx.shadowBlur = 6;
				}
				const grad = applyGradientText([
					[0, '#cccccc'], [0.3, '#ffffff'],
					[0.6, hslToStr(hue, 60, 80)], [1, '#999999'],
				], 90 + w1 * 5);
				ctx.fillStyle = grad;
				ctx.fillText(text, 0, 0);
				ctx.shadowBlur = 0;
				break;
			}
			case 'explosive': {
				const sc = isActive ? 1 + Math.abs(Math.sin(t * 4)) * 0.3 : 1;
				const rot = isActive ? Math.sin(t * 4) * 4 : 0;
				const hue = (t * 180) % 360;
				applyScale(sc);
				applyRotate(rot);
				const glowBlur = isActive ? 20 + Math.sin(t * 5) * 8 : 0;
				drawText(text, isActive ? hslToStr(hue, 100, 60) : fontColor,
					outlineColor, outlineWidth, isActive ? hslToStr(hue, 100, 70) : undefined, glowBlur);
				break;
			}
			case 'neonglow': {
				const hue = (t * 120) % 360;
				const glowSize = isActive ? 20 + Math.sin(t * 5) * 8 : 10;
				const sc = isActive ? 1 + spring(t * 2) * 0.05 : 1;
				applyScale(sc);
				ctx.shadowColor = hslToStr(hue, 100, 50);
				ctx.shadowBlur = glowSize * 2.5;
				ctx.fillStyle = hslToStr(hue, 100, 70);
				ctx.fillText(text, 0, 0);
				ctx.shadowBlur = glowSize * 1.8;
				ctx.fillText(text, 0, 0);
				ctx.shadowBlur = glowSize;
				ctx.fillText(text, 0, 0);
				ctx.shadowBlur = 0;
				break;
			}
			case 'glitch': {
				if (isActive) {
					const gX = Math.sin(t * 9) * 4;
					ctx.save();
					ctx.globalCompositeOperation = 'screen';
					ctx.fillStyle = '#ff00ff';
					ctx.fillText(text, -gX * 0.8, 0);
					ctx.fillStyle = '#00ffff';
					ctx.fillText(text, gX * 0.8, 0);
					ctx.restore();
				}
				const sk = isActive ? Math.sin(t * 12) * 5 : 0;
				ctx.transform(1, 0, Math.tan((sk * Math.PI) / 180), 1, 0, 0);
				drawText(text, fontColor, outlineColor, outlineWidth,
					highlightColor, isActive ? 15 : 8);
				break;
			}
			case 'fire':
			case 'firetext': {
				const fl = isActive ? Math.sin(t * 12) * 3 : 0;
				const fl2 = isActive ? Math.cos(t * 9) * 2 : 0;
				const hue = isActive ? 30 + Math.sin(t * 4) * 15 : 30;
				ctx.translate(0, fl);
				ctx.transform(1, 0, Math.tan((fl2 * Math.PI) / 180), 1, 0, 0);
				const fireGrad = applyGradientText([
					[0, hslToStr(hue - 10, 100, 40)],
					[0.5, hslToStr(hue + 10, 100, 60)],
					[1, hslToStr(hue - 10, 100, 40)],
				], 90);
				drawText(text, fireGrad, '#ff6600', 1, '#ff4500', isActive ? 20 : 10);
				break;
			}
			case 'water': {
				const w1 = Math.sin(t * 4) * 5;
				const w2 = Math.cos(t * 3) * 3;
				ctx.translate(w2, w1);
				const waterGrad = applyGradientText([[0, '#00ffff'], [0.5, '#ffffff'], [1, '#00aaff']], 90);
				drawText(text, waterGrad, '#00aaff', 1.5, '#00ffff', isActive ? 15 : 5);
				break;
			}
			case 'rainbow': {
				const hue = (t * 150) % 360;
				const sc = isActive ? 1 + spring(t * 2) * 0.1 : 1;
				applyScale(sc);
				const rbGrad = applyGradientText([
					[0, hslToStr(hue, 100, 60)],
					[0.5, hslToStr((hue + 180) % 360, 100, 60)],
					[1, hslToStr((hue + 360) % 360, 100, 60)],
				], 135);
				drawText(text, rbGrad, undefined, 0, hslToStr(hue, 100, 70), isActive ? 18 : 8);
				break;
			}
			case 'rainbowwave': {
				const hue = (t * 150) % 360;
				const sc = isActive ? 1 + spring(t * 2) * 0.1 : 1;
				const ty = isActive ? Math.sin(t * 4) * 6 : 0;
				applyScale(sc);
				ctx.translate(0, ty);
				const rbGradW = applyGradientText([
					[0, hslToStr(hue, 100, 60)],
					[0.33, hslToStr((hue + 60) % 360, 100, 60)],
					[0.66, hslToStr((hue + 120) % 360, 100, 60)],
					[1, hslToStr((hue + 180) % 360, 100, 60)],
				], 135);
				ctx.shadowColor = hslToStr(hue, 100, 70);
				ctx.shadowBlur = isActive ? 14 + Math.sin(t * 5) * 5 : 0;
				ctx.fillStyle = rbGradW;
				ctx.fillText(text, 0, 0);
				ctx.shadowBlur = 0;
				break;
			}
			case 'pixel': {
				const sc = isActive ? 1.1 : 1;
				applyScale(sc);
				drawText(text, fontColor, outlineColor, 2, highlightColor, isActive ? 10 : 0);
				break;
			}
			case 'retro': {
				const sc = isActive ? 1 + Math.sin(t * 4) * 0.05 : 1;
				applyScale(sc);
				drawText(text, fontColor, undefined, 0, '#ff44aa', isActive ? 12 : 6, 3, 3);
				break;
			}
			case 'glass': {
				const alpha = isActive ? Math.min(1, t * 4) : 0.8;
				const bw = ww + fontSizePx * 1.2;
				const bh = fontSizePx * 1.4;
				ctx.globalAlpha = isActive ? 0.08 + Math.sin(t * 2) * 0.03 : 0.05;
				ctx.fillStyle = 'rgba(255,255,255,1)';
				ctx.beginPath();
				ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 12);
				ctx.fill();
				ctx.globalAlpha = alpha;
				const glassAlpha = 0.55 + (isActive ? Math.sin(t * 3) * 0.2 : 0);
				drawText(text, `rgba(255,255,255,${glassAlpha})`,
					`rgba(255,255,255,${0.6 + Math.sin(t * 2.5) * 0.2})`, outlineWidth,
					'rgba(255,255,255,0.8)', isActive ? 12 + Math.sin(t * 3.5) * 5 : 8);
				ctx.globalAlpha = 1;
				break;
			}
			case 'bouncycolor': {
				const sc = isActive ? 1 + spring(t * 3) * 0.2 : 1;
				applyScale(sc);
				const color = isActive ? highlightColor : fontColor;
				drawText(text, color, outlineColor, outlineWidth, 'rgba(0,0,0,0.5)', isActive ? 15 : 0);
				break;
			}
			case 'wordbyword': {
				const alpha = isActive ? Math.min(1, t * 6) : isPast ? 1 : 0;
				ctx.globalAlpha = alpha;
				const sc = isActive ? 0.8 + easeOut(t * 5) * 0.2 : 1;
				applyScale(sc);
				drawText(text, isActive ? highlightColor : fontColor, outlineColor, outlineWidth);
				ctx.globalAlpha = 1;
				break;
			}
			case 'highlightbox': {
				const alpha = isActive ? 1 : isPast ? 1 : 0.3;
				ctx.globalAlpha = alpha;
				if (isActive) {
					const bw = ww + fontSizePx * 0.6;
					const bh = fontSizePx * 1.1;
					ctx.fillStyle = highlightColor;
					ctx.fillRect(-bw/2, -bh/2, bw, bh);
					drawText(text, '#000000');
				} else {
					drawText(text, fontColor, outlineColor, outlineWidth);
				}
				ctx.globalAlpha = 1;
				break;
			}
			case 'splitflap': {
				const bw = ww + fontSizePx * 0.5;
				const bh = fontSizePx * 1.2;
				ctx.fillStyle = '#111111';
				ctx.fillRect(-bw/2, -bh/2, bw, bh);
				ctx.strokeStyle = '#333333';
				ctx.lineWidth = 1;
				ctx.strokeRect(-bw/2, -bh/2, bw, bh);
				ctx.beginPath();
				ctx.moveTo(-bw/2, 0); ctx.lineTo(bw/2, 0);
				ctx.stroke();
				if (isActive) {
					const scY = Math.abs(Math.cos(t * 10));
					ctx.transform(1, 0, 0, scY, 0, 0);
				}
				drawText(text, highlightColor);
				break;
			}
			case 'zoombeat': {
				const sc = isActive ? 1 + Math.pow(Math.sin(t * 8), 2) * 0.2 : 1;
				applyScale(sc);
				drawText(text, fontColor, outlineColor, outlineWidth);
				break;
			}
			case 'shadowdepth': {
				const off = isActive ? 4 + Math.sin(t * 4) * 4 : 4;
				drawText(text, fontColor, undefined, 0, outlineColor, 0, off, off);
				break;
			}
			case 'outlineflash': {
				const alpha = isActive ? 0.3 + Math.abs(Math.sin(t * 10)) * 0.7 : 0;
				ctx.strokeStyle = highlightColor;
				ctx.lineWidth = outlineWidth * 1.5;
				ctx.globalAlpha = alpha;
				ctx.strokeText(text, 0, 0);
				ctx.globalAlpha = 1;
				drawText(text, 'transparent', highlightColor, outlineWidth);
				break;
			}
			case 'sticker': {
				const bw = ww + fontSizePx * 0.8;
				const bh = fontSizePx * 1.2;
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.roundRect(-bw/2-2, -bh/2-2, bw+4, bh+4, 8);
				ctx.fill();
				ctx.fillStyle = highlightColor;
				ctx.beginPath();
				ctx.roundRect(-bw/2, -bh/2, bw, bh, 6);
				ctx.fill();
				drawText(text, '#000000');
				break;
			}
			case 'punchtext': {
				const sc = isActive ? 2 - easeOut(t * 6) * 1 : 1;
				applyScale(sc);
				drawText(text, fontColor, outlineColor, outlineWidth, 'rgba(0,0,0,0.5)', isActive ? 20 : 5);
				break;
			}
			case 'threed': {
				const rotY = isActive ? Math.sin(t * 4) * 30 : 0;
				ctx.transform(Math.cos(rotY * Math.PI / 180), 0, 0, 1, 0, 0);
				for(let i=6; i>0; i--) {
					ctx.fillStyle = 'rgba(0,0,0,0.3)';
					ctx.fillText(text, i, i);
				}
				drawText(text, fontColor);
				break;
			}
			case 'bubble': {
				const bw = ww + fontSizePx * 1.2;
				const bh = fontSizePx * 1.5;
				ctx.fillStyle = '#FFFFFF';
				ctx.beginPath();
				ctx.roundRect(-bw/2, -bh/2, bw, bh, 20);
				ctx.fill();
				ctx.beginPath();
				ctx.moveTo(0, bh/2); ctx.lineTo(-10, bh/2 + 10); ctx.lineTo(10, bh/2);
				ctx.fill();
				drawText(text, '#111111');
				break;
			}
			case 'clean': {
				const sc = isActive ? 1 + spring(t * 2) * 0.1 : 1;
				applyScale(sc);
				drawText(text, isActive ? highlightColor : fontColor);
				break;
			}
			default: {
				const sc = isActive ? 1.1 : 1;
				applyScale(sc);
				drawText(text, isActive ? highlightColor : fontColor, outlineColor, outlineWidth);
				break;
			}
		}

		ctx.restore();
		cursorX += ww + spaceWidth;
	}
}
