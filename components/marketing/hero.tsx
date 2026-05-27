"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { ArrowRight, PlayCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

export function Hero() {
  const { t } = useLanguage()

  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              {t('hero.title1')}
              <span className="text-primary">{t('hero.title2')}</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground mb-10">
              {t('hero.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-x-6">
              <Button size="lg" asChild>
                <Link href="/register">
                  {t('hero.startFree')} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#how-it-works">
                  <PlayCircle className="mr-2 h-4 w-4" /> {t('hero.watchDemo')}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 flow-root sm:mt-24"
        >
          <div className="relative rounded-xl bg-muted/50 p-2 ring-1 ring-inset ring-muted lg:-m-4 lg:rounded-2xl lg:p-4">
            <div className="rounded-md bg-background shadow-2xl ring-1 ring-muted overflow-hidden">
              <div className="aspect-[16/9] w-full bg-black/5 flex items-center justify-center relative">
                {/* Mockup UI */}
                <div className="absolute inset-0 flex">
                  <div className="w-64 border-r bg-card p-4 hidden md:block">
                    <div className="h-4 w-24 bg-muted rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-8 w-full bg-muted rounded"></div>
                      <div className="h-8 w-full bg-muted rounded"></div>
                      <div className="h-8 w-full bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="h-12 border-b bg-background flex items-center px-4">
                      <div className="h-4 w-32 bg-muted rounded"></div>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center">
                      <div className="aspect-[9/16] h-full max-h-[400px] bg-black rounded-lg relative shadow-xl">
                        <div className="absolute inset-0 flex items-center justify-center text-white/20">
                          <span className="text-xl font-bold">{t('hero.preview')}</span>
                        </div>
                        <div className="absolute bottom-12 left-0 right-0 text-center">
                          <span className="bg-yellow-400 text-black font-bold px-2 py-1 rounded text-sm">
                            {t('hero.autoCaptions')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
