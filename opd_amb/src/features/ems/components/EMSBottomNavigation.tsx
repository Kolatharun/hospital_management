import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { MaterialIcon } from '@/components/shared/MaterialIcon'

const TABS = [
  { id: 'home', label: 'Home', icon: 'home', path: '/ems' },
  { id: 'missions', label: 'Missions', icon: 'medical_services', path: '/ems/missions' },
  { id: 'records', label: 'Records', icon: 'description', path: '/ems/history' },
  { id: 'profile', label: 'Profile', icon: 'person', path: '/ems/profile' },
]

export const EMSBottomNavigation: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleTabClick = (tab: typeof TABS[number]) => {
    if (tab.id === 'missions') {
      navigate('/ems')
    } else {
      navigate(tab.path)
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 pt-2.5 h-[68px] bg-surface/95 backdrop-blur-md border-t border-outline-variant max-w-[480px] mx-auto pb-safe shadow-lg">
      {TABS.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          (tab.id === 'missions' && location.pathname.includes('/ems/missions')) ||
          (tab.id === 'home' && location.pathname === '/ems')

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 transition-all duration-200 active:scale-95 ${
              isActive ? 'text-primary font-bold' : 'text-on-surface-variant/80 hover:text-on-surface'
            }`}
          >
            <MaterialIcon name={tab.icon} filled={isActive} />
            <span className="font-label-sm text-label-sm pt-0.5">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
