'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  CheckSquare, 
  StickyNote, 
  Wallet, 
  Utensils,
  BarChart3,
  Settings
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Хаб', href: '/digest' },
  { icon: CheckSquare, label: 'Задачи', href: '/tasks' },
  { icon: StickyNote, label: 'Заметки', href: '/notes' },
  { icon: Wallet, label: 'Финансы', href: '/money' },
  { icon: Utensils, label: 'Еда', href: '/food' },
  { icon: BarChart3, label: 'Аналитика', href: '/analytics' },
  { icon: Settings, label: 'Настройки', href: '/settings' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-t border-white/5">
      <div className="flex overflow-x-auto gap-1 px-4 py-3 max-w-md mx-auto scrollbar-hide">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all flex-shrink-0 ${
                isActive 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}