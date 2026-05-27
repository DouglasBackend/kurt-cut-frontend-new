"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { PricingCards } from "@/components/marketing/pricing"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useLanguage } from "@/contexts/language-context"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <a className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            </div>
            <span className="text-xl font-bold tracking-tight">Kurt Cut</span>
          </a>
          <nav className="hidden md:flex gap-6">
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t('nav.howItWorks')}
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t('nav.features')}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t('nav.pricing')}
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login" className="text-sm font-medium hover:underline">
              {t('nav.signIn')}
            </Link>
            <Button asChild>
              <Link href="/register">{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <div id="features">
          <Features />
        </div>
        <section id="pricing" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('price.title')}
              </h2>
              <p className="mt-6 text-lg leading-8 text-muted-foreground">
                {t('price.subtitle')}
              </p>
            </div>
            <PricingCards />
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
              C
            </div>
            <span className="font-semibold">Kurt Cut</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('footer.rights')}
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footer.terms')}</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">{t('footer.privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
