"use client"

import { Bell, Search, User, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notification-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Topbar() {
  const { t } = useLanguage()
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder={t('topbar.search')} className="w-full bg-muted/50 pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium">
          <span className="text-muted-foreground">{t('topbar.credits')}</span>
          <span>{user?.creditos_disponiveis}</span>
        </div>
        <Button variant="outline" size="sm" asChild className="hidden sm:flex">
          <Link href={user?.plano && user?.plano !== 'free' ? "/settings?tab=billing" : "/upgrade"}>
            {user?.plano && user?.plano !== 'free' 
              ? (user.plano.charAt(0).toUpperCase() + user.plano.slice(1)) 
              : t('sidebar.upgrade')}
          </Link>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-black text-white flex items-center justify-center border-2 border-background animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-muted border">
              {user ? (
                <span className="text-xs font-bold">{user.nome?.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.nome}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                {user?.plano && (
                  <p className="text-[10px] font-bold uppercase text-primary mt-1">
                    Plano {user.plano}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>{t('sidebar.settings')}</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={logout}
              className="flex items-center gap-2 text-red-500 focus:text-red-500 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('sidebar.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
