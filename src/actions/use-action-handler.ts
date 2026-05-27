import { useEffect } from "react";
import { subscribeToAction } from "./registry";

export function useActionHandler(
	action: string,
	handler: (args?: any) => void,
	deps?: any[]
) {
	useEffect(() => {
		return subscribeToAction(action, handler);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [action, ...(deps || [])]);
}
