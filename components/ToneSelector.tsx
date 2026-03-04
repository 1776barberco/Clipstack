'use client'

import { Button } from '@/components/ui/button'
import { Flame, BookOpen, Megaphone, Calculator } from 'lucide-react'

const TONES = [
  { id: 'motivator', name: 'Motivator', icon: Flame, emoji: '🔥', desc: 'Hype & encouragement' },
  { id: 'mentor', name: 'Mentor', icon: BookOpen, emoji: '🧠', desc: 'Wise & strategic' },
  { id: 'drill_sergeant', name: 'Drill Sgt', icon: Megaphone, emoji: '💪', desc: 'Tough love' },
  { id: 'numbers', name: 'Numbers', icon: Calculator, emoji: '📊', desc: 'Data-driven' },
]

interface ToneSelectorProps {
  selectedTone: string
  onSelect: (tone: string) => void
}

export function ToneSelector({ selectedTone, onSelect }: ToneSelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {TONES.map((tone) => {
        const isActive = selectedTone === tone.id
        return (
          <Button
            key={tone.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 text-xs gap-1 ${isActive ? '' : 'opacity-70'}`}
            onClick={() => onSelect(tone.id)}
          >
            <span>{tone.emoji}</span>
            <span className="hidden sm:inline">{tone.name}</span>
          </Button>
        )
      })}
    </div>
  )
}
