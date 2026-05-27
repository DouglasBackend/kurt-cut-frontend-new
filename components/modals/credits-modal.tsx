"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap, Star, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { billingApi } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

interface CreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState<string | null>(null)

  const handlePurchase = async (planId: string) => {
    setLoading(planId)
    try {
      const { url } = await billingApi.checkout(planId)
      window.location.href = url
    } catch (err: any) {
      toast.error(err.message || "Erro ao iniciar compra")
    } finally {
      setLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Zap className="h-6 w-6 fill-current" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Seus créditos acabaram!</h2>
                <p className="text-sm text-muted-foreground">Escolha um plano ou compre créditos avulsos abaixo.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* Plans Grid */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              {/* Start Plan */}
              <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => handlePurchase('start')}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <CardTitle className="text-lg">Start</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">R$ 19,90</p>
                  <p className="text-xs text-muted-foreground mb-4">150 créditos mensais</p>
                  <Button variant="outline" size="sm" className="w-full" disabled={loading !== null}>
                    {loading === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Escolher Start"}
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="border-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => handlePurchase('pro')}>
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <CardTitle className="text-lg">Pro</CardTitle>
                    </div>
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">POPULAR</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-2xl font-bold">R$ 39,90</p>
                  <p className="text-xs text-muted-foreground mb-4">300 créditos mensais</p>
                  <Button size="sm" className="w-full" disabled={loading !== null}>
                    {loading === 'pro' ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fazer Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Extra Credits */}
            <div className="rounded-xl bg-muted/50 p-6 border border-dashed">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> COMPRAR CRÉDITOS AVULSOS
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'extra_25', amount: 25, price: 'R$ 5' },
                  { id: 'extra_50', amount: 50, price: 'R$ 10' },
                  { id: 'extra_75', amount: 75, price: 'R$ 15' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handlePurchase(item.id)}
                    disabled={loading !== null}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border bg-background hover:border-primary hover:text-primary transition-all group"
                  >
                    <span className="text-xs text-muted-foreground group-hover:text-primary">+{item.amount}</span>
                    <span className="text-lg font-bold">{item.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button variant="link" className="text-muted-foreground text-xs" onClick={() => window.location.href='/upgrade'}>
                Ver detalhes completos dos planos <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
