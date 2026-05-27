"use client"

import { useLanguage } from "@/contexts/language-context"

export function HowItWorks() {
  const { t } = useLanguage()

  const steps = [
    {
      id: "01",
      name: t('how.step1.title'),
      description: t('how.step1.desc'),
    },
    {
      id: "02",
      name: t('how.step2.title'),
      description: t('how.step2.desc'),
    },
    {
      id: "03",
      name: t('how.step3.title'),
      description: t('how.step3.desc'),
    },
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('how.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t('how.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.id} className="relative pl-16">
              <dt className="text-base font-semibold leading-7">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  {step.id}
                </div>
                {step.name}
              </dt>
              <dd className="mt-2 text-base leading-7 text-muted-foreground">
                {step.description}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

