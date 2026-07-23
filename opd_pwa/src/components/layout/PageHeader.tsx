import React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showNotificationIcon?: boolean;
  unreadNotificationsCount?: number;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  showNotificationIcon = false,
  unreadNotificationsCount = 0,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F7F9F8]/95 backdrop-blur-xs border-b border-[#DCE6E7] px-4 py-3.5 flex items-center justify-between min-h-[56px]">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full text-[#16343C] hover:bg-[#DFF3F5] transition-colors cursor-pointer touch-target"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-base font-bold text-[#16343C] leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-[#708188] font-normal">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showNotificationIcon && (
          <button
            type="button"
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full text-[#16343C] hover:bg-[#DFF3F5] transition-colors cursor-pointer touch-target"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[#0B6875]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#C94B4B] rounded-full ring-2 ring-white" />
            )}
          </button>
        )}
        {rightAction}
      </div>
    </header>
  );
};
