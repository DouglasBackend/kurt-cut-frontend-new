"use client"

import { Scissors, Zap, Sparkles, Share2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Features() {
  const { t } = useLanguage()

  const features = [
    {
      name: t('feat.1.title'),
      description: t('feat.1.desc'),
      icon: Sparkles,
    },
    {
      name: t('feat.2.title'),
      description: t('feat.2.desc'),
      icon: Zap,
    },
    {
      name: t('feat.4.title'),
      description: t('feat.4.desc'),
      icon: Share2,
    },
  ]

  return (
    <section className="bg-muted/50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary">
            {t('feat.badge')}
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {t('feat.title')}
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t('feat.subtitle')}
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7">
                  <feature.icon
                    className="h-5 w-5 flex-none text-primary"
                    aria-hidden="true"
                  />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

