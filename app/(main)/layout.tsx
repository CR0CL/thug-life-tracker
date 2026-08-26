import BottomNav from '@/components/navigation/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black">
      <main className="flex-1 overflow-y-auto pb-28">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}