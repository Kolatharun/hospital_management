import React from 'react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { Home, Calendar, FileText, User } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Appointments', path: '/appointments', icon: Calendar },
    { label: 'Records', path: '/records', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-center bg-white border-t border-[#DCE6E7] safe-padding-bottom shadow-lg">
      <div className="w-full max-w-[480px] flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors cursor-pointer',
                  isActive ? 'text-[#0B6875]' : 'text-[#708188] hover:text-[#16343C]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={clsx('w-5 h-5 mb-1 transition-transform', isActive && 'scale-110')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
