"use client";

import { Separator } from "@/components/ui/separator";
import { type Tab, useAssetsPanelStore } from "@/components/editor/panels/assets/assets-panel-store";
import { TabBar } from "./tabbar";
import { Captions } from "@/subtitles/components/assets-view";
import { MediaView } from "./views/assets";
import { SoundsView } from "@/sounds/components/assets-view";
import { StickersView } from "@/stickers/components/assets-view";
import { TextView } from "@/text/components/assets-view";
import { EffectsView } from "@/effects/components/assets-view";
import { ShapesView } from "./views/shapes";
import { BrandKitView } from "./views/brandkit";
import { LibraryView } from "./views/library";
import { AIView } from "./views/ai";
import { BrainrotsView } from "./views/brainrots";
import { TransitionsView } from "./views/transitions";
import { MiscView } from "./views/misc";
import { AnimationsView } from "./views/animations";

export function AssetsPanel() {
	const { activeTab } = useAssetsPanelStore();

	const viewMap: Record<Tab, React.ReactNode> = {
		text: <TextView />,
		captions: <Captions />,
		shapes: <ShapesView />,
		brandkit: <BrandKitView />,
		library: <LibraryView />,
		audio: <SoundsView />,
		ai: <AIView />,
		stickers: <StickersView />,
		media: <MediaView />,
		brainrots: <BrainrotsView />,
		filters: <EffectsView />,
		transitions: <TransitionsView />,
		misc: <MiscView />,
		animations: <AnimationsView />,
	};

	return (
		<div className="panel bg-background flex h-full rounded-lg border overflow-hidden">
			<TabBar />
			<Separator orientation="vertical" />
			<div className="flex-1 overflow-hidden">{viewMap[activeTab]}</div>
		</div>
	);
}
