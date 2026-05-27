"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/ui";
import {
	tabs,
	useAssetsPanelStore,
} from "@/components/editor/panels/assets/assets-panel-store";

const TAB_GROUPS = [
	["text", "captions", "shapes"],
	["brandkit", "library", "audio", "ai"],
	["stickers", "media", "brainrots", "filters", "transitions", "misc", "animations"],
] as const;

export function TabBar() {
	const { activeTab, setActiveTab } = useAssetsPanelStore();
	const [showTopFade, setShowTopFade] = useState(false);
	const [showBottomFade, setShowBottomFade] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const checkScrollPosition = useCallback(() => {
		const element = scrollRef.current;
		if (!element) return;

		const { scrollTop, scrollHeight, clientHeight } = element;
		setShowTopFade(scrollTop > 0);
		setShowBottomFade(scrollTop < scrollHeight - clientHeight - 1);
	}, []);

	useEffect(() => {
		const element = scrollRef.current;
		if (!element) return;

		checkScrollPosition();
		element.addEventListener("scroll", checkScrollPosition);

		const resizeObserver = new ResizeObserver(checkScrollPosition);
		resizeObserver.observe(element);

		return () => {
			element.removeEventListener("scroll", checkScrollPosition);
			resizeObserver.disconnect();
		};
	}, [checkScrollPosition]);

	return (
		<div className="relative flex">
			<div
				ref={scrollRef}
				className="scrollbar-hidden relative flex size-full py-3 flex-col items-center justify-start gap-3 overflow-y-auto w-20 bg-background/50"
			>
				{TAB_GROUPS.map((group, groupIndex) => (
					<div key={groupIndex} className="flex flex-col items-center gap-3 w-full">
						{group.map((tabKey) => {
							const tab = tabs[tabKey as keyof typeof tabs];
							if (!tab) return null;
							
							return (
								<button
									key={tabKey}
									onClick={() => setActiveTab(tabKey as any)}
									className={cn(
										"flex flex-col items-center justify-center gap-1.5 w-[60px] py-2 rounded-lg transition-all duration-200 cursor-pointer",
										activeTab === tabKey 
											? "text-primary font-medium" 
											: "text-muted-foreground hover:text-foreground hover:bg-white/5"
									)}
								>
									<tab.icon className="size-[22px] stroke-[1.5]" />
									<span className="text-[0.65rem] leading-none text-center">
										{tab.label}
									</span>
								</button>
							);
						})}
						{groupIndex < TAB_GROUPS.length - 1 && (
							<div className="w-10 h-px bg-border/60 my-1" />
						)}
					</div>
				))}
			</div>

			<FadeOverlay direction="top" show={showTopFade} />
			<FadeOverlay direction="bottom" show={showBottomFade} />
		</div>
	);
}

function FadeOverlay({
	direction,
	show,
}: {
	direction: "top" | "bottom";
	show: boolean;
}) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute right-0 left-0 h-6",
				direction === "top" && show
					? "from-background top-0 bg-linear-to-b to-transparent"
					: "from-background bottom-0 bg-linear-to-t to-transparent",
			)}
		/>
	);
}
