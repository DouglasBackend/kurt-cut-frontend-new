"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useAuth } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { TaskTray } from "@/components/layout/TaskTray"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
    
    // Refresh user data if coming back from positive checkout
    const url = new URL(window.location.href);
    if (url.searchParams.get('checkout') === 'success') {
      refreshUser()
      // Remove the parameter to avoid re-triggering
      window.history.replaceState({}, '', pathname);
    }
  }, [user, loading, router, refreshUser])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  const isEditor = pathname?.startsWith('/editor');
  
  if (isEditor) {
    return (
      <NotificationProvider>
        <div className="h-screen w-screen overflow-hidden bg-background">
          <main className="h-full w-full overflow-hidden">
            {children}
          </main>
        </div>
        <TaskTray />
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
      <TaskTray />
    </NotificationProvider>
  )
}
