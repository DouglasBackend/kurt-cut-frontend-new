"use client"

import { useState, useEffect } from "react"
import { UploadCloud, Link as LinkIcon, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { projectsApi, videosApi, Project } from "@/lib/api"
import { toast } from "sonner"
import { CreditsModal } from "@/components/modals/credits-modal"

export function UploadArea() {
  const [isDragging, setIsDragging] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [creatingProject, setCreatingProject] = useState(false)
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()

  useEffect(() => {
    projectsApi.list().then((list) => {
      setProjects(list)
      if (list.length > 0) setSelectedProject(list[0].id)
    }).catch(() => {})
  }, [])

  const ensureProject = async (): Promise<string> => {
    if (selectedProject) return selectedProject
    setCreatingProject(true)
    const p = await projectsApi.create({ title: "My Project" })
    setProjects((prev) => [...prev, p])
    setSelectedProject(p.id)
    setCreatingProject(false)
    return p.id
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) await handleUpload(file)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    if ((user?.creditos_disponiveis || 0) < 1) {
      setIsCreditsModalOpen(true)
      return
    }

    setError("")
    setUploading(true)
    try {
      const projectId = await ensureProject()
      const video = await videosApi.upload(projectId, file)
      await videosApi.startProcessing(video.id, { 
        aspect_ratio: aspectRatio,
        burn_subtitles: false 
      })
      router.push(`/clips/loading?videoId=${video.id}`)
    } catch (err: any) {
      if (err.message?.includes("Créditos insuficientes")) {
        setIsCreditsModalOpen(true)
      } else {
        setError(err.message || t('upload.error'))
      }
    } finally {
      setUploading(false)
    }
  }

  const handleLinkSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!youtubeUrl || uploading) return

    if ((user?.creditos_disponiveis || 0) < 1) {
      setIsCreditsModalOpen(true)
      return
    }

    setError("")
    setUploading(true)
    try {
      const projectId = await ensureProject()
      const video = await videosApi.importYoutube(projectId, youtubeUrl, { 
        aspect_ratio: aspectRatio,
        burn_subtitles: false
      })
      router.push(`/clips/loading?videoId=${video.id}`)
    } catch (err: any) {
      if (err.message?.includes("Créditos insuficientes")) {
        setIsCreditsModalOpen(true)
      } else {
        setError(err.message || t('upload.error'))
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Card className="mx-auto max-w-2xl bg-card border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-8 space-y-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight">Recortar Vídeo</h2>
            <p className="text-sm text-muted-foreground">Importe um vídeo para começar a criar cortes virais.</p>
          </div>

          {projects.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Projeto</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 p-1 bg-muted/50 border border-border/50">
              <TabsTrigger value="link" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <LinkIcon className="h-4 w-4 mr-2" />
                Link
              </TabsTrigger>
              <TabsTrigger value="file" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <UploadCloud className="h-4 w-4 mr-2" />
                Arquivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-0 focus-visible:outline-none">
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 p-10 text-center bg-muted/10 transition-all hover:bg-muted/20">
                  <div className="rounded-2xl bg-primary/10 p-5 mb-5 ring-1 ring-primary/20">
                    <LinkIcon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Coloque o Link aqui</h3>
                  <p className="mb-8 text-sm text-muted-foreground">Suporte para YouTube, Instagram, TikTok e mais.</p>
                  <div className="flex w-full max-w-lg items-center space-x-2">
                    <Input
                      type="url"
                      placeholder="https://..."
                      required
                      className="h-12 bg-background border-border/50 focus:border-primary transition-all"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                    />
                    <Button type="submit" size="lg" disabled={uploading || creatingProject} className="h-12 px-8 font-bold">
                      {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Processar"}
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="file" className="mt-0 focus-visible:outline-none">
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-all ${
                  isDragging 
                  ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
                  : "border-border/50 hover:border-primary/50 hover:bg-muted/10"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="rounded-2xl bg-primary/10 p-5 mb-5 ring-1 ring-primary/20">
                  <UploadCloud className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Escolha um Arquivo</h3>
                <p className="mb-8 text-sm text-muted-foreground">Formatos MP4, MOV, AVI suportados (máx 500MB)</p>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 font-bold"
                  disabled={uploading || creatingProject}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  {uploading ? "Subindo..." : "Selecionar Vídeo"}
                </Button>
                <input id="file-upload" type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-6 border-t border-border/50">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Proporção do Vídeo</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setAspectRatio("9:16")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                    aspectRatio === "9:16"
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                      : "bg-card border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="w-8 h-12 border-2 border-current rounded-sm mb-1 opacity-80" />
                  <span className="text-sm font-bold">9:16 Vertical</span>
                  <span className="text-[10px] text-muted-foreground uppercase">TikTok, Reels, Shorts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio("16:9")}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                    aspectRatio === "16:9"
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                      : "bg-card border-border/50 hover:border-primary/30"
                  }`}
                >
                  <div className="w-12 h-8 border-2 border-current rounded-sm mb-1 opacity-80" />
                  <span className="text-sm font-bold">16:9 Horizontal</span>
                  <span className="text-[10px] text-muted-foreground uppercase">YouTube, Desktop</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreditsModal isOpen={isCreditsModalOpen} onClose={() => setIsCreditsModalOpen(false)} />
    </>
  )
}
