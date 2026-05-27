"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Youtube, Instagram, Facebook, Video, CheckCircle2, Loader2, X, Calendar, Globe, Info, Plus, Lock } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { youtubeApi, YoutubeAccount } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

function IntegrationsContent() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [ytAccount, setYtAccount] = useState<YoutubeAccount | null>(null)
  const [ytLoading, setYtLoading] = useState(true)
  const [ytError, setYtError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)
  const [showYtModal, setShowYtModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [updating, setUpdating] = useState(false)

  const isPlatformAllowed = (platform: string) => {
    const plano = user?.plano?.toLowerCase() || 'free'
    if (plano === 'custom') return true
    if (plano === 'pro') return ['youtube', 'tiktok', 'instagram', 'facebook'].includes(platform.toLowerCase())
    if (plano === 'start') return ['youtube', 'tiktok'].includes(platform.toLowerCase())
    return false
  }

  useEffect(() => {
    setYtLoading(true)
    setYtError(null)
    
    youtubeApi.status()
      .then((data) => {
        setYtAccount(data)
        if (searchParams.get('success') === 'true' && data) {
          setShowYtModal(true)
          setNewName(data.nome_canal || "")
        }
      })
      .catch((err: any) => {
        console.error("YouTube Status Error:", err)
        const statusStr = err.message || "Unknown error"
        setYtError(`Connection error: ${statusStr}`)
        setYtAccount(null)
      })
      .finally(() => setYtLoading(false))
    
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      setTimeout(() => setShowSuccess(false), 5000)
    }
  }, [searchParams])

  const handleYoutubeConnect = () => {
    const token = localStorage.getItem('token')
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = `${API_URL}/api/youtube/auth?token=${token}`
  }

  const handleYoutubeDisconnect = async () => {
    setDisconnecting(true)
    try {
      await youtubeApi.disconnect()
      setYtAccount(null)
      setShowYtModal(false)
    } catch (_) {}
    setDisconnecting(false)
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || newName === ytAccount?.nome_canal) {
      setEditingName(false)
      return
    }

    setUpdating(true)
    try {
      const updated = await youtubeApi.updateStatus({ nome_canal: newName })
      setYtAccount(updated)
      setEditingName(false)
    } catch (err) {
      alert("Failed to update name")
    }
    setUpdating(false)
  }

  const allIntegrations = [
    {
      name: "YouTube",
      description: t('integrations.ytDesc'),
      icon: Youtube,
      color: "text-red-500",
      connected: !!ytAccount && !!ytAccount.id,
      loading: ytLoading,
      allowed: isPlatformAllowed('youtube'),
      onConnect: handleYoutubeConnect,
      onManage: () => {
        setNewName(ytAccount?.nome_canal || "")
        setShowYtModal(true)
      },
      accountLabel: ytAccount?.nome_canal,
      avatar: ytAccount?.miniatura_canal,
    },
    {
      name: "TikTok",
      description: t('integrations.ttDesc'),
      icon: Video,
      color: "text-black dark:text-white",
      connected: false,
      loading: false,
      allowed: isPlatformAllowed('tiktok'),
      onConnect: () => alert("TikTok Integração em Breve!"),
      onManage: () => {},
      accountLabel: undefined,
      avatar: undefined,
    },
    {
      name: "Instagram",
      description: t('integrations.igDesc'),
      icon: Instagram,
      color: "text-pink-500",
      connected: false,
      loading: false,
      allowed: isPlatformAllowed('instagram'),
      onConnect: () => alert("Instagram Integração em Breve!"),
      onManage: () => {},
      accountLabel: undefined,
      avatar: undefined,
    },
    {
      name: "Facebook",
      description: t('integrations.fbDesc'),
      icon: Facebook,
      color: "text-blue-600",
      connected: false,
      loading: false,
      allowed: isPlatformAllowed('facebook'),
      onConnect: () => alert("Facebook Integração em Breve!"),
      onManage: () => {},
      accountLabel: undefined,
    },
  ]

  const visibleIntegrations = allIntegrations.filter(i => i.connected)

  return (
    <div className="relative space-y-6">
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              <span>{t('integrations.successMsg')}</span>
            </div>
            <button onClick={() => setShowSuccess(false)}>
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight">{t('integrations.title')}</h1>
          <p className="text-xs text-muted-foreground">{t('integrations.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-xs">
          <Plus className="h-4 w-4" />
          {t('integrations.createNew')}
        </Button>
      </div>

      {visibleIntegrations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleIntegrations.map((integration) => (
            <Card key={integration.name} className="overflow-hidden border-muted-foreground/10 hover:border-muted-foreground/20 transition-all shadow-sm">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4 pb-2">
                <div className={cn("rounded-lg bg-muted p-2", integration.color)}>
                  <integration.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {integration.name}
                    {integration.connected && integration.avatar && (
                      <img src={integration.avatar} alt="" className="h-4 w-4 rounded-full" />
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">{integration.description}</CardDescription>
                  {integration.accountLabel && (
                    <p className="text-[10px] font-medium text-emerald-500 mt-1">{integration.accountLabel}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {integration.loading ? (
                  <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
                ) : integration.name === "YouTube" && ytError ? (
                  <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded-lg flex items-center gap-2">
                    <X className="h-4 w-4" />
                    <span>{ytError}</span>
                    <Button variant="ghost" size="sm" className="h-6 ml-auto" onClick={() => router.refresh()}>
                      Retry
                    </Button>
                  </div>
                ) : integration.connected ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm font-medium text-emerald-500">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      {t('integrations.connected')}
                    </div>
                    <Button variant="outline" size="sm" onClick={integration.onManage}>
                      {t('integrations.manage')}
                    </Button>
                  </div>
                ) : !integration.allowed ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <Lock className="h-3 w-3" />
                      <span>{t('integrations.notInPlan')}</span>
                    </div>
                    <Button variant="outline" className="w-full text-[10px] h-7 px-2" onClick={() => router.push('/upgrade')}>
                      {t('integrations.notInPlan')}
                    </Button>
                  </div>
                ) : (
                  <Button className="w-full h-8 text-xs" size="sm" onClick={integration.onConnect}>
                    {t('integrations.connect')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-muted/20 border-muted-foreground/10 space-y-6 text-center">
          <div className="p-6 rounded-full bg-muted/50 text-muted-foreground/40">
            <Globe className="h-16 w-16" />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className="text-2xl font-bold">{t('integrations.emptyTitle')}</h2>
            <p className="text-muted-foreground">{t('integrations.emptyDesc')}</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} size="lg" className="rounded-2xl px-8 shadow-xl shadow-primary/20">
            <Plus className="h-5 w-5 mr-2" />
            {t('integrations.createNew')}
          </Button>
        </div>
      )}

      {/* YouTube Management Modal */}
      <AnimatePresence>
        {showYtModal && ytAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden border-4 border-background shadow-xl">
                      {ytAccount.miniatura_canal ? (
                        <img src={ytAccount.miniatura_canal} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-red-500/10 flex items-center justify-center">
                          <Youtube className="h-6 w-6 text-red-500" />
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-lg p-1.5 shadow-lg border border-muted-foreground/10">
                      <Youtube className="h-4 w-4 text-red-500" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{t('integrations.ytSettings')}</h2>
                </div>
                <button onClick={() => setShowYtModal(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative group flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-muted-foreground/10">
                  {ytAccount.miniatura_canal ? (
                    <img 
                      src={ytAccount.miniatura_canal} 
                      alt="" 
                      className="h-16 w-16 rounded-full border-2 border-background"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Youtube className="h-8 w-8 text-red-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    {editingName ? (
                      <div className="space-y-2">
                        <input 
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full bg-background border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateName()
                            if (e.key === 'Escape') setEditingName(false)
                          }}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateName} disabled={updating}>
                            {updating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            {t('integrations.save')}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                            {t('integrations.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{ytAccount.nome_canal}</h3>
                          <p className="text-sm text-muted-foreground">{t('integrations.connected')}</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setNewName(ytAccount.nome_canal || "")
                            setEditingName(true)
                          }}
                        >
                          {t('integrations.editName')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('integrations.channelId')}</p>
                      <p className="text-sm font-mono break-all">{ytAccount.id_canal}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('integrations.connectedAt')}</p>
                      <p className="text-sm">
                        {ytAccount.criado_em ? new Date(ytAccount.criado_em).toLocaleDateString() : '---'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleYoutubeDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t('integrations.disconnectBtn')}
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => setShowYtModal(false)}
                  >
                    {t('integrations.close')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Create Integration Choice Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <h2 className="text-lg font-black tracking-tight">{t('integrations.choosePlatform')}</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 grid gap-4 grid-cols-2">
                {allIntegrations.map((platform) => (
                  <button
                    key={platform.name}
                    disabled={!platform.allowed || platform.connected}
                    onClick={() => {
                      platform.onConnect();
                      setShowCreateModal(false);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all text-center group",
                      platform.allowed && !platform.connected 
                        ? "hover:border-primary hover:bg-primary/5 border-muted bg-card shadow-sm hover:shadow-md" 
                        : "opacity-50 cursor-not-allowed bg-muted/20 border-transparent grayscale"
                    )}
                  >
                    <div className={cn("p-3 rounded-xl bg-muted/50 transition-colors group-hover:bg-primary/10", platform.color)}>
                      <platform.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{platform.name}</h3>
                      {!platform.allowed ? (
                        <p className="text-[10px] text-amber-500 font-bold uppercase mt-1 flex items-center justify-center gap-1">
                          <Lock className="h-2 w-2" /> {t('integrations.notInPlan')}
                        </p>
                      ) : platform.connected ? (
                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                          {t('integrations.connected')}
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground uppercase mt-1">
                          {t('integrations.connect')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {!isPlatformAllowed('facebook') && (
                <div className="px-6 pb-6 mt-2">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Plus className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-medium leading-tight">{t('integrations.upgradeToUnlock')}</p>
                    </div>
                    <Button size="sm" className="h-7 text-[10px] px-3" onClick={() => router.push('/upgrade')}>
                      Upgrade
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <IntegrationsContent />
    </Suspense>
  )
}
