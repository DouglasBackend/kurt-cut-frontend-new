"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { authApi, billingApi } from "@/lib/api"
import { Loader2, CreditCard, ShieldCheck, AlertCircle, Zap } from "lucide-react"

export default function SettingsPage() {
  const { t } = useLanguage()
  const { user, refreshUser } = useAuth()

  const [name, setName] = useState(user?.nome || "")
  const [email, setEmail] = useState(user?.email || "")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState("")

  const [cancelLoading, setCancelLoading] = useState(false)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  useEffect(() => {
    if (user) { setName(user.nome); setEmail(user.email) }
  }, [user])

  const handleProfileSave = async () => {
    setProfileMsg("")
    setProfileLoading(true)
    try {
      await authApi.updateProfile({ nome: name, email })
      await refreshUser()
      setProfileMsg("Perfil atualizado com sucesso.")
    } catch (err: any) {
      setProfileMsg(err.message || "Falha ao atualizar perfil.")
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    setPasswordMsg("")
    if (newPassword !== confirmPassword) { setPasswordMsg("As senhas não coincidem."); return }
    setPasswordLoading(true)
    try {
      await authApi.updatePassword(currentPassword, newPassword)
      setPasswordMsg("Senha atualizada com sucesso.")
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      setPasswordMsg(err.message || "Falha ao atualizar senha.")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      await billingApi.cancelSubscription()
      await refreshUser()
      setIsConfirmingCancel(false)
    } catch (err: any) {
      alert(err.message || "Falha ao cancelar assinatura.")
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>
      
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
          <TabsTrigger value="account">{t('settings.tab.account')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.tab.security')}</TabsTrigger>
          <TabsTrigger value="billing">{t('settings.tab.billing')}</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.profile.title')}</CardTitle>
              <CardDescription>{t('settings.profile.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileMsg && (
                <div className={`rounded-md px-3 py-2 text-sm ${profileMsg.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                  {profileMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.profile.name')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.profile.email')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileSave} disabled={profileLoading}>
                {profileLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : t('settings.profile.save')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.security.title')}</CardTitle>
              <CardDescription>{t('settings.security.desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMsg && (
                <div className={`rounded-md px-3 py-2 text-sm ${passwordMsg.includes('sucesso') ? 'bg-emerald-500/10 text-emerald-600' : 'bg-destructive/10 text-destructive'}`}>
                  {passwordMsg}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="current_password">{t('settings.security.current')}</Label>
                <Input id="current_password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">{t('settings.security.new')}</Label>
                <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">{t('settings.security.confirm')}</Label>
                <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handlePasswordUpdate} disabled={passwordLoading}>
                {passwordLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Atualizando...</> : t('settings.security.update')}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('settings.billing.title')}</CardTitle>
                    <CardDescription>
                      Gerencie seu plano e informações de faturamento.
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user?.plano && user.plano !== 'free' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                    {user?.plano || 'FREE'}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg">Seu Plano</h3>
                    </div>
                    <p className="text-3xl font-bold">{user?.plano?.toUpperCase() || 'GRÁTIS'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user?.plano === 'free' ? '30 min de créditos iniciais' : 'Renovação mensal automática'}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <h3 className="font-semibold text-lg">Créditos</h3>
                    </div>
                    <p className="text-3xl font-bold">{user?.creditos_disponiveis?.toFixed(0) || 0} min</p>
                    <p className="text-sm text-muted-foreground mt-1">Saldo disponível para uso</p>
                  </div>
                </div>

                {user?.plano && user.plano !== 'free' && (
                  <div className="rounded-xl border p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <CreditCard className="h-4 w-4" />
                      MÉTODO DE PAGAMENTO
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-muted px-2 py-1 rounded font-mono text-xs">VISA</div>
                        <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Exp: 12/26</p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                {user?.plano === 'free' ? (
                  <Button className="w-full sm:w-auto" onClick={() => window.location.href='/upgrade'}>
                    Ver Planos e Preços
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 w-full justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => window.location.href='/upgrade'} disabled>
                        Mudar Plano
                      </Button>
                      <p className="text-[10px] text-muted-foreground max-w-[150px] leading-tight flex items-center">
                        * Cancele o plano atual para migrar para outro.
                      </p>
                    </div>
                    
                    {!isConfirmingCancel ? (
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setIsConfirmingCancel(true)}>
                        Cancelar Assinatura
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-destructive/5 p-2 rounded-lg border border-destructive/20 animate-in fade-in zoom-in duration-300">
                         <span className="text-xs font-bold text-destructive flex items-center gap-1">
                           <AlertCircle className="h-3 w-3" /> Confirmar cancelamento?
                         </span>
                         <Button variant="destructive" size="sm" onClick={handleCancelSubscription} disabled={cancelLoading}>
                           {cancelLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim, Cancelar"}
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => setIsConfirmingCancel(false)}>Não</Button>
                      </div>
                    )}
                  </div>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
