"use client"

import React, { useState } from "react"
import { useNotifications, Task } from "@/contexts/notification-context"
import { motion, AnimatePresence } from "motion/react"
import { Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp, BellRing, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function TaskTray() {
  const { tasks, removeTask } = useNotifications()
  const [expanded, setExpanded] = useState(true)

  if (tasks.length === 0) return null

  const activeCount = tasks.filter(t => !t.isCompleted && !t.hasError).length
  const completedCount = tasks.filter(t => t.isCompleted).length

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[9999] w-[calc(100%-2rem)] md:w-96 select-none pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          boxShadow: activeCount > 0 
            ? "0 0 20px rgba(16, 185, 129, 0.15), 0 25px 50px -12px rgba(0, 0, 0, 0.5)" 
            : "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}
        className={cn(
          "pointer-events-auto bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-shadow duration-1000",
          activeCount > 0 && "ring-1 ring-emerald-500/20"
        )}
      >
        {/* Global Progress Bar (Top) */}
        {activeCount > 0 && (
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
              animate={{ width: `${(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length).toFixed(1)}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        )}
        {/* Header */}
        <div 
          className="px-4 py-3 border-b border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <BellRing className="h-4 w-4 text-zinc-400" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">
              Processando ({activeCount}/{tasks.length})
            </span>
          </div>
          <button className="h-6 w-6 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white transition-all">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* Task List */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-h-[60vh] overflow-y-auto scrollbar-none"
            >
              <div className="p-3 space-y-2">
                {tasks.map(task => (
                  <TaskItem key={task.id} task={task} onRemove={() => removeTask(task.id)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function TaskItem({ task, onRemove }: { task: Task; onRemove: () => void }) {
  const isDone = task.isCompleted
  const hasError = task.hasError

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "p-3 rounded-xl border transition-all duration-300",
        isDone ? "bg-emerald-500/5 border-emerald-500/20" : 
        hasError ? "bg-red-500/5 border-red-500/20" : 
        "bg-white/[0.02] border-white/5"
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : hasError ? (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          ) : (
            <Loader2 className="h-4 w-4 text-zinc-400 animate-spin shrink-0" />
          )}
          <div className="overflow-hidden">
            <p className="text-[11px] font-bold text-white truncate leading-tight uppercase tracking-tight">
              {task.title}
            </p>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
              {task.status}
            </p>
          </div>
        </div>
        {(isDone || hasError) && (
          <button 
            onClick={onRemove}
            className="h-6 w-6 flex items-center justify-center rounded-lg text-zinc-600 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronDown className="h-3 w-3 rotate-45" />
          </button>
        )}
      </div>

      {!isDone && !hasError && (
        <div className="space-y-1.5 mt-2">
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
          <div className="flex justify-between text-[9px] font-black text-zinc-600 tracking-widest tabular-nums italic">
             <span>PROGRESSO</span>
             <span>{Math.round(task.progress)}%</span>
          </div>
        </div>
      )}
      
      {isDone && (
         <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center justify-between"
         >
            <div className="flex items-center gap-1.5">
               <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Concluído</span>
            </div>
            <div className="h-1 w-12 bg-emerald-500/20 rounded-full overflow-hidden">
               <div className="h-full w-full bg-emerald-500" />
            </div>
         </motion.div>
      )}
    </motion.div>
  )
}
