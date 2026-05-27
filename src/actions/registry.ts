import type { TAction } from "./definitions";

type ActionCallback = (args?: any, source?: string) => void;

const listeners = new Map<string, Set<ActionCallback>>();

export function invokeAction(action: TAction | string, args?: any, source?: string) {
	const callbacks = listeners.get(action as string);
	if (callbacks) {
		for (const cb of callbacks) {
			cb(args, source);
		}
	}
}

export function subscribeToAction(action: string, callback: ActionCallback) {
	let callbacks = listeners.get(action);
	if (!callbacks) {
		callbacks = new Set();
		listeners.set(action, callbacks);
	}
	callbacks.add(callback);
	return () => {
		callbacks!.delete(callback);
		if (callbacks!.size === 0) {
			listeners.delete(action);
		}
	};
}
