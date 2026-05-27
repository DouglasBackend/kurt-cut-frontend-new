import { useState, useEffect, useRef, memo } from "react";
import { motion } from "motion/react";
import { Check, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

/** 
 * Configuração de estilo de um Preset.
 * Define como o backend deve renderizar a legenda no vídeo final.
 */
export type PresetCfg = {
  font_family: string;
  font_color: string;
  highlight_color: string;
  outline_color: string;
  outline_width: number;
  shadow_depth: number;
  background_color: string;
  animation: string;
  posY: number;
}

/** Lista de fontes disponíveis no sistema */
export const FONTS = [
  "Montserrat", "Bangers", "Bungee", "Righteous", "Russo One", "Orbitron",
  "Staatliches", "Monoton", "Press Start 2P", "Black Ops One", "Ultra",
  "Bebas Neue", "Pacifico", "Alfa Slab One", "Lobster", "Fredoka One",
  "Anton", "Arial Black", "Impact", "Oswald",
];

/** 
 * Mapa de Estilos dos Presets.
 * Estes valores são enviados ao backend para a renderização do clipe.
 */
export const PRESET_STYLE_MAP: Record<string, PresetCfg> = {
  // ── Modelos Virais (Inspirados em grandes criadores) ───────────────────────

  highlight: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#f7c204", outline_color: "transparent", outline_width: 0, shadow_depth: 2, background_color: "transparent", animation: "highlight", posY: 82 },
  karaoke: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#00FF00", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "karaoke", posY: 82 },
  tiktok: { font_family: "Montserrat", font_color: "#FFFF00", highlight_color: "#FFFF00", outline_color: "#000000", outline_width: 4, shadow_depth: 0, background_color: "transparent", animation: "none", posY: 82 },
  impact: { font_family: "Montserrat", font_color: "#FF3B3B", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 3, shadow_depth: 2, background_color: "transparent", animation: "impact", posY: 82 },
  gradientorig: { font_family: "Orbitron", font_color: "#00FFFF", highlight_color: "#FFFFFF", outline_color: "#FF00FF", outline_width: 1.5, shadow_depth: 1, background_color: "transparent", animation: "gradient", posY: 82 },
  cinematic: { font_family: "Staatliches", font_color: "#FFFFFF", highlight_color: "#FFFF00", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "rgba(0,0,0,0.7)", animation: "none", posY: 82 },
  // ── Redes Sociais ─────────────────────────────────────────────────────────
  instagram: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#f58529", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "instagram", posY: 82 },
  capcut: { font_family: "Montserrat", font_color: "#000000", highlight_color: "#FFE500", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "#FFE500", animation: "capcut", posY: 82 },
  // ── Efeitos Clássicos ──────────────────────────────────────────────────────
  neon: { font_family: "Monoton", font_color: "#FFFFFF", highlight_color: "#FF00FF", outline_color: "#00FFFF", outline_width: 1, shadow_depth: 3, background_color: "transparent", animation: "neon", posY: 82 },
  matrix: { font_family: "Press Start 2P", font_color: "#00FF00", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "rgba(0,255,0,0.12)", animation: "matrix", posY: 82 },
  pop3d: { font_family: "Black Ops One", font_color: "#FFAA00", highlight_color: "#FFFFFF", outline_color: "#FF5500", outline_width: 1, shadow_depth: 5, background_color: "transparent", animation: "pop3d", posY: 82 },
  liquid: { font_family: "Ultra", font_color: "#CCCCCC", highlight_color: "#FFFFFF", outline_color: "#B4B4FF", outline_width: 1.5, shadow_depth: 1, background_color: "transparent", animation: "liquid", posY: 82 },
  explosive: { font_family: "Bangers", font_color: "#FF4400", highlight_color: "#FFCC00", outline_color: "#FFCC00", outline_width: 2, shadow_depth: 3, background_color: "transparent", animation: "explosive", posY: 82 },
  neonglow: { font_family: "Monoton", font_color: "#00FF88", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "neonglow", posY: 82 },
  glitch: { font_family: "Bangers", font_color: "#FFFFFF", highlight_color: "#FF00FF", outline_color: "#FF00FF", outline_width: 2, shadow_depth: 0, background_color: "transparent", animation: "glitch", posY: 82 },
  fire: { font_family: "Anton", font_color: "#FFAA00", highlight_color: "#FFFFFF", outline_color: "#FF6600", outline_width: 2, shadow_depth: 2, background_color: "transparent", animation: "fire", posY: 82 },
  water: { font_family: "Pacifico", font_color: "#00FFFF", highlight_color: "#FFFFFF", outline_color: "#00AAFF", outline_width: 1.5, shadow_depth: 0, background_color: "transparent", animation: "water", posY: 82 },
  rainbow: { font_family: "Bungee", font_color: "#FF6060", highlight_color: "#FFFFFF", outline_color: "#60FF60", outline_width: 1.5, shadow_depth: 0, background_color: "transparent", animation: "rainbow", posY: 82 },
  shadow: { font_family: "Alfa Slab One", font_color: "#FFAA00", highlight_color: "#FFFFFF", outline_color: "#6464FF", outline_width: 1, shadow_depth: 5, background_color: "transparent", animation: "shadow", posY: 82 },
  pixel: { font_family: "Press Start 2P", font_color: "#FFFF00", highlight_color: "#FFFFFF", outline_color: "#FFFF00", outline_width: 1.5, shadow_depth: 0, background_color: "transparent", animation: "pixel", posY: 82 },
  retro: { font_family: "Lobster", font_color: "#FF88CC", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "retro", posY: 82 },
  gradientcup: { font_family: "Fredoka One", font_color: "#FF00AA", highlight_color: "#FFFFFF", outline_color: "#00AAFF", outline_width: 1.5, shadow_depth: 0, background_color: "transparent", animation: "gradientcup", posY: 82 },
  outline: { font_family: "Anton", font_color: "#FFFFFF", highlight_color: "#FFFC00", outline_color: "#FFFC00", outline_width: 3, shadow_depth: 0, background_color: "transparent", animation: "outline", posY: 82 },
  chrome: { font_family: "Black Ops One", font_color: "#CCCCCC", highlight_color: "#FFFFFF", outline_color: "#FFFFFF", outline_width: 1, shadow_depth: 2, background_color: "transparent", animation: "chrome", posY: 82 },
  glass: { font_family: "Righteous", font_color: "rgba(255,255,255,0.55)", highlight_color: "#FFFFFF", outline_color: "rgba(255,255,255,0.8)", outline_width: 1.2, shadow_depth: 0, background_color: "rgba(255,255,255,0.08)", animation: "glass", posY: 82 },
  // ── Coleção 2025 ──────────────────────────────────────────────────────────
  bouncycolor: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFE500", outline_color: "rgba(0,0,0,0.8)", outline_width: 2, shadow_depth: 3, background_color: "transparent", animation: "bouncycolor", posY: 82 },
  wordbyword: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFE500", outline_color: "#000000", outline_width: 2, shadow_depth: 2, background_color: "transparent", animation: "wordbyword", posY: 82 },
  highlightbox: { font_family: "Montserrat", font_color: "#000000", highlight_color: "#FF6B6B", outline_color: "#000000", outline_width: 1, shadow_depth: 0, background_color: "#FF6B6B", animation: "highlightbox", posY: 82 },
  splitflap: { font_family: "Courier New", font_color: "#FFE500", highlight_color: "#FFE500", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "#111111", animation: "splitflap", posY: 82 },
  scramble: { font_family: "Courier New", font_color: "#FFFFFF", highlight_color: "#00FFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "scramble", posY: 82 },
  firetext: { font_family: "Impact", font_color: "#FFAA00", highlight_color: "#FFFFFF", outline_color: "#FF4500", outline_width: 1, shadow_depth: 0, background_color: "transparent", animation: "firetext", posY: 82 },
  rainbowwave: { font_family: "Montserrat", font_color: "#FF6060", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "rainbowwave", posY: 82 },
  threed: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#888888", outline_width: 0, shadow_depth: 8, background_color: "transparent", animation: "threed", posY: 82 },
  bubble: { font_family: "Montserrat", font_color: "#111111", highlight_color: "#111111", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "#FFFFFF", animation: "bubble", posY: 75 },
  countdown: { font_family: "Impact", font_color: "#FFFFFF", highlight_color: "#FF6B6B", outline_color: "#FF6B6B", outline_width: 1, shadow_depth: 0, background_color: "transparent", animation: "countdown", posY: 82 },
  slideinleft: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 2, shadow_depth: 2, background_color: "transparent", animation: "slideinleft", posY: 82 },
  stamp: { font_family: "Impact", font_color: "#FF3B3B", highlight_color: "#FF3B3B", outline_color: "#FF3B3B", outline_width: 0, shadow_depth: 0, background_color: "rgba(255,59,59,0.1)", animation: "stamp", posY: 82 },
  holographic: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FF88FF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "holographic", posY: 82 },
  gradshift: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#C084FC", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "gradshift", posY: 82 },
  shadowdepth: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#6464FF", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "shadowdepth", posY: 82 },
  zoombeat: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 2, shadow_depth: 0, background_color: "transparent", animation: "zoombeat", posY: 82 },
  outlineflash: { font_family: "Impact", font_color: "transparent", highlight_color: "#FFE500", outline_color: "#FFE500", outline_width: 3, shadow_depth: 0, background_color: "transparent", animation: "outlineflash", posY: 82 },
  sticker: { font_family: "Montserrat", font_color: "#000000", highlight_color: "#000000", outline_color: "#000000", outline_width: 0, shadow_depth: 0, background_color: "#FFE500", animation: "sticker", posY: 82 },
  morph: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#4ECDC4", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "morph", posY: 82 },
  stackreveal: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 1, shadow_depth: 2, background_color: "transparent", animation: "stackreveal", posY: 78 },
  liquidflow: { font_family: "Montserrat", font_color: "#4ECDC4", highlight_color: "#44CF6C", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "liquidflow", posY: 82 },
  pixelreveal: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 1, shadow_depth: 0, background_color: "transparent", animation: "pixelreveal", posY: 82 },
  cassette: { font_family: "Courier New", font_color: "#2D2D2D", highlight_color: "#E63946", outline_color: "#2D2D2D", outline_width: 0, shadow_depth: 0, background_color: "#F5F0E8", animation: "cassette", posY: 82 },
  bouncywords: { font_family: "Montserrat", font_color: "#FF6B6B", highlight_color: "#FFE66D", outline_color: "rgba(0,0,0,0.3)", outline_width: 2, shadow_depth: 3, background_color: "transparent", animation: "bouncywords", posY: 82 },
  terminal: { font_family: "Courier New", font_color: "#FFFFFF", highlight_color: "#27C93F", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "rgba(30,30,30,0.95)", animation: "terminal", posY: 82 },
  slicereveal: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "slicereveal", posY: 82 },
  chalkboard: { font_family: "Patrick Hand", font_color: "#F0ECD8", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "rgba(45,90,61,0.9)", animation: "chalkboard", posY: 82 },
  punchtext: { font_family: "Impact", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "#000000", outline_width: 3, shadow_depth: 4, background_color: "transparent", animation: "punchtext", posY: 82 },
  newsticker: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "#E63946", animation: "newsticker", posY: 90 },
  particles: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFE500", outline_color: "#000000", outline_width: 1, shadow_depth: 0, background_color: "transparent", animation: "particles", posY: 82 },
  noise: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFFFFF", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "noise", posY: 82 },
  strokepop: { font_family: "Bangers", font_color: "#111111", highlight_color: "#FFFFFF", outline_color: "#FFFFFF", outline_width: 4, shadow_depth: 0, background_color: "transparent", animation: "strokepop", posY: 82 },
  clean: { font_family: "Montserrat", font_color: "#FFFFFF", highlight_color: "#FFE500", outline_color: "transparent", outline_width: 0, shadow_depth: 0, background_color: "transparent", animation: "clean", posY: 82 },
};

/** Lista de metadados dos presets para exibição na UI de seleção */
export const SUBTITLE_PRESETS = [
  // Categoria: Virais
  { id: "highlight", label: "Hormozi", desc: "Amarelo #f7c204", category: "Virais", requiredPlan: "free" },
  { id: "tiktok", label: "TikTok Nativo", desc: "Outline preto 4px", category: "Virais", requiredPlan: "free" },
  { id: "karaoke", label: "Karaokê Real", desc: "Preenchimento gradual", category: "Virais", requiredPlan: "free" },
  { id: "instagram", label: "Instagram Reels", desc: "Gradiente IG oficial", category: "Virais", requiredPlan: "free" },
  { id: "capcut", label: "CapCut AI", desc: "Caixa colorida (pill)", category: "Virais", requiredPlan: "free" },
  { id: "impact", label: "Impact", desc: "Vermelho bold", category: "Virais", requiredPlan: "start" },
  { id: "clean", label: "Clean (Liso)", desc: "Sem contorno ou sombra", category: "Virais", requiredPlan: "start" },
  { id: "gradientorig", label: "Gradient", desc: "Cores rotativas", category: "Virais", requiredPlan: "start" },
  { id: "cinematic", label: "Cinematic", desc: "Barra cinematográfica", category: "Virais", requiredPlan: "start" },
  // Categoria: Clássicos
  { id: "neon", label: "Neon Glitch", desc: "RGB deslocado", category: "Clássicos", requiredPlan: "start" },
  { id: "matrix", label: "Matrix", desc: "Código digital", category: "Clássicos", requiredPlan: "start" },
  { id: "pop3d", label: "3D Pop", desc: "Profundidade laranja", category: "Clássicos", requiredPlan: "start" },
  { id: "liquid", label: "Liquid Metal", desc: "Metal fluido", category: "Clássicos", requiredPlan: "start" },
  { id: "explosive", label: "Explosive", desc: "Partículas", category: "Clássicos", requiredPlan: "start" },
  { id: "neonglow", label: "Neon Glow", desc: "Brilho colorido", category: "Clássicos", requiredPlan: "start" },
  { id: "glitch", label: "Glitch", desc: "Distorção RGB", category: "Clássicos", requiredPlan: "start" },
  { id: "fire", label: "Fire", desc: "Chamas animadas", category: "Clássicos", requiredPlan: "start" },
  { id: "water", label: "Water", desc: "Onda líquida", category: "Clássicos", requiredPlan: "start" },
  { id: "rainbow", label: "Rainbow", desc: "Arco-íris vibrante", category: "Clássicos", requiredPlan: "start" },
  { id: "shadow", label: "3D Shadow", desc: "Sombra profunda", category: "Clássicos", requiredPlan: "start" },
  { id: "pixel", label: "Pixel", desc: "Estilo 8-bit", category: "Clássicos", requiredPlan: "start" },
  { id: "retro", label: "Retro", desc: "Rosa vintage", category: "Clássicos", requiredPlan: "start" },
  { id: "gradientcup", label: "Gradient Cup", desc: "Gradiente animado", category: "Clássicos", requiredPlan: "start" },
  { id: "outline", label: "Outline", desc: "Contorno colorido", category: "Clássicos", requiredPlan: "start" },
  { id: "chrome", label: "Chrome", desc: "Metal espelhado", category: "Clássicos", requiredPlan: "start" },
  { id: "glass", label: "Glass", desc: "Transparência suave", category: "Clássicos", requiredPlan: "start" },
  // Categoria: Novos 2025
  { id: "bouncycolor", label: "Bouncy Color", desc: "Salto com cor ativa", category: "Novos 2025", requiredPlan: "pro" },
  { id: "wordbyword", label: "Word By Word", desc: "Surgimento por palavra", category: "Novos 2025", requiredPlan: "pro" },
  { id: "highlightbox", label: "Highlight Box", desc: "Caixas coloridas", category: "Novos 2025", requiredPlan: "pro" },
  { id: "splitflap", label: "Split Flap", desc: "Placar retrô", category: "Novos 2025", requiredPlan: "pro" },
  { id: "scramble", label: "Scramble", desc: "Texto embaralhado", category: "Novos 2025", requiredPlan: "pro" },
  { id: "firetext", label: "Fire Text", desc: "Letras em chamas", category: "Novos 2025", requiredPlan: "pro" },
  { id: "rainbowwave", label: "Rainbow Wave", desc: "Onda arco-íris", category: "Novos 2025", requiredPlan: "pro" },
  { id: "threed", label: "3D Rotation", desc: "Rotação 3D", category: "Novos 2025", requiredPlan: "pro" },
  { id: "bubble", label: "Bubble", desc: "Balão de quadrinhos", category: "Novos 2025", requiredPlan: "pro" },
  { id: "countdown", label: "Countdown", desc: "Pop explosivo", category: "Novos 2025", requiredPlan: "pro" },
  { id: "slideinleft", label: "Slide In", desc: "Entrada lateral", category: "Novos 2025", requiredPlan: "pro" },
  { id: "stamp", label: "Stamp", desc: "Efeito carimbo", category: "Novos 2025", requiredPlan: "pro" },
  { id: "holographic", label: "Holographic", desc: "Brilho holográfico", category: "Novos 2025", requiredPlan: "pro" },
  { id: "gradshift", label: "Purple Shimmer", desc: "Cintilância roxa", category: "Novos 2025", requiredPlan: "pro" },
  { id: "shadowdepth", label: "Shadow Depth", desc: "Sombra com profundidade", category: "Novos 2025", requiredPlan: "pro" },
  { id: "zoombeat", label: "Zoom Beat", desc: "Pulso na entrada", category: "Novos 2025", requiredPlan: "pro" },
  { id: "outlineflash", label: "Outline Flash", desc: "Contorno piscante", category: "Novos 2025", requiredPlan: "pro" },
  { id: "sticker", label: "Sticker", desc: "Estilo adesivo", category: "Novos 2025", requiredPlan: "pro" },
  { id: "morph", label: "Morph", desc: "Distorção orgânica", category: "Novos 2025", requiredPlan: "pro" },
  { id: "stackreveal", label: "Stack Reveal", desc: "Linhas empilhadas", category: "Novos 2025", requiredPlan: "pro" },
  { id: "liquidflow", label: "Liquid Flow", desc: "Fluxo líquido", category: "Novos 2025", requiredPlan: "pro" },
  { id: "pixelreveal", label: "Pixel Reveal", desc: "Nascimento em pixels", category: "Novos 2025", requiredPlan: "pro" },
  { id: "cassette", label: "Cassette", desc: "Fita cassete retrô", category: "Novos 2025", requiredPlan: "pro" },
  { id: "bouncywords", label: "Bouncy Words", desc: "Salto de palavras", category: "Novos 2025", requiredPlan: "pro" },
  { id: "terminal", label: "Terminal", desc: "Console de comando", category: "Novos 2025", requiredPlan: "pro" },
  { id: "slicereveal", label: "Slice Reveal", desc: "Revelação por corte", category: "Novos 2025", requiredPlan: "pro" },
  { id: "chalkboard", label: "Chalkboard", desc: "Escrita em lousa", category: "Novos 2025", requiredPlan: "pro" },
  { id: "punchtext", label: "Punch Text", desc: "Impacto frontal", category: "Novos 2025", requiredPlan: "pro" },
  { id: "newsticker", label: "News Ticker", desc: "Noticiário urgente", category: "Novos 2025", requiredPlan: "pro" },
  { id: "particles", label: "Particles", desc: "Explosão de pontos", category: "Novos 2025", requiredPlan: "pro" },
  { id: "noise", label: "Noise Fade", desc: "Surgimento ruidoso", category: "Novos 2025", requiredPlan: "pro" },
  { id: "strokepop", label: "Stroke Pop", desc: "Contorno vibrante", category: "Novos 2025", requiredPlan: "pro" },
];

/** 
 * Estilos de Preview (Navegador).
 * Estes estilos são usados apenas para mostrar ao usuário um exemplo visual 
 * simplificado no navegador via CSS/Canvas 2D.
 */
export const PREVIEW_STYLE: Record<string, {
  font: string; color: string; highlight?: string; outline?: string; outlineW?: number;
  shadow?: string; bg?: string;
}> = {
  highlight: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#f7c204", shadow: "rgba(0,0,0,0.9)" },
  karaoke: { font: "900 12px 'Montserrat',sans-serif", color: "rgba(255,255,255,0.45)", highlight: "#00FF00", bg: "rgba(0,0,0,0.55)" },
  tiktok: { font: "900 13px 'Montserrat',sans-serif", color: "#FFFF00", highlight: "#FFFF00", outline: "#000", outlineW: 3 },
  instagram: { font: "800 13px 'Montserrat',sans-serif", color: "#f58529", highlight: "#dd2a7b" },
  capcut: { font: "900 13px 'Montserrat',sans-serif", color: "#000", highlight: "#FFE500", bg: "#FFE500" },
  impact: { font: "900 14px 'Montserrat',sans-serif", color: "#ff3b3b", highlight: "#fff", outline: "#000", outlineW: 3 },
  gradientorig: { font: "bold 11px 'Orbitron',sans-serif", color: "#00FFFF", highlight: "#fff", outline: "#f0f", outlineW: 1.5 },
  cinematic: { font: "bold 14px 'Staatliches',cursive", color: "#fff", highlight: "#FFFF00", bg: "rgba(0,0,0,0.7)" },
  neon: { font: "12px 'Monoton',cursive", color: "#fff", highlight: "#FF00FF", shadow: "#ff00ff", outline: "#00ffff", outlineW: 1 },
  matrix: { font: "9px 'Press Start 2P',cursive", color: "#00ff00", highlight: "#fff", bg: "rgba(0,255,0,0.12)" },
  pop3d: { font: "bold 14px 'Black Ops One',cursive", color: "#ffaa00", highlight: "#fff", outline: "#ff5500", outlineW: 1, shadow: "#ff5500" },
  liquid: { font: "bold 13px 'Ultra',serif", color: "#ccc", highlight: "#fff", outline: "#b4b4ff", outlineW: 1.5 },
  explosive: { font: "bold 14px 'Bangers',cursive", color: "#ff4400", highlight: "#ffcc00", outline: "#ffcc00", outlineW: 2 },
  neonglow: { font: "bold 12px 'Monoton',cursive", color: "#00ff88", highlight: "#fff", shadow: "#00ff88" },
  glitch: { font: "bold 14px 'Bangers',cursive", color: "#fff", highlight: "#FF00FF", outline: "#ff00ff", outlineW: 2 },
  fire: { font: "bold 14px 'Anton',sans-serif", color: "#ffaa00", highlight: "#fff", outline: "#ff6600", outlineW: 2, shadow: "#ff6600" },
  water: { font: "bold 13px 'Pacifico',cursive", color: "#00ffff", highlight: "#fff", outline: "#00aaff", outlineW: 1.5 },
  rainbow: { font: "bold 14px 'Bungee',cursive", color: "#ff6060", highlight: "#fff", outline: "#60ff60", outlineW: 1.5 },
  shadow: { font: "bold 14px 'Alfa Slab One',cursive", color: "#ffaa00", highlight: "#fff", outline: "#6464ff", outlineW: 1, shadow: "#6464ff" },
  pixel: { font: "10px 'Press Start 2P',cursive", color: "#ffff00", highlight: "#fff", outline: "#ff0", outlineW: 1.5 },
  retro: { font: "bold 14px 'Lobster',cursive", color: "#ff88cc", highlight: "#fff", shadow: "#ff44aa" },
  gradientcup: { font: "bold 13px 'Fredoka One',cursive", color: "#ff00aa", highlight: "#fff", outline: "#00aaff", outlineW: 1.5 },
  outline: { font: "bold 14px 'Anton',sans-serif", color: "#fff", highlight: "#fffc00", outline: "#fffc00", outlineW: 3 },
  chrome: { font: "bold 14px 'Black Ops One',cursive", color: "#ccc", highlight: "#fff", shadow: "#ffff00", outline: "#fff", outlineW: 1 },
  glass: { font: "bold 14px 'Righteous',cursive", color: "rgba(255,255,255,0.55)", highlight: "#fff", outline: "rgba(255,255,255,0.8)", outlineW: 1.2 },
  bouncycolor: { font: "900 13px 'Montserrat',sans-serif", color: "#FFFFFF", highlight: "#FFE500", shadow: "#000" },
  wordbyword: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#FFE500", outline: "#000", outlineW: 2 },
  highlightbox: { font: "900 13px 'Montserrat',sans-serif", color: "#000", highlight: "#FF6B6B", bg: "#FF6B6B" },
  splitflap: { font: "bold 10px 'Courier New',monospace", color: "#FFE500", highlight: "#FFE500", bg: "#111", shadow: "#FFE500" },
  scramble: { font: "bold 13px 'Courier New',monospace", color: "#0ff", highlight: "#fff", shadow: "#0ff" },
  firetext: { font: "bold 15px 'Impact',sans-serif", color: "#FFAA00", highlight: "#fff", outline: "#FF4500", outlineW: 1, shadow: "#FF4500" },
  rainbowwave: { font: "900 13px 'Montserrat',sans-serif", color: "#ff6060", highlight: "#fff" },
  threed: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", shadow: "#888" },
  bubble: { font: "900 13px 'Montserrat',sans-serif", color: "#111", highlight: "#111", bg: "#fff" },
  countdown: { font: "bold 18px 'Impact',sans-serif", color: "#fff", highlight: "#FF6B6B", shadow: "#FF6B6B" },
  slideinleft: { font: "900 13px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", outline: "#000", outlineW: 2 },
  stamp: { font: "bold 12px 'Impact',sans-serif", color: "#FF3B3B", highlight: "#FF3B3B", outline: "#FF3B3B", outlineW: 1, bg: "rgba(255,59,59,0.1)" },
  holographic: { font: "900 13px 'Montserrat',sans-serif", color: "#fff", highlight: "#FF88FF" },
  gradshift: { font: "900 13px 'Montserrat',sans-serif", color: "#C084FC", highlight: "#818CF8" },
  shadowdepth: { font: "900 13px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", shadow: "#6464FF" },
  zoombeat: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", outline: "#000", outlineW: 2 },
  outlineflash: { font: "bold 14px 'Impact',sans-serif", color: "transparent", highlight: "#FFE500", outline: "#FFE500", outlineW: 3 },
  sticker: { font: "900 13px 'Montserrat',sans-serif", color: "#000", highlight: "#000", bg: "#FFE500" },
  morph: { font: "900 13px 'Montserrat',sans-serif", color: "#4ECDC4", highlight: "#A855F7" },
  stackreveal: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", outline: "#000", outlineW: 1 },
  liquidflow: { font: "900 13px 'Montserrat',sans-serif", color: "#4ECDC4", highlight: "#44CF6C", shadow: "#4ECDC4" },
  pixelreveal: { font: "900 13px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", outline: "#000", outlineW: 1 },
  cassette: { font: "bold 11px 'Courier New',monospace", color: "#2D2D2D", highlight: "#E63946", bg: "#F5F0E8", outline: "#2D2D2D", outlineW: 1 },
  bouncywords: { font: "900 13px 'Montserrat',sans-serif", color: "#FF6B6B", highlight: "#FFE66D", shadow: "#000" },
  terminal: { font: "13px 'Courier New',monospace", color: "#fff", highlight: "#27C93F", bg: "rgba(30,30,30,0.95)" },
  slicereveal: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", outline: "rgba(255,255,255,0.3)", outlineW: 1 },
  chalkboard: { font: "13px 'Patrick Hand','Segoe Print',cursive", color: "rgba(240,236,220,0.88)", highlight: "#fff", bg: "rgba(45,90,61,0.9)" },
  punchtext: { font: "bold 15px 'Impact',sans-serif", color: "#fff", highlight: "#fff", outline: "#000", outlineW: 3, shadow: "#000" },
  newsticker: { font: "900 11px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff", bg: "#E63946" },
  particles: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#FFE500", outline: "#000", outlineW: 1 },
  noise: { font: "900 14px 'Montserrat',sans-serif", color: "#fff", highlight: "#fff" },
  strokepop: { font: "bold 14px 'Bangers',cursive", color: "#111", highlight: "#fff", outline: "#fff", outlineW: 4 },
};

/** 
 * Funções auxiliares de animação
 */
const spring = (t: number) => {
  // Matches backend CanvasSubtitleService spring for 1:1 parity
  if (t < 0) return 0;
  return 1 - Math.exp(-t * 4) * Math.cos(t * 6);
};
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** 
 * Componente SubtitleCanvas.
 * Responsável por desenhar uma animação em miniatura dentro do card de seleção.
 * Ele tenta espelhar o comportamento do backend de forma simplificada com Canvas 2D.
 */
export function SubtitleCanvas({ presetId, active }: { presetId: string; active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const SPEED = 0.07
  const TEXT = "KURT CUT"

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2

    function drawBg() {
      const grad = ctx.createLinearGradient(0, 0, W, H)
      grad.addColorStop(0, "#252525"); grad.addColorStop(1, "#161616")
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H)
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H); drawBg()
      ctx.globalAlpha = 0.7
      ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
      const s = PREVIEW_STYLE[presetId] || { font: "bold 13px sans-serif", color: "#aaa" }
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = s.font
      if (s.bg) { ctx.fillStyle = s.bg; ctx.fillRect(4, cy - 11, W - 8, 20) }
      if (s.shadow) { ctx.shadowColor = s.shadow; ctx.shadowBlur = 5 }
      if (s.outline && s.outlineW) { ctx.lineJoin = "round"; ctx.lineWidth = s.outlineW * 1.4; ctx.strokeStyle = s.outline; ctx.strokeText(TEXT, cx, cy) }
      ctx.fillStyle = s.color; ctx.fillText(TEXT, cx, cy)
    }

    function render() {
      if (!active) { drawStatic(); return }
      ctx.resetTransform(); timeRef.current += SPEED
      const t = timeRef.current
      ctx.clearRect(0, 0, W, H); drawBg()
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = "transparent"
      const s = PREVIEW_STYLE[presetId] || { font: "bold 13px sans-serif", color: "#aaa" }
      const hl = s.highlight || s.color

      switch (presetId) {
        case "highlight": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          ctx.fillStyle = "rgba(255,255,255,0.45)"
          ctx.fillText("KURT", cx - 20, cy)
          const pulse = 1.08 + Math.sin(t * 8) * 0.04
          ctx.save(); ctx.translate(cx + 16, cy); ctx.scale(pulse, pulse)
          ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowOffsetX = 1.5; ctx.shadowOffsetY = 2; ctx.shadowBlur = 0
          ctx.fillStyle = "#f7c204"; ctx.fillText("CUT", 0, 0)
          ctx.restore(); break
        }
        case "tiktok": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          ctx.save(); ctx.translate(cx, cy)
          ctx.lineJoin = "round"; ctx.lineWidth = 1.6; ctx.strokeStyle = "#000000"
          ctx.strokeText(TEXT, 0, 0)
          ctx.fillStyle = "#FFFF00"; ctx.fillText(TEXT, 0, 0)
          ctx.restore(); break
        }
        case "karaoke": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("KURT", cx - 22, cy)
          ctx.fillStyle = "#00FF00"; ctx.fillText("CUT", cx + 18, cy); break
        }
        case "instagram": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          const yOff = Math.sin(t * 3) * 2
          const gIG = ctx.createLinearGradient(cx - 28, cy, cx + 28, cy)
          gIG.addColorStop(0, "#f58529"); gIG.addColorStop(0.33, "#dd2a7b"); gIG.addColorStop(0.66, "#8134af"); gIG.addColorStop(1, "#515bd4")
          ctx.fillStyle = gIG; ctx.fillText(TEXT, cx, cy + yOff); break
        }
        case "capcut": {
          ctx.textAlign = "center"; ctx.textBaseline = "middle"
          const CAPCUT_COLS = ["#FFE500", "#FFFFFF", "#00CFFF", "#FF4DCF", "#44FF88"]
          TEXT.split(" ").forEach((w, i) => {
            const px = cx - 18 + i * 36; ctx.font = s.font
            const tw = ctx.measureText(w).width + 14
            const pillCol = active ? CAPCUT_COLS[i % CAPCUT_COLS.length] : "rgba(40,40,40,0.85)"
            ctx.fillStyle = pillCol
            ctx.beginPath(); ctx.roundRect(px - tw / 2, cy - 11, tw, 20, 6); ctx.fill()
            const isLight = pillCol === "#FFE500" || pillCol === "#FFFFFF" || pillCol === "#44FF88"
            ctx.fillStyle = active ? (isLight ? "#000" : "#fff") : "rgba(255,255,255,0.55)"
            ctx.fillText(w, px, cy + 1)
          }); break
        }
        case "impact": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          const sci = 1.15 + Math.sin(t * 10) * 0.06
          ctx.save(); ctx.translate(cx, cy); ctx.scale(sci, sci)
          ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.strokeText(TEXT, 0, 0)
          ctx.fillStyle = hl; ctx.fillText(TEXT, 0, 0); ctx.restore(); break
        }
        case "neon":
        case "glitch": {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          const gX = 2.5 + Math.sin(t * 10) * 1.5
          ctx.save(); ctx.translate(cx, cy)
          ctx.globalCompositeOperation = "screen"

          // Draw Magenta left, Cyan right
          ctx.fillStyle = "#ff00ff"; ctx.fillText(TEXT, -gX, 0)
          ctx.fillStyle = "#00ffff"; ctx.fillText(TEXT, gX, 0)
          ctx.restore()

          // Subtle glow
          if (active) {
            ctx.shadowColor = hl || "#ff00ff"
            ctx.shadowBlur = 6
          }
          ctx.fillStyle = s.color; ctx.fillText(TEXT, cx, cy)
          break
        }
        default: {
          ctx.font = s.font; ctx.textAlign = "center"; ctx.textBaseline = "middle"
          if (s.bg) { ctx.fillStyle = s.bg; ctx.fillRect(4, cy - 11, W - 8, 20) }
          if (s.shadow) { ctx.shadowColor = s.shadow; ctx.shadowBlur = 6 }
          if (s.outline && s.outlineW) { ctx.lineWidth = s.outlineW * 1.4; ctx.strokeStyle = s.outline; ctx.strokeText(TEXT, cx, cy) }
          ctx.fillStyle = s.color; ctx.fillText(TEXT, cx, cy)
        }
      }
      rafRef.current = requestAnimationFrame(render)
    }

    if (!active) { drawStatic() }
    else { rafRef.current = requestAnimationFrame(render) }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [presetId, active])

  return <canvas ref={canvasRef} width={130} height={70} style={{ width: "100%", height: "100%", display: "block", objectFit: "cover" }} />
}

/** 
 * Componente AnimatedSubtitle.
 * Renderiza legendas com CSS animado baseado no preset ativo.
 */
// eslint-disable-next-line react/display-name
export const AnimatedSubtitle = memo(({
  text,
  active: isActive,
  presetId,
  words = [],
  time: t = 0,
  fontSizeVw = 5,
  baseFont = "Montserrat",
  effFontFamily = "Montserrat",
  effFontColor = "#FFFFFF",
  effHighlightColor = "#FFE500",
  effOutlineColor = "#000000",
  effOutlineWidth = 0,
  effShadowDepth = 0,
  effBgColor = "transparent",
  isPast = false
}: any) => {
  // ── Base styles applied to ALL presets ──
  const style: any = {
    fontFamily: effFontFamily.includes(',') ? effFontFamily : `'${effFontFamily}', sans-serif`,
    fontSize: `clamp(0.4rem, ${fontSizeVw}cqw, 6rem)`,
    fontWeight: "900",
    textTransform: "uppercase" as const,
    transition: "opacity 0.15s ease",
    lineHeight: 1.2,
    paintOrder: "stroke fill",
  }
  // 1px em 1080p = ~0.0926cqw. 
  // Backend calculation: lineWidth = outlineWidth * 2.
  const relStroke = (effOutlineWidth * 2) / 10.8;
  const strokeColor = effOutlineColor || "transparent";

  switch (presetId) {
    case "highlight": {
      // Alex Hormozi style: Strong pop, highlight color, gray others
      const sp = spring(t * 3.5);
      const sc = isActive ? 1 + sp * 0.15 : 0.95;
      const rot = isActive ? (1 - sp) * -4 : 0;

      style.fontWeight = "900";
      style.textTransform = "uppercase";
      style.letterSpacing = "-0.01em";

      if (isActive) {
        style.color = effHighlightColor; // Use user override or preset default
        style.opacity = 1;
        style.transform = `scale(${sc}) rotate(${rot}deg)`;
        style.filter = "drop-shadow(0 4px 12px rgba(0,0,0,0.6))";
        style.transition = "none";
      } else {
        style.color = "rgba(180, 180, 180, 0.45)"; // Dim gray
        style.opacity = 0.5;
        style.transform = "scale(0.95)";
        style.filter = "none";
        style.transition = "opacity 0.2s ease, transform 0.2s ease";
      }

      if (effOutlineWidth > 0) {
        style.WebkitTextStroke = `${relStroke}cqw ${strokeColor}`
      }

      style.textShadow = isActive
        ? `0 4px 12px rgba(0,0,0,0.5)`
        : `0 2px 4px rgba(0,0,0,0.3)`;

      break;
    }
    case "karaoke": {
      const sc = isActive ? 1.25 : 1
      const rot = isActive ? Math.sin(t * 3) * 3 : 0
      style.color = isActive ? (effHighlightColor || "#00FF00") : (effFontColor || "#FFFFFF")
      style.transform = `scale(${sc}) rotate(${rot}deg)`
      style.WebkitTextStroke = `${relStroke}cqw ${strokeColor}`
      style.textShadow = isActive ? `0 0 ${12 + Math.sin(t * 4) * 4}px ${effHighlightColor}` : "none"
      break
    }
    case "tiktok": {
      // TikTok: Custom highlight, Estático e LISO.
      const sc = 1.0; const yB = 0;
      const baseOW = effOutlineWidth > 0 ? effOutlineWidth : 4
      const o = Math.max(1, baseOW * (fontSizeVw / 5))

      style.textTransform = "uppercase"
      style.color = effHighlightColor || "#FFFF00"
      // Sharp outline + Soft drop shadow like native TikTok
      style.WebkitTextStroke = `${relStroke || (4 / 10.8)}cqw ${strokeColor}`
      style.paintOrder = "stroke fill" // Ensures fill is OVER the stroke
      style.textShadow = "2px 2px 5px rgba(0,0,0,0.7)"
      style.transform = `scale(${sc}) translateY(${yB}px)`
      style.opacity = 1
      style.filter = "none"
      break
    }
    case "impact": {
      const sc = isActive ? 1.2 - easeOut(t * 2) * 0.05 : 1
      const rot = isActive ? Math.sin(t * 3) * 3 : 0
      style.color = isActive ? effHighlightColor : effFontColor
      style.transform = `scale(${sc}) rotate(${rot}deg)`
      style.WebkitTextStroke = `${relStroke}cqw ${strokeColor}`
      style.textShadow = isActive ? `0 0 ${12 + Math.sin(t * 4) * 4}px ${effHighlightColor}` : "none"
      break
    }
    case "gradient":
    case "gradientorig": {
      const hue = (t * 120) % 360
      style.backgroundImage = `linear-gradient(135deg, hsl(${hue},100%,60%), hsl(${(hue + 120) % 360},100%,60%), hsl(${(hue + 240) % 360},100%,60%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 0.9})`
      break
    }
    case "cinematic": {
      style.color = effFontColor
      style.opacity = isActive ? Math.min(1, t * 4) : 0.7
      style.backgroundColor = effBgColor !== "transparent" ? effBgColor : `rgba(0,0,0,${0.7 + Math.sin(t * 2) * 0.05})`
      style.padding = "8px 20px"
      style.borderRadius = "0px"
      style.letterSpacing = "0.12em"
      style.WebkitTextStroke = "0px transparent"
      if (isActive) style.textShadow = `0 0 ${8 + Math.sin(t * 4) * 3}px ${effHighlightColor}`
      break
    }
    case "neon": {
      const oX = isActive ? Math.sin(t * 5) * 3 : 0
      const oY = isActive ? Math.cos(t * 4) * 2 : 0
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `translate(${oX}px, ${oY}px) skewX(${isActive ? oX * 2 : 0}deg)`
      style.textShadow = isActive
        ? `-2px 0 0 #ff00ff, 2px 0 0 #00ffff, 0 0 ${18 + Math.sin(t * 6) * 6}px ${effHighlightColor}`
        : `0 0 8px ${effHighlightColor}`
      break
    }
    case "matrix": {
      const alpha = isActive ? 0.5 + Math.sin(t * 5) * 0.5 : 0.4
      style.color = isActive ? `rgba(0,255,0,${alpha})` : "rgba(0,255,0,0.5)"
      style.fontFamily = "'Press Start 2P', monospace"
      style.fontSize = `clamp(0.5rem, ${fontSizeVw * 0.65}cqw, 3rem)`
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = isActive
        ? `0 0 ${10 + Math.sin(t * 4) * 4}px #00FF00, 0 0 20px #00AA00`
        : "0 0 6px #00FF00"
      style.backgroundColor = `rgba(0,255,0,${isActive ? 0.15 : 0.05})`
      style.padding = "6px 14px"
      style.borderRadius = "4px"
      style.transform = `scale(${isActive ? 1 + Math.sin(t * 4) * 0.02 : 1})`
      break
    }
    case "pop3d": {
      const sc = isActive ? 1 + spring(t * 3) * 0.15 : 1
      const d3 = isActive
        ? Array.from({ length: 5 }, (_, i) => `${i + 1}px ${i + 1}px 0px ${effOutlineColor}`).join(", ")
        : `2px 2px 0px ${effOutlineColor}`
      style.color = isActive ? effHighlightColor : effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = d3
      style.transform = `scale(${sc})`
      break
    }
    case "liquid": {
      const w1 = isActive ? Math.sin(t * 3) * 4 : 0
      const w2 = isActive ? Math.cos(t * 2.5) * 3 : 0
      const hue = (t * 90) % 360
      style.backgroundImage = isActive
        ? `linear-gradient(${90 + w1 * 5}deg, #ccc, #fff, hsl(${hue},60%,80%), #999)`
        : "linear-gradient(90deg, #ccc, #fff, #999)"
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = `${relStroke}cqw rgba(180,180,255,0.5)`
      style.transform = `translate(${w2}px, ${w1 * 0.5}px)`
      style.filter = isActive ? "drop-shadow(0 0 6px rgba(180,180,255,0.6))" : "none"
      break
    }
    case "explosive": {
      const sc = isActive ? 1 + Math.abs(Math.sin(t * 4)) * 0.3 : 1
      const rot = isActive ? Math.sin(t * 4) * 4 : 0
      const hue = (t * 180) % 360
      style.color = isActive ? `hsl(${hue},100%,60%)` : effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `scale(${sc}) rotate(${rot}deg)`
      style.textShadow = isActive ? `0 0 ${20 + Math.sin(t * 5) * 8}px hsl(${hue},100%,70%)` : "none"
      break
    }
    case "neonglow": {
      const hue = (t * 120) % 360
      const glowSize = isActive ? 20 + Math.sin(t * 5) * 8 : 10
      style.color = isActive ? `hsl(${hue},100%,70%)` : effFontColor
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = isActive
        ? `0 0 ${glowSize}px hsl(${hue},100%,70%), 0 0 ${glowSize * 1.8}px hsl(${hue},100%,50%), 0 0 ${glowSize * 2.5}px hsl(${hue},100%,30%)`
        : `0 0 10px ${effHighlightColor}`
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "glitch": {
      const gX = isActive ? Math.sin(t * 9) * 4 : 0
      const gY = isActive ? Math.cos(t * 7) * 2 : 0
      const sk = isActive ? Math.sin(t * 12) * 5 : 0
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `translate(${gX}px, ${gY}px) skewX(${sk}deg)`
      style.textShadow = isActive
        ? `${-gX * 0.8}px 0 0 #ff00ff, ${gX * 0.8}px 0 0 #00ffff, 0 0 15px ${effHighlightColor}`
        : `0 0 8px ${effHighlightColor}`
      break
    }
    case "fire": {
      const fl = isActive ? Math.sin(t * 12) * 3 : 0
      const fl2 = isActive ? Math.cos(t * 9) * 2 : 0
      const hue = isActive ? 30 + Math.sin(t * 4) * 15 : 30
      style.backgroundImage = isActive
        ? `linear-gradient(0deg, hsl(${hue - 10},100%,40%), hsl(${hue + 10},100%,60%), #ffeeaa)`
        : "linear-gradient(0deg, #ff6600, #ffaa00)"
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = `${effOutlineWidth}px rgba(255,80,0,0.5)`
      style.transform = `translateY(${fl}px) skewX(${fl2}deg)`
      style.textShadow = isActive
        ? `0 0 ${20 + fl * 2}px #ff6600, 0 0 35px #ff4400, 0 0 50px rgba(255,0,0,0.5)`
        : "0 0 12px #ff6600"
      break
    }
    case "water": {
      const wave = isActive ? Math.sin(t * 2.5) * 6 : 0
      const wave2 = isActive ? Math.cos(t * 2) * 3 : 0
      const hue = isActive ? 190 + Math.sin(t * 1.5) * 20 : 190
      style.backgroundImage = isActive
        ? `linear-gradient(${180 + wave * 3}deg, #00ffff, hsl(${hue},100%,60%), #0055ff)`
        : "linear-gradient(180deg, #00ffff, #00aaff)"
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = `${relStroke}cqw rgba(0,150,255,0.4)`
      style.transform = `translateY(${wave}px) translateX(${wave2}px)`
      style.textShadow = isActive
        ? `0 0 ${15 + Math.sin(t * 3) * 5}px rgba(0,170,255,0.8), 0 ${wave}px 10px rgba(0,100,200,0.5)`
        : "0 0 10px #00aaff"
      break
    }
    case "rainbow": {
      const hue = (t * 240) % 360
      style.backgroundImage = `linear-gradient(135deg, hsl(${hue},100%,60%), hsl(${(hue + 60) % 360},100%,60%), hsl(${(hue + 120) % 360},100%,60%), hsl(${(hue + 180) % 360},100%,60%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `scale(${isActive ? 1.05 + Math.sin(t * 4) * 0.05 : 1})`
      style.textShadow = `0 0 ${12 + Math.sin(t * 5) * 4}px hsl(${hue},100%,70%)`
      break
    }
    case "shadow": {
      const sc = isActive ? 1 + spring(t * 2) * 0.1 : 1
      const d3 = Array.from({ length: 5 }, (_, i) => {
        const o = (i + 1) + (isActive ? Math.sin(t * 3 + i) * 1 : 0)
        return `${o}px ${o}px 0px ${effOutlineColor}${Math.floor((0.4 - i * 0.06) * 255).toString(16).padStart(2, '0')}`
      }).join(", ")
      style.color = isActive ? effHighlightColor : effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = d3
      style.transform = `scale(${sc})`
      break
    }
    case "pixel": {
      const sc = isActive ? 1 + Math.sin(t * 5) * 0.05 : 1
      style.color = isActive ? effHighlightColor : effFontColor
      style.fontFamily = "'Press Start 2P', monospace"
      style.fontSize = `clamp(0.5rem, ${fontSizeVw * 0.65}cqw, 3rem)`
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = isActive
        ? `-2px -2px 0 ${effOutlineColor}, 2px 2px 0 ${effOutlineColor}, 0 0 10px ${effHighlightColor}`
        : `-1px -1px 0 ${effOutlineColor}, 1px 1px 0 ${effOutlineColor}`
      style.transform = `scale(${sc})`
      style.opacity = isActive ? 0.8 + Math.sin(t * 15) * 0.2 : 1
      break
    }
    case "retro": {
      const swing = isActive ? Math.sin(t * 3) * 8 : 0
      const sw2 = isActive ? Math.cos(t * 2.5) * 6 : 0
      style.color = isActive ? effHighlightColor : effFontColor
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = isActive
        ? `${sw2 * 0.4}px ${3 + Math.sin(t * 2) * 2}px 0px rgba(255,68,170,0.8), 0 0 ${15 + Math.sin(t * 5) * 5}px rgba(255,136,204,0.6)`
        : "2px 2px 0px rgba(255,68,170,0.6)"
      style.transform = `rotate(${swing * 0.3}deg) translateX(${sw2 * 0.2}px)`
      break
    }
    case "gradientcup": {
      const hue = (t * 150) % 360
      style.backgroundImage = `linear-gradient(${135 + Math.sin(t * 2) * 20}deg, hsl(${hue},100%,60%), hsl(${(hue + 150) % 360},100%,60%), hsl(${(hue + 270) % 360},100%,60%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      style.textShadow = `0 0 ${15 + Math.sin(t * 4) * 5}px hsl(${hue},100%,70%)`
      break
    }
    case "outline": {
      const outHue = (t * 120) % 360
      const oW = isActive ? effOutlineWidth + Math.sin(t * 5) * 1.5 : effOutlineWidth
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor || `hsl(${outHue},100%,60%)`}`
      style.textShadow = isActive ? `0 0 ${8 + Math.sin(t * 4) * 4}px ${effHighlightColor}` : "none"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "chrome": {
      const angle = (t * 90) % 360
      style.backgroundImage = `linear-gradient(${angle}deg, #aaa, #fff, #eee, #fff, #bbb, #888, #fff, #ccc)`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = `${relStroke}cqw rgba(255,255,255,0.3)`
      style.textShadow = `0 0 ${10 + Math.sin(t * 3) * 4}px rgba(255,255,0,0.5), 2px 2px 4px rgba(0,0,0,0.5)`
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "glass": {
      style.color = isActive
        ? `rgba(255,255,255,${0.55 + Math.sin(t * 3) * 0.2})`
        : "rgba(255,255,255,0.4)"
      style.WebkitTextStroke = `${relStroke}cqw rgba(255,255,255,${0.6 + Math.sin(t * 2.5) * 0.2})`
      style.textShadow = isActive
        ? `0 0 ${12 + Math.sin(t * 3.5) * 5}px rgba(255,255,255,0.8)`
        : "0 0 8px rgba(255,255,255,0.5)"
      style.backgroundColor = `rgba(255,255,255,${isActive ? 0.08 + Math.sin(t * 2) * 0.03 : 0.05})`
      style.padding = "6px 16px"
      style.borderRadius = "12px"
      style.border = `1px solid rgba(255,255,255,${0.2 + Math.sin(t * 3) * 0.1})`
      style.opacity = isActive ? Math.min(1, t * 4) : 0.8
      break
    }
    case "wordbyword": {
      const sc = isActive ? 1 + spring(t * 2) * 0.1 : 1
      const yOff = isActive ? (1 - spring(t * 3)) * 40 : 0
      style.color = effFontColor
      style.transform = `translateY(${yOff}px) scale(${sc})`
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = isActive ? `0 3px 12px rgba(0,0,0,0.8)` : "none"
      style.opacity = isActive ? Math.min(1, t * 4) : 0.7
      break
    }
    case "highlightbox": {
      // Cor fixa por índice da palavra (não por charCode/tempo)
      const pillColors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#A855F7", "#F97316"]
      // wordIndex estimado via hash do texto — consistente por palavra
      const hash = text.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
      const pillColor = pillColors[hash % pillColors.length]
      const rot = isActive ? Math.sin(t * 3) * 2.5 : -1.5
      const sc = isActive ? 1 + spring(t * 2.5) * 0.1 : 1
      style.color = "#000"
      style.backgroundColor = pillColor
      style.padding = "6px 16px"
      style.borderRadius = "10px"
      style.transform = `scale(${sc}) rotate(${rot}deg)`
      style.WebkitTextStroke = "0px transparent"
      style.boxShadow = isActive ? `0 4px 12px rgba(0,0,0,0.25)` : "none"
      break
    }
    case "splitflap": {
      style.color = isActive ? "#FFE500" : "#555"
      style.backgroundColor = "#111"
      style.padding = "6px 16px"
      style.borderRadius = "8px"
      style.border = `2px solid ${isActive ? "#FFE500" : "#333"}`
      style.textShadow = isActive ? `0 0 12px #FFE500` : "none"
      style.fontFamily = "'Courier New', monospace"
      style.letterSpacing = "0.12em"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "scramble": {
      // Caracteres embaralhados reais — revelados progressivamente
      const GLYPHS = "!@#$%&ABCDEFabcdef0123456789?*"
      const revealProgress = isActive ? Math.min(1, t * 2.2) : 0
      const charsRevealed = Math.floor(revealProgress * text.length)
      const scrambled = text.split("").map((char: string, i: number) => {
        if (i < charsRevealed) return char
        return char === " " ? " " : GLYPHS[Math.floor((t * 18 + i * 7.3)) % GLYPHS.length]
      }).join("")
      style.color = revealProgress >= 1 ? "#FFFFFF" : "#00FFFF"
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = revealProgress >= 1
        ? "0 2px 8px rgba(0,0,0,0.8)"
        : `0 0 ${10 + Math.sin(t * 8) * 4}px #0ff, 0 0 20px rgba(0,255,255,0.4)`
      style.fontFamily = "'Courier New', monospace"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.06 : 1})`
      // inject scrambled text via data attribute trick — we override children via key
      return <div style={style} key={scrambled}>{scrambled}</div>
    }
    case "firetext": {
      const hueF = isActive ? 30 + Math.sin(t * 4) * 15 : 30
      style.backgroundImage = isActive
        ? `linear-gradient(0deg, hsl(${hueF - 10},100%,40%), hsl(${hueF + 10},100%,65%), #fff)`
        : `linear-gradient(0deg, #FF4500, #FFAA00)`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = `${relStroke}cqw rgba(255,80,0,0.4)`
      style.transform = `translateY(${isActive ? Math.sin(t * 12) * 3 : 0}px) skewX(${isActive ? Math.cos(t * 9) * 2 : 0}deg)`
      style.textShadow = isActive ? `0 0 ${20 + Math.sin(t * 8) * 6}px #FF4500, 0 0 40px #FF2200` : "0 0 12px #FF4500"
      break
    }
    case "rainbowwave": {
      const hueRW = (t * 200) % 360
      style.backgroundImage = `linear-gradient(135deg, hsl(${hueRW},100%,60%), hsl(${(hueRW + 60) % 360},100%,60%), hsl(${(hueRW + 120) % 360},100%,60%), hsl(${(hueRW + 180) % 360},100%,60%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = isActive ? `0 0 ${14 + Math.sin(t * 5) * 5}px hsl(${hueRW},100%,70%)` : "none"
      style.transform = `scale(${isActive ? 1.02 + Math.sin(t * 3) * 0.04 : 1}) translateY(${isActive ? Math.sin(t * 4) * 6 : 0}px)`
      break
    }
    case "threed": {
      const rotY2 = isActive ? Math.sin(t * 1.5) * 12 : 0
      const d3Sh = Array.from({ length: 6 }, (_, i) => `${i + 1}px ${i + 1}px 0px rgba(136,136,136,${0.3 - i * 0.04})`).join(", ")
      style.color = effFontColor
      style.textShadow = d3Sh
      style.transform = `perspective(400px) rotateY(${rotY2}deg) scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      style.letterSpacing = "0.06em"
      break
    }
    case "bubble": {
      // Balão de fala real com cauda triangular abaixo
      const scB = isActive ? 1 + spring(t * 3) * 0.1 : 1
      style.color = "#111"
      style.backgroundColor = "#FFFFFF"
      style.padding = "10px 24px"
      style.borderRadius = "20px"
      style.boxShadow = isActive ? "0 8px 30px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.2)"
      style.transform = `scale(${scB})`
      style.transformOrigin = "bottom center"
      style.WebkitTextStroke = "0px transparent"
      // Cauda triangular via border CSS abaixo do pill
      style.position = "relative"
      // Retorna com pseudo-element via wrapper
      return (
        <div style={{ display: "inline-block", position: "relative", transform: `scale(${scB})`, transformOrigin: "bottom center" }}>
          <div style={{
            ...style,
            transform: "none",
            boxShadow: isActive ? "0 8px 30px rgba(0,0,0,0.35)" : "0 4px 16px rgba(0,0,0,0.2)",
          }}>{text}</div>
          <div style={{
            position: "absolute",
            bottom: -12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderTop: "14px solid #FFFFFF",
            filter: "drop-shadow(0 4px 3px rgba(0,0,0,0.15))",
          }} />
        </div>
      )
    }
    case "countdown": {
      const scCd = isActive ? 2 - spring(t * 3) : 1
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `scale(${scCd})`
      style.opacity = isActive ? Math.min(1, t * 5) : 0.7
      style.textShadow = isActive ? `0 0 ${30 + Math.sin(t * 4) * 10}px rgba(255,107,107,0.8)` : "none"
      break
    }
    case "slideinleft": {
      const xSlide = isActive ? (1 - spring(t * 2)) * -300 : -6
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `translateX(${xSlide}px)`
      style.textShadow = isActive ? "0 3px 12px rgba(0,0,0,0.8)" : "none"
      style.opacity = isActive ? Math.min(1, t * 6) : 0.7
      break
    }
    case "stamp": {
      const scSt = isActive ? 3 - spring(t * 4) * 2 : 1
      const rotSt = isActive ? -4 + Math.sin(t * 3) * 1 : -3
      style.color = effHighlightColor
      style.border = `3px solid ${effHighlightColor}`
      style.borderRadius = "8px"
      style.padding = "6px 20px"
      style.transform = `scale(${Math.max(1, scSt)}) rotate(${rotSt}deg)`
      style.opacity = isActive ? Math.min(1, t * 5) : 0.7
      style.textShadow = isActive ? `0 0 20px ${effHighlightColor}88` : "none"
      style.letterSpacing = "0.16em"
      style.WebkitTextStroke = "0px transparent"
      break
    }
    case "holographic": {
      const hueH = (t * 80) % 360
      style.backgroundImage = `linear-gradient(${hueH}deg, hsl(${hueH},100%,70%), hsl(${(hueH + 120) % 360},100%,70%), hsl(${(hueH + 240) % 360},100%,70%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.filter = isActive ? `drop-shadow(0 0 8px hsl(${hueH},100%,70%))` : "none"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "gradshift": {
      // Diferente do Rainbow: gradiente fixo 2 cores que faz shimmer suave (não rotação de espectro completo)
      // Efeito: ouro→rosa→roxo estilo "premium brand" — hue shift lento de ±30°
      const hueBase = 280 // roxo/rosa base
      const hueShift = Math.sin(t * 0.8) * 30
      const h1 = hueBase + hueShift
      const h2 = (hueBase + 60 + hueShift) % 360
      const angle = 120 + Math.sin(t * 0.5) * 15
      style.backgroundImage = `linear-gradient(${angle}deg, hsl(${h1},90%,65%), hsl(${h2},100%,55%))`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.filter = isActive ? "drop-shadow(0 3px 10px rgba(150,80,255,0.45))" : "none"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.07 : 0.95})`
      style.fontWeight = "900"
      break
    }
    case "shadowdepth": {
      const sxD = isActive ? Math.sin(t * 2) * 8 : 4
      const syD = isActive ? Math.cos(t * 1.5) * 6 + 5 : 5
      style.color = effFontColor
      style.textShadow = `${sxD}px ${syD}px 0 rgba(100,100,255,0.7), ${sxD * 1.5}px ${syD * 1.5}px 0 rgba(200,0,200,0.4), ${sxD * 2}px ${syD * 2}px 10px rgba(0,0,0,0.4)`
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "zoombeat": {
      // Pulsa no entry da palavra (não BPM fixo) — decaimento exponencial a partir de t=0
      const pulse = isActive ? Math.max(0, 1 - t * 3.5) : 0
      const sc = 1 + pulse * 0.22
      const glow = pulse * 28
      style.color = effFontColor
      style.fontWeight = "900"
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `scale(${sc})`
      style.textShadow = isActive
        ? `0 0 ${glow}px rgba(255,255,255,0.95), 0 0 ${glow * 1.8}px rgba(255,160,0,0.6)`
        : "none"
      break
    }
    case "outlineflash": {
      const flashHue = (t * 80) % 360
      const flashCol2 = Math.sin(t * 8) > 0 ? "#FFE500" : "#FF3B3B"
      style.color = "transparent"
      style.WebkitTextStroke = `${relStroke}cqw ${flashCol2}`
      style.textShadow = isActive ? `0 0 ${14 + Math.sin(t * 5) * 5}px ${flashCol2}` : "none"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      break
    }
    case "sticker": {
      const wobble2 = isActive ? Math.sin(t * 4) * 4 : 0
      const scSK = isActive ? 1 + spring(t * 3) * 0.08 : 1
      style.color = "#000"
      style.backgroundColor = "#FFE500"
      style.padding = "8px 22px"
      style.borderRadius = "16px"
      style.border = "3px solid #000"
      style.boxShadow = "3px 3px 0 #000"
      style.transform = `scale(${scSK}) rotate(${wobble2}deg)`
      style.WebkitTextStroke = "0px transparent"
      style.textTransform = "uppercase"
      break
    }
    case "morph": {
      // Skew limitado a 4° máximo para manter legibilidade
      const skewMo = isActive ? Math.sin(t * 2.5) * 4 : 0
      const scXMo = isActive ? 1 + Math.sin(t * 3) * 0.04 : 1
      const sp = spring(t * 2)
      style.backgroundImage = `linear-gradient(90deg, #4ECDC4, #A855F7)`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `skewX(${skewMo}deg) scaleX(${scXMo}) scale(${isActive ? 1 + sp * 0.08 : 0.92})`
      style.opacity = isActive ? 1 : 0.75
      style.fontWeight = "900"
      break
    }
    case "stackreveal": {
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = isActive ? "0 3px 12px rgba(0,0,0,0.8)" : "none"
      style.transform = `translateY(${isActive ? (1 - spring(t * 3)) * 30 : 0}px) scale(${isActive ? 1 + spring(t * 2) * 0.06 : 1})`
      style.opacity = isActive ? Math.min(1, t * 5) : 0.7
      break
    }
    case "liquidflow": {
      const wLF = isActive ? Math.sin(t * 3) * 4 : 0
      const hLF = (t * 60) % 360
      style.backgroundImage = `linear-gradient(${90 + wLF * 5}deg, #4ECDC4, #44CF6C, hsl(${hLF},80%,65%), #4ECDC4)`
      style.WebkitBackgroundClip = "text"
      style.WebkitTextFillColor = "transparent"
      style.color = "transparent"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `translate(${isActive ? Math.sin(t * 2.5) * 3 : 0}px, ${isActive ? Math.cos(t * 2) * 2 : 0}px)`
      style.filter = isActive ? "drop-shadow(0 0 8px rgba(78,205,196,0.7))" : "none"
      break
    }
    case "pixelreveal": {
      // Pixel reveal real: começa pixelado (scale 2x + imageRendering pixelated) → nítido
      const prog = isActive ? Math.min(1, t * 1.8) : 0
      const pixelScale = 1 + (1 - prog) * 1.2  // 2.2 → 1.0
      const crisp = prog > 0.85
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `scale(${pixelScale})`
      style.imageRendering = crisp ? "auto" : "pixelated"
      // Leve blur só no blur de entrada (não pixelização, mas transição suave)
      style.filter = crisp ? "none" : `blur(${(1 - prog) * 1.5}px)`
      style.opacity = isActive ? Math.min(1, prog * 3) : 0.5
      style.letterSpacing = crisp ? "inherit" : `${(1 - prog) * 4}px`
      break
    }
    case "cassette": {
      style.color = "#2D2D2D"
      style.backgroundColor = "#F5F0E8"
      style.padding = "8px 22px"
      style.borderRadius = "10px"
      style.border = "3px solid #2D2D2D"
      style.boxShadow = "2px 2px 0 #2D2D2D"
      style.fontFamily = "'Courier New', monospace"
      style.letterSpacing = "0.18em"
      style.textTransform = "uppercase"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.04 : 1}) rotate(${isActive ? Math.sin(t * 2) * 1 : -1}deg)`
      break
    }
    case "bouncywords": {
      const scBW = isActive ? 1 + spring(t * 3) * 0.12 : 1
      const yBW = isActive ? -Math.abs(Math.sin(t * 4)) * 20 : 0
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `translateY(${yBW}px) scale(${scBW})`
      style.textShadow = isActive ? `0 4px 0 rgba(0,0,0,0.4)` : "none"
      break
    }
    case "terminal": {
      style.color = effFontColor
      style.backgroundColor = "rgba(30,30,30,0.95)"
      style.padding = "8px 22px"
      style.borderRadius = "10px"
      style.border = "1px solid #444"
      style.fontFamily = "'Courier New', monospace"
      style.letterSpacing = "0.06em"
      style.textTransform = "none"
      style.WebkitTextStroke = "0px transparent"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.03 : 1})`
      style.opacity = isActive ? Math.min(1, t * 4) : 0.8
      break
    }
    case "slicereveal": {
      style.color = effFontColor
      style.clipPath = isActive ? `inset(0 ${Math.max(0, 100 - t * 200)}% 0 0)` : `inset(0 100% 0 0)`
      style.WebkitTextStroke = `${effOutlineWidth}px ${effOutlineColor}`
      style.textShadow = isActive ? "0 0 20px rgba(255,255,255,0.4)" : "none"
      break
    }
    case "chalkboard": {
      // Patrick Hand = fonte cursiva de lousa (já baixada). Textura de giz via textShadow em camadas
      const fadeIn = isActive ? Math.min(1, t * 4) : 0.7
      const jitter = isActive ? Math.sin(t * 22) * 0.5 : 0  // tremor de giz
      style.color = `rgba(240,236,220,${0.82 + Math.sin(t * 12) * 0.04})`
      style.backgroundColor = "rgba(45,90,61,0.92)"
      style.padding = "10px 24px"
      style.borderRadius = "6px"
      style.border = "4px solid #8B6914"
      // Patrick Hand primeiro, fallback para cursive
      style.fontFamily = "'Patrick Hand', 'Segoe Print', cursive"
      style.fontWeight = "normal"

      style.textTransform = "none"
      style.letterSpacing = "0.04em"
      style.WebkitTextStroke = "0px transparent"
      // Textura de giz: múltiplas sombras deslocadas levemente (simula traçado irregular)
      style.textShadow = isActive
        ? `${jitter}px ${jitter * 0.5}px 0 rgba(255,255,255,0.07),
           ${-jitter * 0.8}px ${jitter * 0.3}px 0 rgba(255,255,255,0.05),
           0 1px 2px rgba(0,0,0,0.4)`
        : "0 1px 2px rgba(0,0,0,0.4)"
      style.opacity = fadeIn
      break
    }
    case "punchtext": {
      const p0 = isActive ? spring(t * 5) : 1
      const scPT = isActive ? 0 + p0 * 1 + Math.max(0, Math.sin(t * 4 - 0.5)) * 0.08 : 1
      style.color = effFontColor
      style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.textShadow = `4px 4px 0 ${effOutlineColor}, 6px 6px 0 rgba(0,0,0,0.3)`
      style.transform = `scale(${scPT})`
      break
    }
    case "newsticker": {
      // Ticker rolante real via overflow + CSS animation inline
      const tickerText = `${text}  •  ${text}  •  ${text}  •  `
      const scrollOffset = (t * 60) % 200  // px deslocamento contínuo
      return (
        <div style={{
          backgroundColor: "#E63946",
          borderTop: "3px solid #fff",
          borderBottom: "3px solid #fff",
          overflow: "hidden",
          width: "min(90vw, 600px)",
          position: "relative",
        }}>
          <div style={{
            display: "flex",
            whiteSpace: "nowrap",
            transform: `translateX(-${scrollOffset}px)`,
            padding: "8px 0",
            fontFamily: `'Montserrat', 'Arial Black', sans-serif`,
            fontWeight: "900",
            fontSize: `clamp(0.7rem, ${fontSizeVw * 1.2}cqw, 4rem)`,
            color: "#FFFFFF",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            opacity: isActive ? 1 : 0.8,
          }}>
            {tickerText}{tickerText}
          </div>
        </div>
      )
    }
    case "particles": {
      // Partículas reais ao redor do texto via elementos absolutos
      const scPAR = isActive ? 1 + spring(t * 2) * 0.1 : 1
      const particleColors = ["#FFE500", "#FF6B35", "#FF4DCF", "#00CFFF", "#44FF88"]
      const particles = isActive ? Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + t * 2
        const dist = 18 + Math.sin(t * 4 + i) * 8
        const life = Math.max(0, 1 - (t * 0.8 % 1))
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          color: particleColors[i % particleColors.length],
          size: 4 + Math.sin(t * 3 + i * 1.3) * 2,
          opacity: life * 0.85,
        }
      }) : []
      return (
        <div style={{ position: "relative", display: "inline-block", transform: `scale(${scPAR})` }}>
          {particles.map((p, i) => (
            <div key={i} style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              pointerEvents: "none",
            }} />
          ))}
          <div style={{
            ...style,
            transform: "none",
            color: effFontColor,
            WebkitTextStroke: `${relStroke}cqw ${effOutlineColor}`,
            textShadow: isActive ? `0 0 20px rgba(255,229,0,0.6)` : "none",
          }}>{text}</div>
        </div>
      )
    }
    case "noise": {
      style.color = effFontColor
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = isActive ? "0 0 40px rgba(255,255,255,0.3)" : "none"
      style.opacity = isActive ? Math.min(1, t * 3) : 0.5
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.05 : 1})`
      style.filter = isActive && t < 0.3 ? `blur(${(0.3 - t) * 10}px)` : "none"
      style.letterSpacing = "0.1em"
      break
    }
    case "strokepop": {
      const scSPOP = isActive ? 1 + spring(t * 3) * 0.12 : 1
      style.color = effFontColor
      style.WebkitTextStroke = `${effOutlineWidth}px ${effHighlightColor}`
      style.textShadow = isActive ? `0 0 ${12 + Math.sin(t * 5) * 4}px ${effHighlightColor}88` : "none"
      style.transform = `scale(${scSPOP})`
      break
    }
    case "instagram": {
      // Gradiente oficial IG: #f58529 → #dd2a7b → #8134af → #515bd4
      // Active: full gradient + bounce. Inactive: faded gradient (matches preview).
      const sp = spring(t * 3);

      style.fontWeight = "800";
      style.letterSpacing = "-0.02em";
      style.WebkitTextStroke = "0px transparent";

      if (isActive) {
        // ── Active word: full vibrant IG gradient + bounce ──
        style.backgroundImage = "linear-gradient(90deg, #ff8a2b, #e5156b, #9b30ff, #4f5bd5)";
        style.WebkitBackgroundClip = "text";
        style.WebkitTextFillColor = "transparent";
        style.color = "transparent";

        const bounce = (1 - sp) * -10;
        const sc = 1 + sp * 0.08;
        style.transform = `translateY(${bounce}px) scale(${sc})`;
        style.opacity = 1;
        style.filter = "drop-shadow(0 2px 8px rgba(0,0,0,0.4)) saturate(1.3)";
        style.transition = "none";
      } else {
        // ── Inactive: dim muted gray ──
        style.color = "rgba(180, 180, 180, 0.45)";
        style.backgroundImage = "none";
        style.WebkitBackgroundClip = "unset";
        style.WebkitTextFillColor = "unset";
        style.transform = "scale(0.95)";
        style.opacity = 0.5;
        style.filter = "none";
        style.transition = "opacity 0.2s ease, transform 0.2s ease";
      }

      style.textShadow = isActive
        ? "0 2px 8px rgba(0,0,0,0.5)"
        : "none";
      break;
    }
    case "capcut": {
      // CapCut AI: cor do pill fixa por posição (word index via hash), scaleX stretch
      const CAPCUT_COLORS = ["#FFE500", "#FFFFFF", "#00CFFF", "#FF4DCF", "#44FF88"]
      const hash = text.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
      const pillColor = isActive ? CAPCUT_COLORS[hash % CAPCUT_COLORS.length] : "rgba(35,35,35,0.88)"
      const isLightPill = pillColor === "#FFE500" || pillColor === "#FFFFFF" || pillColor === "#44FF88"
      const textColor = isActive ? (isLightPill ? "#000000" : "#FFFFFF") : "rgba(255,255,255,0.5)"
      const sp = spring(t * 3.5)
      const sc = isActive ? 0.5 + sp * 0.65 + Math.max(0, Math.sin(sp * Math.PI) * 0.2) : 1.0
      const rot = isActive ? (1 - sp) * -3 : 0
      const scaleXStretch = isActive ? 1 + (1 - Math.min(1, t * 4)) * 0.06 : 1 // leve stretch inicial


      style.color = textColor
      style.backgroundColor = pillColor
      style.padding = `${fontSizeVw * 0.08}cqw ${fontSizeVw * 0.22}cqw`
      style.borderRadius = `${fontSizeVw * 0.28}cqw`
      style.transform = `scale(${sc}) rotate(${rot}deg) scaleX(${scaleXStretch})`
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = "none"
      if (isActive) style.boxShadow = `0 4px 14px rgba(0,0,0,0.3), 0 0 16px ${pillColor}55`
      break
    }
    case "bouncycolor": {
      const sp = spring(t * 3.5)
      style.color = isActive ? effHighlightColor : effFontColor
      if (effOutlineWidth > 0) style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `translateY(${isActive ? (1 - sp) * -15 : 0}px) scale(${isActive ? 0.9 + sp * 0.15 : 1})`
      style.textShadow = '0 3px 0 rgba(0,0,0,0.8)' // Hard shadow instead of blurred
      style.filter = "none"
      break
    }
    case "clean": {
      style.color = isActive ? effHighlightColor : effFontColor
      style.WebkitTextStroke = "0px transparent"
      style.textShadow = "none"
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.1 : 1})`
      break
    }
    default: {
      style.color = isActive ? effHighlightColor : effFontColor
      if (effOutlineWidth > 0) style.WebkitTextStroke = `${relStroke}cqw ${effOutlineColor}`
      style.transform = `scale(${isActive ? 1 + spring(t * 2) * 0.1 : 1})`
      break
    }
  }
  // Shadow global se não definido no case
  if (effShadowDepth > 0 && !style.textShadow) {
    style.textShadow = Array.from({ length: effShadowDepth }, (_, d) =>
      `${d + 1}px ${d + 1}px 0px rgba(0,0,0,0.5)`
    ).join(", ")
  }

  return <div style={style}>{text}</div>
});

/** 
 * Componente SubtitleCard.
 * Exibe um cartão com o nome, descrição e preview da animação.
 */
export function SubtitleCard({ preset, selected, onSelect }: {
  preset: any; selected: boolean; onSelect: () => void
}) {
  const { user } = useAuth()
  const planoUser = user?.plano || 'free'
  const isLocked = (preset.requiredPlan === 'start' && planoUser === 'free') ||
    (preset.requiredPlan === 'pro' && (planoUser === 'free' || planoUser === 'start'))

  const [hovered, setHovered] = useState(false)
  return (
    <motion.button
      onClick={() => !isLocked && onSelect()}
      whileTap={!isLocked ? { scale: 0.98 } : {}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full group overflow-hidden ${selected ? "bg-white/10" : "bg-white/[0.03] hover:bg-white/[0.06]"
        } ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      {selected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />}
      <div className="relative rounded-lg overflow-hidden shrink-0 border border-white/5">
        <div className={isLocked ? "grayscale opacity-80" : ""}>
          <SubtitleCanvas presetId={preset.id} active={selected || hovered} />
        </div>
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[0.5px]">
            <Crown className="h-5.5 w-5.5 text-yellow-400 fill-yellow-400/20 drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className={`text-[11px] font-bold tracking-tight truncate ${selected ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"}`}>
            {preset.label}
          </p>
          {!isLocked && preset.requiredPlan !== 'free' && (
            <span className="text-[7px] font-black px-1 rounded bg-white/10 text-zinc-500 uppercase shrink-0">
              {preset.requiredPlan}
            </span>
          )}
        </div>
        <p className="text-[9px] text-zinc-500 mt-1 leading-tight truncate font-medium">{preset.desc}</p>
      </div>
      {selected && !isLocked && (
        <div className="shrink-0 h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/20">
          <Check className="h-2.5 w-2.5 text-black" strokeWidth={4} />
        </div>
      )}
    </motion.button>
  )
}

/**
 * Componente SubtitlePlayerWord.
 * Wrapper do AnimatedSubtitle para uso no editor (ActivePlayer).
 * Mapeia os props do editor para o formato esperado pelo AnimatedSubtitle.
 */
export function SubtitlePlayerWord({
  text,
  isActive,
  isPast = false,
  presetId,
  fontFamily,
  fontColor,
  highlightColor,
  outlineColor,
  outlineWidth,
  bgColor,
  shadowDepth,
  fontSizeVw = 5,
  isDragging = false,
  words = [],
}: {
  text: string;
  isActive: boolean;
  isPast?: boolean;
  presetId: string;
  fontFamily: string;
  fontColor: string;
  highlightColor: string;
  outlineColor: string;
  outlineWidth: number;
  bgColor: string;
  shadowDepth: number;
  fontSizeVw?: number;
  isDragging?: boolean;
  words?: any[];
}) {
  // Track animation time per word via useRef + useEffect
  const timeRef = useRef(0);
  const rafRef = useRef<number | undefined>(undefined);
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    if (isActive) {
      timeRef.current = 0;
      const animate = () => {
        timeRef.current += 0.016; // ~60fps
        setAnimTime(timeRef.current);
        rafRef.current = requestAnimationFrame(animate);
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    } else {
      timeRef.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnimTime(0);
    }
  }, [isActive]);

  return (
    <AnimatedSubtitle
      text={text}
      active={isActive}
      isPast={isPast}
      presetId={presetId}
      words={words}
      time={animTime}
      fontSizeVw={fontSizeVw}
      baseFont={`clamp(0.8rem, ${fontSizeVw}cqw, 6rem)`}
      effFontFamily={fontFamily}
      effFontColor={fontColor}
      effHighlightColor={highlightColor}
      effOutlineColor={outlineColor}
      effOutlineWidth={outlineWidth}
      effShadowDepth={shadowDepth}
      effBgColor={bgColor}
    />
  );
}
