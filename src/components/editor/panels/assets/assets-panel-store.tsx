import type { ElementType } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	TextIcon,
	ShapesIcon,
	PackageIcon,
	BookIcon,
	MusicNoteIcon,
	MagicWandIcon,
	Happy01Icon,
	ImageIcon,
	StarIcon,
	SlidersHorizontalIcon,
	FlashIcon,
	Settings01Icon,
	FilmIcon,
	SubtitleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export const TAB_KEYS = [
	"text",
	"captions",
	"shapes",
	"brandkit",
	"library",
	"audio",
	"ai",
	"stickers",
	"media",
	"brainrots",
	"filters",
	"transitions",
	"misc",
	"animations",
] as const;

export type Tab = (typeof TAB_KEYS)[number];

const createHugeiconsIcon =
	({ icon }: { icon: IconSvgElement }) =>
	// eslint-disable-next-line react/display-name
	({ className }: { className?: string }) => (
		<HugeiconsIcon icon={icon} className={className} />
	);

export const tabs = {
	text: {
		icon: createHugeiconsIcon({ icon: TextIcon }),
		label: "Texto",
	},
	captions: {
		icon: createHugeiconsIcon({ icon: SubtitleIcon }),
		label: "Legendas",
	},
	shapes: {
		icon: createHugeiconsIcon({ icon: ShapesIcon }),
		label: "Formas",
	},
	brandkit: {
		icon: createHugeiconsIcon({ icon: PackageIcon }),
		label: "Brand Kit",
	},
	library: {
		icon: createHugeiconsIcon({ icon: BookIcon }),
		label: "Bibliotecas",
	},
	audio: {
		icon: createHugeiconsIcon({ icon: MusicNoteIcon }),
		label: "Música",
	},
	ai: {
		icon: createHugeiconsIcon({ icon: MagicWandIcon }),
		label: "IA",
	},
	stickers: {
		icon: createHugeiconsIcon({ icon: Happy01Icon }),
		label: "Emoji",
	},
	media: {
		icon: createHugeiconsIcon({ icon: ImageIcon }),
		label: "Memes",
	},
	brainrots: {
		icon: createHugeiconsIcon({ icon: StarIcon }),
		label: "Brainrots",
	},
	filters: {
		icon: createHugeiconsIcon({ icon: SlidersHorizontalIcon }),
		label: "Filtros",
	},
	transitions: {
		icon: createHugeiconsIcon({ icon: FlashIcon }),
		label: "Transições",
	},
	misc: {
		icon: createHugeiconsIcon({ icon: Settings01Icon }),
		label: "Diversos",
	},
	animations: {
		icon: createHugeiconsIcon({ icon: FilmIcon }),
		label: "Animações",
	},
} satisfies Record<
	Tab,
	{ icon: ElementType<{ className?: string }>; label: string }
>;

export type MediaViewMode = "grid" | "list";
export type MediaSortKey = "name" | "type" | "duration" | "size";
export type MediaSortOrder = "asc" | "desc";

interface AssetsPanelStore {
	activeTab: Tab;
	setActiveTab: (tab: Tab) => void;
	highlightMediaId: string | null;
	requestRevealMedia: (mediaId: string) => void;
	clearHighlight: () => void;

	/* Media */
	mediaViewMode: MediaViewMode;
	setMediaViewMode: (mode: MediaViewMode) => void;
	mediaSortBy: MediaSortKey;
	mediaSortOrder: MediaSortOrder;
	setMediaSort: (args: { key: MediaSortKey; order: MediaSortOrder }) => void;
}

export const useAssetsPanelStore = create<AssetsPanelStore>()(
	persist(
		(set) => ({
			activeTab: "text",
			setActiveTab: (tab) => set({ activeTab: tab }),
			highlightMediaId: null,
			requestRevealMedia: (mediaId) =>
				set({ activeTab: "media", highlightMediaId: mediaId }),
			clearHighlight: () => set({ highlightMediaId: null }),
			mediaViewMode: "grid",
			setMediaViewMode: (mode) => set({ mediaViewMode: mode }),
			mediaSortBy: "name",
			mediaSortOrder: "asc",
			setMediaSort: ({ key, order }) =>
				set({ mediaSortBy: key, mediaSortOrder: order }),
		}),
		{
			name: "assets-panel",
			partialize: (state) => ({
				mediaViewMode: state.mediaViewMode,
				mediaSortBy: state.mediaSortBy,
				mediaSortOrder: state.mediaSortOrder,
			}),
		},
	),
);


