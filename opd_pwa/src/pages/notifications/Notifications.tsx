import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../../services/notificationService';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { FilterChip } from '../../components/ui/FilterChip';
import { PageState } from '../../components/ui/PageState';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { Bell, Calendar, Clock, Pill, Building2, ChevronRight, Check } from 'lucide-react';
import { NotificationCategory } from '../../types';

export const Notifications: React.FC = () => {
  const nav = useAppNavigation();
  const [filter, setFilter] = useState<string>('all');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationService.getNotifications(),
  });

  const notifications = data?.data || [];

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    return n.category === filter;
  });

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'appointment':
        return <Calendar className="w-5 h-5 text-[#0B6875]" />;
      case 'queue':
        return <Clock className="w-5 h-5 text-[#E9A83A]" />;
      case 'prescription':
        return <Pill className="w-5 h-5 text-[#23866A]" />;
      case 'pharmacy':
        return <Building2 className="w-5 h-5 text-[#0B6875]" />;
      default:
        return <Bell className="w-5 h-5 text-[#708188]" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Notifications" />

      <ScreenContainer hasBottomNav={true}>
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-2">
          {['all', 'queue', 'appointment', 'prescription', 'pharmacy'].map((cat) => (
            <FilterChip
              key={cat}
              label={cat.charAt(0).toUpperCase() + cat.slice(1)}
              isSelected={filter === cat}
              onClick={() => setFilter(cat)}
            />
          ))}
        </div>

        {/* Notifications List */}
        <PageState
          isLoading={isLoading}
          isError={isError}
          isEmpty={filtered.length === 0}
          errorProps={{ onRetry: refetch }}
          emptyProps={{
            title: 'No Notifications',
            description: 'You have no notifications in this category.',
          }}
        >
          <div className="space-y-3">
            {filtered.map((n) => (
              <AppCard
                key={n.id}
                variant="interactive"
                onClick={() => n.actionUrl && nav.navigate(n.actionUrl)}
                className={`border-l-4 ${n.priority === 'high' ? 'border-l-[#C94B4B]' : 'border-l-[#0B6875]'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-[12px] bg-[#F7F9F8] shrink-0">
                    {getCategoryIcon(n.category)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold text-[#16343C]">{n.title}</h2>
                      <span className="text-[10px] text-[#708188]">{n.timestamp}</span>
                    </div>

                    <p className="text-xs text-[#708188] mt-0.5 leading-relaxed">{n.body}</p>

                    {n.actionUrl && (
                      <div className="mt-2 text-[11px] font-bold text-[#0B6875] flex items-center gap-0.5">
                        <span>View Details</span> <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        </PageState>
      </ScreenContainer>
    </div>
  );
};
