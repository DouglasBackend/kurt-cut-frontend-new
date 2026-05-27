"use client"

import * as React from "react"
import { Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 gap-2 px-3">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'PT-BR'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage("en")}>
          English (EN)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("pt")}>
          Português (PT-BR)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
