"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { clipsApi, videosApi, subtitlesApi } from "@/lib/api";
import { EditorCore } from "@/core";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditorRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = searchParams.get("videoId");
  const clipId = searchParams.get("clipId");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeProject() {
      if (!videoId) {
        toast.error("Video ID is required");
        router.push("/");
        return;
      }

      try {
        const editor = EditorCore.getInstance();
        
        // Ensure editor is ready
        if (!editor.project.getIsInitialized()) {
          await editor.project.loadAllProjects();
        }

        let rawPath = "";
        let projectName = "Kurt Cut Project";

        if (clipId) {
          // Fetch clip data to get the video path
          const targetClip = await clipsApi.get(clipId);
          if (!targetClip) throw new Error("Clip not found");
          rawPath = (targetClip as any)?.file_path
            || (targetClip as any)?.output_path
            || (targetClip as any)?.caminho_arquivo || "";
          projectName = targetClip.title || projectName;
        } else {
          // Fetch main video data
          const targetVideo = await videosApi.get(videoId);
          if (!targetVideo) throw new Error("Video not found");
          rawPath = targetVideo.file_path || "";
          projectName = targetVideo.title || projectName;
        }

        let videoUrl = "";
        if (rawPath) {
          const formattedPath = rawPath.replace(/\\/g, "/");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
          videoUrl = formattedPath.startsWith("http")
            ? formattedPath
            : `${apiUrl}/${formattedPath.startsWith("uploads") ? "" : "uploads/"}${formattedPath}`;
        } else {
          throw new Error("No video path found");
        }

        // ── Convert JSON words to SRT string ──
        let words: any[] = [];
        if (clipId) {
           const targetClip = await clipsApi.get(clipId);
           words = (targetClip as any)?.dados_legenda?.words || [];
        } else {
           const targetVideoForSubtitles = await videosApi.get(videoId);
           words = (targetVideoForSubtitles as any)?.transcript_words || [];
        }

        let srtContent = "";
        if (words && words.length > 0) {
            const formatTime = (secs: number) => {
                const h = Math.floor(secs / 3600);
                const m = Math.floor((secs % 3600) / 60);
                const s = Math.floor(secs % 60);
                const ms = Math.floor((secs % 1) * 1000);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
            };

            // Group words into chunks of 2 words per subtitle block
            const maxWordsPerCaption = 2;
            const groupedSrtParts: string[] = [];
            for (let i = 0; i < words.length; i += maxWordsPerCaption) {
                const group = words.slice(i, i + maxWordsPerCaption);
                const text = group.map((w) => w.text).join(" ");
                const start = group[0].start;
                const end = group[group.length - 1].end;
                const index = Math.floor(i / maxWordsPerCaption) + 1;
                groupedSrtParts.push(`${index}\n${formatTime(Number(start))} --> ${formatTime(Number(end))}\n${text}\n`);
            }
            srtContent = groupedSrtParts.join('\n');
        }

        // Create a new project in OpenCut
        const projectId = await editor.project.createNewProject({
          name: projectName,
        });

        // Redirect to the actual editor page with the new project ID
        sessionStorage.setItem(`import_video_${projectId}`, videoUrl);
        if (srtContent) {
           sessionStorage.setItem(`import_srt_text_${projectId}`, srtContent);
        }

        router.replace(`/editor/${projectId}`);

      } catch (err: any) {
        console.error("Failed to initialize OpenCut project:", err);
        toast.error("Failed to load project: " + err.message);
        router.push(`/clips?videoId=${videoId}`);
      } finally {
        setLoading(false);
      }
    }

    initializeProject();
  }, [videoId, clipId, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Preparing OpenCut Editor...</p>
      </div>
    </div>
  );
}
