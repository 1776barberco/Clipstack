'use client'

import Image from 'next/image'

export function HeroAnimation() {
  return (
    <div className="relative w-[200px] h-[200px] mx-auto mb-6">
      <div className="animate-float">
        <Image
          src="/logo-icon.png"
          alt="TipJars"
          width={200}
          height={200}
          className="drop-shadow-lg"
        />
      </div>
      {/* Subtle shadow underneath that scales with the float */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-zinc-900/5 dark:bg-white/5 rounded-full blur-sm animate-shadow" />
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes shadow {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scaleX(0.8); opacity: 0.3; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shadow {
          animation: shadow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
