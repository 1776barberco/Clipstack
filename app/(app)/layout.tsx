import { DesktopSidebar } from '@/components/DesktopSidebar'
import { BottomNav } from '@/components/BottomNav'
import { QuickAddFAB } from '@/components/QuickAddFAB'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopSidebar />
      <div className="min-h-screen pb-24 lg:pl-56 lg:pb-0">
        {children}
      </div>
      <BottomNav />
      <QuickAddFAB />
    </>
  )
}
