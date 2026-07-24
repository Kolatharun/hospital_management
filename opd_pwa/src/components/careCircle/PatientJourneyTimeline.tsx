import React, { useState } from 'react';
import { JourneyEvent, EventCategory } from '../../types';
import { Calendar, Pill, FileText, HeartPulse, Hospital, ExternalLink, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PatientJourneyTimelineProps {
  events: JourneyEvent[];
  patientName: string;
}

export const PatientJourneyTimeline: React.FC<PatientJourneyTimelineProps> = ({ events, patientName }) => {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | 'all'>('all');

  const filteredEvents = selectedCategory === 'all'
    ? events
    : events.filter((e) => e.category === selectedCategory);

  const getCategoryIcon = (category: EventCategory) => {
    switch (category) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-[#0B6875]" />;
      case 'prescription':
        return <Pill className="w-4 h-4 text-[#7B1FA2]" />;
      case 'lab_report':
        return <FileText className="w-4 h-4 text-[#1565C0]" />;
      case 'vital':
        return <HeartPulse className="w-4 h-4 text-[#C94B4B]" />;
      case 'admission':
        return <Hospital className="w-4 h-4 text-[#E9A83A]" />;
    }
  };

  const getCategoryBadgeClass = (category: EventCategory) => {
    switch (category) {
      case 'appointment':
        return 'bg-[#DFF3F5] text-[#0B6875]';
      case 'prescription':
        return 'bg-[#F3E5F5] text-[#7B1FA2]';
      case 'lab_report':
        return 'bg-[#E3F2FD] text-[#1565C0]';
      case 'vital':
        return 'bg-[#FFEBEE] text-[#C94B4B]';
      case 'admission':
        return 'bg-[#FFF8E1] text-[#B78103]';
    }
  };

  const filterOptions: Array<{ key: EventCategory | 'all'; label: string }> = [
    { key: 'all', label: 'All Events' },
    { key: 'appointment', label: 'Appointments' },
    { key: 'prescription', label: 'Prescriptions' },
    { key: 'lab_report', label: 'Lab Reports' },
    { key: 'vital', label: 'Vitals & Checkups' },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#708188] shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </div>
        {filterOptions.map((opt) => {
          const isActive = selectedCategory === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedCategory(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                isActive
                  ? 'bg-[#0B6875] text-white border-[#0B6875] shadow-xs'
                  : 'bg-[#F7F9F8] text-[#708188] border-[#DCE6E7] hover:bg-[#EAEFEF] hover:text-[#16343C]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-[#DCE6E7] text-center flex flex-col items-center justify-center text-[#708188]">
          <Calendar className="w-10 h-10 mb-2 opacity-40 text-[#0B6875]" />
          <p className="text-sm font-bold text-[#16343C]">No timeline records found</p>
          <p className="text-xs mt-1">No events match the selected category filter for {patientName}.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-[#DCE6E7] space-y-6 my-2">
          {filteredEvents.map((event) => (
            <div key={event.id} className="relative group">
              {/* Node Bullet Icon */}
              <div className="absolute -left-[35px] top-1.5 w-7 h-7 rounded-full bg-white border-2 border-[#0B6875] flex items-center justify-center shadow-xs">
                {getCategoryIcon(event.category)}
              </div>

              {/* Event Content Card */}
              <div className="bg-white rounded-2xl p-4 border border-[#DCE6E7] shadow-[0px_2px_8px_rgba(22,52,60,0.04)] hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getCategoryBadgeClass(event.category)}`}>
                        {event.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[#708188] font-medium">{event.date} {event.time ? `• ${event.time}` : ''}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#16343C] mt-1">{event.title}</h4>
                    <p className="text-xs font-semibold text-[#0B6875]">{event.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs text-[#3F484A] leading-relaxed">{event.summary}</p>

                {/* Key Metrics grid if present */}
                {event.keyMetrics && event.keyMetrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 bg-[#F7F9F8] p-3 rounded-xl border border-[#DCE6E7]/80">
                    {event.keyMetrics.map((m, idx) => (
                      <div key={idx} className="flex flex-col">
                        <span className="text-[10px] text-[#708188] font-bold uppercase tracking-wider">{m.label}</span>
                        <span className="text-xs font-bold text-[#16343C]">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Quick Action Link */}
                {event.actionLabel && event.actionUrl && (
                  <div className="pt-2 border-t border-[#DCE6E7] flex justify-end">
                    <Link
                      to={event.actionUrl}
                      className="text-xs font-bold text-[#0B6875] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{event.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
