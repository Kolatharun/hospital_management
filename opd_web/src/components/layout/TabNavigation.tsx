import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
  completed?: boolean;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="tab-nav overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'tab-item whitespace-nowrap',
            activeTab === tab.id ? 'tab-item-active' : 'tab-item-inactive'
          )}
        >
          {tab.completed && (
            <span className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
