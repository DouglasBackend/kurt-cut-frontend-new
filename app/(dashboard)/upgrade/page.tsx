"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, ArrowRight, Star, Crown } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { billingApi } from "@/lib/api"

export default function UpgradePage() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)
  const isSubscriber = !!(user?.plano && user?.plano !== 'free')

  const handleUpgrade = async (planId: string) => {
    if (planId === 'custom') {
      window.location.href = "mailto:contato@kurtcut.com.br"
      return
    }

    if (!planId.startsWith('extra_') && isSubscriber) {
      toast.error("Você já possui um plano ativo. Cancele-o nas configurações para mudar de plano.")
      return
    }

    setLoading(planId)
    try {
      const { url } = await billingApi.checkout(planId)
      if (url) {
        window.location.href = url
      } else {
        toast.error("Erro ao iniciar checkout")
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na conexão com o servidor")
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "Grátis",
      credits: "30",
      description: "Para quem está começando",
      features: [
        "30 Créditos p/ mês",
        "Clipes até 5 min",
        "Qualidade 720p",
        "Upload até 50MB",
        "Marca d'água",
      ],
      buttonText: "Plano Atual",
      icon: <Crown className="h-5 w-5 text-zinc-500" />
    },
    {
      id: "start",
      name: "Start",
      price: "R$ 19,90",
      credits: "150",
      description: "Para criadores frequentes",
      features: [
        "150 Créditos p/ mês",
        "Clipes até 15 min",
        "Qualidade 1080p",
        "Upload até 200MB",
        "Youtube e TikTok",
        "Sem marca d'água",
      ],
      buttonText: "Assinar Start",
      icon: <Crown className="h-5 w-5 text-blue-500" />
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 39,90",
      credits: "300",
      description: "Performance extrema",
      features: [
        "300 Créditos p/ mês",
        "Clipes até 2 horas",
        "Qualidade 4K",
        "Upload até 1GB+",
        "Todas as Redes Socais",
        "Prioridade Alta",
      ],
      buttonText: "Assinar Pro",
      popular: true,
      icon: <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500/20" />
    }
  ]

  const extraCredits = [
    { id: "extra_25", amount: 25, price: "R$ 5,00" },
    { id: "extra_50", amount: 50, price: "R$ 10,00" },
    { id: "extra_75", amount: 75, price: "R$ 15,00" },
  ]

  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dê um upgrade no seu Kurt Cut</h1>
        <p className="text-muted-foreground">Escolha o melhor plano para criar seus cortes virais.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3 mb-16">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative overflow-hidden ${plan.popular ? 'border-primary shadow-xl ring-1 ring-primary' : ''}`}>
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase py-1 px-3 rounded-bl-lg">
                Mais Popular
              </div>
            )}
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                {plan.icon}
                <CardTitle>{plan.name}</CardTitle>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-muted-foreground">por mês</span>
              </div>
              <ul className="space-y-2 text-sm">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                variant={plan.popular ? "default" : "outline"}
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading !== null || (isSubscriber && !plan.id.startsWith('custom'))}
              >
                {loading === plan.id ? "Processando..." : (isSubscriber && user.plano === plan.id ? "Plano Ativo" : plan.buttonText)}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="max-w-4xl mx-auto bg-muted/30 rounded-2xl p-8 border border-dashed border-muted-foreground/20">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          Precisa de créditos rápidos?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {extraCredits.map((extra) => (
            <div key={extra.id} className="bg-background rounded-xl p-6 border flex flex-col items-center justify-between text-center gap-4 hover:border-primary transition-colors">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">+{extra.amount} Créditos</p>
                <p className="text-2xl font-bold">{extra.price}</p>
              </div>
              <Button size="sm" className="w-full" variant="secondary" onClick={() => handleUpgrade(extra.id)} disabled={loading !== null}>
                {loading === extra.id ? "..." : "Comprar"}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
