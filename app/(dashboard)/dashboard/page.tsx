"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MetricCard } from "@/components/dashboard/metric-card"
import { DashboardChart } from "@/components/dashboard/charts"
import { Video, Scissors, Clock, Eye, TrendingUp, ThumbsUp, Flame, TrendingDown, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { videosApi, clipsApi, Video as VideoType, Clip } from "@/lib/api"

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoType[]>([])
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      videosApi.list().catch(() => [] as VideoType[]),
      clipsApi.list().catch(() => [] as Clip[]),
    ]).then(([v, c]) => {
      setVideos(v)
      setClips(c)
    }).finally(() => setLoading(false))
  }, [])

  const totalDuration = videos.reduce((acc: number, v: any) => acc + (v.duration || 0), 0)
  const topClips = [...clips]
    .sort((a, b) => (b.viral_score || 0) - (a.viral_score || 0))
    .slice(0, 5)
  const trendingClips = clips.filter(c => (c.viral_score || 0) >= 80).length
  const lowClips = clips.filter(c => (c.viral_score || 0) < 40).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('dash.title')}</h1>
        <p className="text-muted-foreground">{t('dash.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title={t('dash.metric.videos')}
          value={loading ? "—" : String(videos.length)}
          icon={Video}
          trend={loading ? "" : `${videos.length} total`}
          trendUp={true}
        />
        <MetricCard
          title={t('dash.metric.shorts')}
          value={loading ? "—" : String(clips.length)}
          icon={Scissors}
          trend={loading ? "" : `${clips.filter(c => c.status === 'done' || c.status === 'completed').length} ready`}
          trendUp={true}
        />
        <MetricCard
          title={t('dash.metric.time')}
          value={loading ? "—" : formatDuration(totalDuration)}
          icon={Clock}
          trend="Total processed"
          trendUp={true}
        />
        <MetricCard
          title={t('dash.metric.views')}
          value={loading ? "—" : `${clips.length * 12}K`}
          icon={Eye}
          trend="Estimated"
          trendUp={true}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{t('dash.recentVideos.title')}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/clips")}>
               {t('dash.video.action.view')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {loading ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
               ) : videos.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">Nenhum vídeo enviado ainda.</p>
               ) : videos.slice(0, 5).map((v) => {
                  const isProcessing = v.analysis_status === 'processing' || v.status === 'processing';
                  const isFailed = v.status === 'failed';
                  return (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-accent/5 hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-lg border",
                          isProcessing ? "bg-primary/10 border-primary/20" : "bg-muted border-border"
                        )}>
                          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Video className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold truncate">{v.title || "Sem título"}</p>
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter",
                               isProcessing ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" : 
                               isFailed ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                               "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                             )}>
                               {isProcessing ? t('dash.video.status.processing') : 
                                isFailed ? t('dash.video.status.failed') : 
                                t('dash.video.status.completed')}
                             </span>
                             <span className="text-[10px] text-muted-foreground">• {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}</span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant={isProcessing ? "default" : "outline"} 
                        size="sm" 
                        className="h-8 text-xs font-bold"
                        onClick={() => {
                          if (isProcessing) {
                            router.push(`/clips/loading?videoId=${v.id}`);
                          } else {
                            router.push(`/clips?videoId=${v.id}`);
                          }
                        }}
                      >
                        {isProcessing ? t('dash.video.action.resume') : t('dash.video.action.view')}
                      </Button>
                    </div>
                  );
               })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>{t('dash.topClips.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : topClips.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum clipe ainda. Envie um vídeo para começar.</p>
              ) : topClips.map((clip) => (
                <div key={clip.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none line-clamp-1">{clip.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Eye className="mr-1 h-3 w-3" /> {((clip.viral_score || clip.score || 0) * 1200).toLocaleString()}
                      <ThumbsUp className="ml-3 mr-1 h-3 w-3" /> {Math.round((clip.viral_score || clip.score || 0) * 120)}
                    </div>
                  </div>
                  <div className="font-medium text-sm text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title={t('dash.metric.topViews')} value={loading ? "—" : `${(clips[0]?.viral_score || clips[0]?.score || 0) * 1200}`} icon={TrendingUp} />
        <MetricCard title={t('dash.metric.topLikes')} value={loading ? "—" : `${Math.round((clips[0]?.viral_score || clips[0]?.score || 0) * 120)}`} icon={ThumbsUp} />
        <MetricCard title={t('dash.metric.trending')} value={loading ? "—" : String(trendingClips)} icon={Flame} />
        <MetricCard title={t('dash.metric.low')} value={loading ? "—" : String(lowClips)} icon={TrendingDown} />
      </div>
    </div>
  )
}
