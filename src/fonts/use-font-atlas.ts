import { useState, useMemo, useCallback, useEffect } from "react";
import {
	getCachedFontAtlas,
	loadFontAtlas,
	clearFontAtlasCache,
} from "@/fonts/google-fonts";
import type { FontAtlas } from "@/fonts/types";
import { SYSTEM_FONTS, DEFAULT_GOOGLE_FONTS } from "@/fonts/system-fonts";

type Status = "idle" | "loading" | "error";

export function useFontAtlas({ open }: { open: boolean }) {
	const [atlas, setAtlas] = useState<FontAtlas | null>(() =>
		getCachedFontAtlas(),
	);
	const [status, setStatus] = useState<Status>(() =>
		getCachedFontAtlas() ? "idle" : "loading",
	);

	useEffect(() => {
		if (!open || atlas) return;

		// eslint-disable-next-line react-hooks/set-state-in-effect
		setStatus("loading");
		loadFontAtlas().then((data) => {
			if (data) {
				setAtlas(data);
				setStatus("idle");
			} else {
				setAtlas(null);
				setStatus("idle");
			}
		});
	}, [open, atlas]);

	const retry = useCallback(() => {
		clearFontAtlasCache();
		setStatus("loading");
		loadFontAtlas().then((data) => {
			if (data) {
				setAtlas(data);
				setStatus("idle");
			} else {
				setAtlas(null);
				setStatus("idle");
			}
		});
	}, []);

	const fontNames = useMemo(() => {
		const baseFonts = [...SYSTEM_FONTS, ...DEFAULT_GOOGLE_FONTS];
		if (!atlas) return baseFonts.sort();
		return [...Object.keys(atlas.fonts), ...baseFonts].sort();
	}, [atlas]);

	return { atlas, status, fontNames, retry };
}
