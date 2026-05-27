"use client";

import { Button } from "../ui/button";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExportButton } from "./export-button";
import { FeedbackPopover } from "@/feedback/components/feedback-popover";
import { ThemeToggle } from "../theme-toggle";
import { toast } from "sonner";
import { useEditor } from "@/editor/use-editor";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/utils/ui";

export function EditorHeader() {
	return (
		<header className="bg-background relative flex h-12 items-center justify-between border-b px-4">
			<div className="flex items-center gap-1.5">
				<BackButton />
				<div className="bg-border mx-1 h-4 w-px opacity-50" />
				<EditableProjectName />
			</div>
			<nav className="flex items-center gap-1.5">
				<FeedbackPopover />
				<ExportButton />
				<ThemeToggle />
			</nav>
			{/* Subtle accent line at bottom */}
			<div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
		</header>
	);
}

function BackButton() {
	const router = useRouter();
	return (
		<Button 
			variant="ghost" 
			size="icon" 
			className="p-1 rounded-sm size-8"
			onClick={() => router.back()}
			title="Voltar"
		>
			<HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
		</Button>
	);
}

function EditableProjectName() {
	const editor = useEditor();
	const activeProject = useEditor((e) => e.project.getActive());
	const [isEditing, setIsEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const originalNameRef = useRef("");

	const projectName = activeProject?.metadata.name || "";

	const startEditing = () => {
		if (isEditing) return;
		originalNameRef.current = projectName;
		setIsEditing(true);

		requestAnimationFrame(() => {
			inputRef.current?.select();
		});
	};

	const saveEdit = async () => {
		if (!inputRef.current || !activeProject) return;
		const newName = inputRef.current.value.trim();
		setIsEditing(false);

		if (!newName) {
			inputRef.current.value = originalNameRef.current;
			return;
		}

		if (newName !== originalNameRef.current) {
			try {
				await editor.project.renameProject({
					id: activeProject.metadata.id,
					name: newName,
				});
			} catch (error) {
				toast.error("Failed to rename project", {
					description:
						error instanceof Error ? error.message : "Please try again",
				});
			}
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			event.preventDefault();
			inputRef.current?.blur();
		} else if (event.key === "Escape") {
			event.preventDefault();
			if (inputRef.current) {
				inputRef.current.value = originalNameRef.current;
				inputRef.current.setSelectionRange(0, 0);
			}
			setIsEditing(false);
			inputRef.current?.blur();
		}
	};

	return (
		<input
			ref={inputRef}
			type="text"
			defaultValue={projectName}
			readOnly={!isEditing}
			onClick={startEditing}
			onBlur={saveEdit}
			onKeyDown={handleKeyDown}
			style={{ fieldSizing: "content" }}
			className={cn(
				"text-[0.82rem] h-7 px-2 py-1 rounded-md bg-transparent outline-none cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors duration-150",
				isEditing && "ring-1 ring-primary/40 cursor-text text-foreground hover:bg-transparent",
			)}
		/>
	);
}
