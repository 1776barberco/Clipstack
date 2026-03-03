import { DesktopSidebar } from '@/components/DesktopSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopSidebar />
      <div className="lg:pl-56">
        {children}
      </div>
    </>
  )
}
