"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  CreditCard, 
  QrCode, 
  FileText, 
  ChevronLeft, 
  Loader2, 
  CheckCircle2, 
  Copy,
  Zap,
  ShieldCheck,
  Calendar,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { billingApi } from "@/lib/api"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

const PLANS_INFO: Record<string, { name: string, price: string, credits: number }> = {
  'start': { name: 'Start', price: 'R$ 19,90', credits: 150 },
  'pro': { name: 'Pro', price: 'R$ 39,90', credits: 300 },
  'extra_25': { name: '25 Créditos Extras', price: 'R$ 5,00', credits: 25 },
  'extra_50': { name: '50 Créditos Extras', price: 'R$ 10,00', credits: 50 },
  'extra_75': { name: '75 Créditos Extras', price: 'R$ 15,00', credits: 75 },
}

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('planId') || ''
  const { refreshUser } = useAuth()

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState('card')

  const planInfo = PLANS_INFO[planId] || { name: 'Plano Custom', price: 'Sob consulta', credits: 0 }

  useEffect(() => {
    if (!planId) {
      router.push('/upgrade')
    }
  }, [planId, router])

  const handlePayment = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)

    try {
      // Simulate real delay
      await new Promise(r => setTimeout(r, 2000))
      
      await billingApi.confirmSimulatedPayment(planId, { method: selectedMethod })
      
      setSuccess(true)
      await refreshUser().catch(() => {})
      
      setTimeout(() => {
        router.push('/dashboard?checkout=success')
      }, 3000)
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pagamento")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado!`)
  }

  if (success) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-6">
              <CheckCircle2 className="h-20 w-20 text-emerald-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Pagamento Confirmado!</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Sua assinatura/créditos foram ativados com sucesso. Redirecionando você para o dashboard...
          </p>
          <div className="flex justify-center pt-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
      <Button 
        variant="ghost" 
        onClick={() => router.push('/upgrade')}
        className="group gap-2 hover:bg-transparent -ml-2"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para Planos
      </Button>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* Payment Methods */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Método de Pagamento
              </CardTitle>
              <CardDescription>
                Selecione como deseja pagar e preencha os dados (Ambiente de Simulação)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-14 bg-transparent border-b rounded-none p-0">
                  <TabsTrigger 
                    value="card" 
                    className="data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2"
                  >
                    <CreditCard className="h-4 w-4" /> 
                    <span className="hidden sm:inline">Cartão</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pix" 
                    className="data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2"
                  >
                    <QrCode className="h-4 w-4" /> 
                    <span>PIX</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="boleto" 
                    className="data-[state=active]:bg-muted/50 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none gap-2"
                  >
                    <FileText className="h-4 w-4" /> 
                    <span>Boleto</span>
                  </TabsTrigger>
                </TabsList>

                <div className="p-6 sm:p-8">
                  <TabsContent value="card" className="mt-0 space-y-6 outline-none">
                    <form onSubmit={handlePayment} className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Número do Cartão</Label>
                        <div className="relative">
                          <Input placeholder="0000 0000 0000 0000" className="pr-10" />
                          <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label>Validade</Label>
                        <div className="relative">
                          <Input placeholder="MM/AA" className="pr-10" />
                          <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label>CVV</Label>
                        <div className="relative">
                          <Input placeholder="123" type="password" className="pr-10" />
                          <Lock className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Nome no Cartão</Label>
                        <Input placeholder="Fulano de Tal" />
                      </div>
                      <Button className="col-span-2 h-12 mt-4 text-lg font-bold shadow-xl shadow-primary/20" disabled={loading}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2 fill-current" />}
                        {loading ? "Processando..." : `Pagar ${planInfo.price}`}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="pix" className="mt-0 space-y-8 outline-none text-center py-4">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative p-4 bg-white rounded-2xl border-4 border-muted shadow-inner">
                        <div className="h-48 w-48 bg-zinc-100 flex items-center justify-center relative">
                          <QrCode className="h-40 w-40 text-black opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white p-2 rounded-lg shadow-lg">
                              <Zap className="h-8 w-8 text-primary fill-current" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 w-full max-w-md">
                        <div className="p-4 rounded-xl bg-muted/50 border border-dashed flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Copia e Cola</p>
                            <p className="text-sm font-mono truncate max-w-[200px] sm:max-w-xs">
                              00020126440014br.gov.bcb.pix0122kurtcut-pix-simulation
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard('00020126440014br.gov.bcb.pix0122kurtcut-pix-simulation', 'Código PIX')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20" onClick={() => handlePayment()} disabled={loading}>
                          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                          {loading ? "Verificando..." : "Já realizei o pagamento"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="boleto" className="mt-0 space-y-8 outline-none text-center py-4">
                    <div className="flex flex-col items-center gap-8">
                      <div className="p-8 bg-muted/20 rounded-2xl border w-full max-w-sm flex flex-col items-center gap-4">
                        <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
                        <div className="space-y-1">
                          <p className="font-bold text-lg">Boleto Digital</p>
                          <p className="text-sm text-muted-foreground">O acesso será liberado assim que o pagamento for detectado.</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4 w-full max-w-md">
                        <div className="p-4 rounded-xl bg-muted/50 border border-dashed flex items-center justify-between">
                          <div className="text-left">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Linha Digitável</p>
                            <p className="text-sm font-mono truncate max-w-[200px] sm:max-w-xs">
                              03399.78204 15000.000004 00000.000000 1 95000000025000
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard('03399.78204 15000.000004 00000.000000 1 95000000025000', 'Boleto')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20" onClick={() => handlePayment()} disabled={loading}>
                          {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                          {loading ? "Validando Boleto..." : "Confirmar Pagamento do Boleto"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>

          <footer className="text-center text-xs text-muted-foreground flex items-center justify-center gap-4">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Conexão Segura</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Ambiente Protegido</span>
          </footer>
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-muted-foreground">{planInfo.name}</span>
                <span className="font-bold">{planInfo.price}</span>
              </div>
              
              <div className="space-y-2 py-2">
                <div className="flex justify-between text-xs">
                  <span>Subtotal</span>
                  <span>{planInfo.price}</span>
                </div>
                <div className="flex justify-between text-xs text-emerald-500 font-medium">
                  <span>Desconto Simulação</span>
                  <span>R$ 0,00</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-primary/20">
                <span className="font-bold text-lg">Total</span>
                <span className="text-2xl font-black text-primary">{planInfo.price}</span>
              </div>

              <div className="bg-primary/5 rounded-xl p-4 flex items-start gap-3 mt-4">
                <div className="bg-primary/10 rounded-full p-2 mt-1">
                  <Zap className="h-4 w-4 text-primary fill-current" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Saldo Adicional</p>
                  <p className="text-sm font-bold">+{planInfo.credits} Créditos</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Disponíveis instantaneamente após confirmação.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30 border-dashed">
            <CardContent className="p-6 text-center space-y-2">
              <Lock className="h-8 w-8 text-muted-foreground mx-auto opacity-30" />
              <p className="text-xs text-muted-foreground italic">
                Este é um ambiente de demonstração. Nenhuma cobrança real será efetuada em seu cartão.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
