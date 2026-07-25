import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MaterialIcon } from '@/components/shared/MaterialIcon'
import { Bell, X, ShieldAlert, CheckCircle2, ChevronRight, User } from 'lucide-react'

interface EMSHeaderProps {
  title?: string
  leading?: 'avatar' | 'icon' | 'back' | 'none'
  leadingIcon?: string
  leadingIconFilled?: boolean
  onBack?: () => void
  trailing?: 'bell-avatar' | 'bell' | 'none'
  notificationDot?: boolean
}

const HeaderAvatar: React.FC<{ size?: number; onClick?: () => void }> = ({ size = 34, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="View Paramedic Profile"
    className="rounded-full bg-surface-container-high border-2 border-outline-variant hover:border-primary flex items-center justify-center overflow-hidden shrink-0 transition-all active:scale-95 shadow-2xs"
    style={{ width: size, height: size }}
  >
    <User className="w-4 h-4 text-primary" />
  </button>
)

export const EMSHeader: React.FC<EMSHeaderProps> = ({
  title = 'Balaji EMS',
  leading = 'none',
  leadingIcon,
  leadingIconFilled,
  onBack,
  trailing = 'bell-avatar',
  notificationDot = true,
}) => {
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasDot, setHasDot] = useState(notificationDot)

  const handleBack = () => {
    if (onBack) return onBack()
    navigate(-1)
  }

  const handleProfileClick = () => {
    navigate('/ems/profile')
  }

  const handleNotificationClick = () => {
    setShowNotifications(true)
    setHasDot(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-[56px] bg-surface/95 backdrop-blur-md border-b border-outline-variant max-w-[480px] mx-auto shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {leading === 'back' && (
            <button
              type="button"
              onClick={handleBack}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors active:scale-95 shrink-0"
              title="Go Back"
            >
              <MaterialIcon name="arrow_back" className="text-primary" />
            </button>
          )}
          {leading === 'avatar' && <HeaderAvatar onClick={handleProfileClick} />}
          {leading === 'icon' && leadingIcon && (
            <MaterialIcon name={leadingIcon} filled={leadingIconFilled} className="text-primary shrink-0" />
          )}
          <button
            type="button"
            onClick={() => navigate('/ems')}
            className="font-headline-md text-headline-md font-bold text-primary truncate hover:opacity-80 text-left transition-opacity"
          >
            {title}
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(trailing === 'bell-avatar' || trailing === 'bell') && (
            <button
              type="button"
              onClick={handleNotificationClick}
              title="View Dispatch Notifications"
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low border border-outline-variant/60 hover:bg-surface-container-high transition-all active:scale-95"
            >
              <Bell className="w-5 h-5 text-on-surface-variant" />
              {hasDot && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-surface animate-pulse" />
              )}
            </button>
          )}
          {trailing === 'bell-avatar' && <HeaderAvatar onClick={handleProfileClick} />}
        </div>
      </header>

      {/* Interactive Dispatch Notification Modal / Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
          <div className="bg-surface border border-outline-variant rounded-2xl w-full max-w-[440px] p-4 space-y-4 text-on-surface shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-on-surface font-headline">Dispatch Notifications</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="p-1 text-on-surface-variant hover:text-on-surface rounded-full bg-surface-container"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div
                onClick={() => {
                  setShowNotifications(false)
                  navigate('/ems')
                }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl space-y-1 cursor-pointer hover:bg-red-500/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-700 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-red-600" /> CODE RED DISPATCH ALERT
                  </span>
                  <span className="text-[10px] font-mono text-red-600 font-bold">2m ago</span>
                </div>
                <p className="text-on-surface font-medium">New Incident Assigned: Cardiac Arrest at Bandra Station West.</p>
              </div>

              <div
                onClick={() => {
                  setShowNotifications(false)
                  navigate('/ems/profile')
                }}
                className="p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl space-y-1 cursor-pointer hover:bg-surface-container"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Offline Telemetry Synced
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant font-bold">15m ago</span>
                </div>
                <p className="text-on-surface-variant font-medium">All pending IndexedDB vitals synced to Balaji ER server.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowNotifications(false)
                  navigate('/ems/history')
                }}
                className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
              >
                <span>View Full Mission Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="px-4 py-2 bg-surface-container border border-outline-variant rounded-xl text-xs font-bold text-on-surface"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

