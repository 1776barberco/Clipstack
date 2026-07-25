'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Sparkles } from 'lucide-react'

const PROMPTS = [
  'How much can I safely spend this week?',
  'Split $840 from today across my jars',
  'Am I on track for booth rent?',
  'What should go into taxes from this week?',
]

export function HeroCommand() {
  const router = useRouter()
  const [value, setValue] = useState('')

  function openCoach(prompt: string) {
    const q = prompt.trim()
    router.push(q ? `/login?next=${encodeURIComponent(`/coach?q=${encodeURIComponent(q)}`)}` : '/login')
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    openCoach(value)
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={submit}
        className="group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,15,15,0.04),0_20px_50px_rgba(15,15,15,0.08)]"
      >
        <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask TipJars anything about your money…"
            className="w-full bg-transparent text-[15px] font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none sm:text-base"
            aria-label="Ask TipJars"
          />
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800"
            aria-label="Send"
          >
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-3 sm:px-5">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => openCoach(prompt)}
              className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-900"
            >
              {prompt}
            </button>
          ))}
        </div>
      </form>
    </div>
  )
}
