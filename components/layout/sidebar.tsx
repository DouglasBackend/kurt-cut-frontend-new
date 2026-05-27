"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Plus, Film, Plug, Settings, Crown } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { user } = useAuth()

  const sidebarLinks = [
    { name: "Dashboard",      href: "/dashboard",    icon: LayoutDashboard },
    { name: "Criar Clipes",   href: "/upload",       icon: Plus },
    { name: "Meus Projetos",  href: "/clips",        icon: Film },
    { name: "Integrações",    href: "/integrations", icon: Plug },
  ]

  const footerLinks = [
    { name: "Upgrade",        href: "/upgrade",      icon: Crown, color: "text-amber-400" },
    { name: "Configurações",  href: "/settings",     icon: Settings },
  ]

  return (
    <div className="flex h-full w-60 flex-col border-r bg-card px-3 py-4">
      <div className="mb-8 px-3">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Crown className="h-5 w-5 fill-amber-400" />
          </div>
          <span className="text-xl font-bold tracking-tight">Kurt Cut</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
          const nameMap: Record<string, string> = {
            "Dashboard": t('sidebar.dashboard'),
            "Criar Clipes": t('sidebar.upload'),
            "Meus Projetos": t('sidebar.clips'),
            "Integrações": t('sidebar.integrations'),
          }
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {nameMap[link.name] || link.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="px-2 pb-6 space-y-0.5">
          {footerLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/")
            const nameMap: Record<string, string> = {
              "Upgrade": t('sidebar.upgrade'),
              "Configurações": t('sidebar.settings'),
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <link.icon className={cn("h-4 w-4 shrink-0", link.color)} />
                {nameMap[link.name] || link.name}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
