import type { ElementRef, SceneTracks } from "@/timeline";
import { findTrackInSceneTracks } from "@/timeline/track-element-update";
import type { GroupMember, MoveGroup } from "./types";
import { getTrackPlacementById } from "./track-placement";
import { subMediaTime } from "@/wasm";

export function buildMoveGroup({
	anchorRef,
	selectedElements,
	tracks,
}: {
	anchorRef: ElementRef;
	selectedElements: ElementRef[];
	tracks: SceneTracks;
}): MoveGroup | null {
	const anchorTrack = findTrackInSceneTracks({
		tracks,
		trackId: anchorRef.trackId,
	});
	const anchorElement = anchorTrack?.elements.find(
		(element) => element.id === anchorRef.elementId,
	);
	const anchorPlacement = getTrackPlacementById({
		tracks,
		trackId: anchorRef.trackId,
	});
	if (!anchorTrack || !anchorElement || !anchorPlacement || anchorTrack.type === "text") {
		return null;
	}

	const seen = new Set<string>();
	let orderedRefs = [anchorRef, ...selectedElements];

	orderedRefs = orderedRefs.filter((elementRef) => {
		if (seen.has(elementRef.elementId)) {
			return false;
		}
		const placement = getTrackPlacementById({
			tracks,
			trackId: elementRef.trackId,
		});
		if (placement && placement.trackType === "text") {
			return false;
		}

		seen.add(elementRef.elementId);
		return true;
	});

	const members = orderedRefs.flatMap((elementRef): GroupMember[] => {
		const track = findTrackInSceneTracks({
			tracks,
			trackId: elementRef.trackId,
		});
		const element = track?.elements.find(
			(trackElement) => trackElement.id === elementRef.elementId,
		);
		const placement = getTrackPlacementById({
			tracks,
			trackId: elementRef.trackId,
		});
		if (!track || !element || !placement) {
			return [];
		}

		return [
			{
				trackId: track.id,
				elementId: element.id,
				elementType: element.type,
				duration: element.duration,
				timeOffset: subMediaTime({
					a: element.startTime,
					b: anchorElement.startTime,
				}),
				trackSection: placement.section,
				sectionIndex: placement.sectionIndex,
				displayIndex: placement.displayIndex,
			},
		];
	});

	if (members.length === 0) {
		return null;
	}

	const anchor = members.find(
		(member) =>
			member.trackId === anchorRef.trackId &&
			member.elementId === anchorRef.elementId,
	);
	if (!anchor) {
		return null;
	}

	return {
		anchor,
		members,
	};
}
