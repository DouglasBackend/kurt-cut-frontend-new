"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function PricingCards() {
  const { t } = useLanguage()

  const plans = [
    {
      name: t('price.free.title'),
      price: t('price.free.price'),
      description: t('price.free.desc'),
      features: [
        t('price.free.f1'),
        t('price.free.f2'),
        t('price.free.f3'),
        t('price.free.f4'),
      ],
      buttonText: t('price.free.btn'),
      variant: "outline" as const,
      planId: 'start',
    },
    {
      name: t('price.pro.title'),
      price: t('price.pro.price'),
      period: t('price.mo'),
      description: t('price.pro.desc'),
      features: [
        t('price.pro.f1'),
        t('price.pro.f2'),
        t('price.pro.f3'),
        t('price.pro.f4'),
        t('price.pro.f5'),
        t('price.pro.f6'),
      ],
      buttonText: t('price.pro.btn'),
      variant: "default" as const,
      popular: true,
      planId: 'pro',
    },
    {
      name: t('price.ult.title'),
      price: t('price.ult.price'),
      description: t('price.ult.desc'),
      features: [
        t('price.ult.f1'),
        t('price.ult.f2'),
        t('price.ult.f3'),
        t('price.ult.f4'),
        t('price.ult.f5'),
        t('price.ult.f6'),
      ],
      buttonText: t('price.ult.btn'),
      variant: "outline" as const,
      planId: 'custom',
    },
  ]

  return (
    <div className="grid gap-8 md:grid-cols-3">
      {plans.map((plan) => (
        <Card
          key={plan.name}
          className={`relative flex flex-col ${
            plan.popular ? "border-primary shadow-lg scale-105" : ""
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
              {t('price.popular')}
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="mb-6 flex items-baseline text-4xl font-bold">
              {plan.price}
              {plan.period && (
                <span className="text-sm font-medium text-muted-foreground">
                  {plan.period}
                </span>
              )}
            </div>
            <ul className="space-y-3 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant={plan.variant}>
              {plan.buttonText}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

