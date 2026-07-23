import React from 'react';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { PhoneCall, Clock, AlertTriangle, ChevronRight, MessageSquare } from 'lucide-react';

export const HelpSupport: React.FC = () => {
  const nav = useAppNavigation();

  const faqs = [
    { q: 'How do I check in for my doctor appointment?', a: 'Open your appointment card on the Home dashboard when you arrive at Balaji Heart Center OPD and click "Clinic Check-In Now".' },
    { q: 'What if I miss my token call?', a: 'Go to your live queue screen and click "Request Turn Recovery". The reception desk will re-enter your turn after 1 patient.' },
    { q: 'How do I send my prescription to the pharmacy?', a: 'Open your active prescription and tap "Send to Connected Pharmacy" to order pickup or home delivery.' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Help & Clinic Support" />

      <ScreenContainer hasBottomNav={true}>
        <div className="space-y-4">
          {/* Emergency Warning Banner */}
          <div className="bg-[#C94B4B]/10 border border-[#C94B4B]/30 rounded-[14px] p-3 text-xs text-[#C94B4B] flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Medical Emergency Notice</p>
              <p className="text-[11px] text-[#16343C] mt-0.5">
                For chest pain or acute cardiac emergencies, please visit the Emergency Department directly or call 108. Do not use OPD booking for emergencies.
              </p>
            </div>
          </div>

          {/* Quick Clinic Contact */}
          <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white">
            <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider mb-3">Clinic OPD Helpline</h2>
            <div className="space-y-2.5 text-xs">
              <a
                href="tel:+912225001122"
                className="flex items-center gap-3 p-3 bg-white rounded-[12px] border border-[#DCE6E7] hover:border-[#0B6875]"
              >
                <PhoneCall className="w-5 h-5 text-[#0B6875]" />
                <div>
                  <p className="font-bold text-[#16343C]">+91 22 2500 1122</p>
                  <p className="text-[10px] text-[#708188]">Main OPD Reception & Registration</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 bg-white rounded-[12px] border border-[#DCE6E7]">
                <Clock className="w-5 h-5 text-[#0B6875]" />
                <div>
                  <p className="font-bold text-[#16343C]">OPD Timings</p>
                  <p className="text-[10px] text-[#708188]">Mon – Sat: 08:30 AM – 08:00 PM</p>
                </div>
              </div>
            </div>
          </AppCard>

          {/* Report Technical / App Issue */}
          <AppCard variant="interactive" onClick={() => nav.navigate('/support/report-issue')} className="flex items-center justify-between bg-[#0B6875] text-white">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#DFF3F5]" />
              <div>
                <p className="text-xs font-bold text-white">Report an Issue or Feedback</p>
                <p className="text-[11px] text-[#DFF3F5]">Submit ticket to clinic admin</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white" />
          </AppCard>

          {/* FAQs */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider px-1">Frequently Asked Questions</h2>
            {faqs.map((faq, i) => (
              <AppCard key={i} className="space-y-1">
                <p className="text-xs font-bold text-[#16343C]">{faq.q}</p>
                <p className="text-xs text-[#708188] leading-relaxed">{faq.a}</p>
              </AppCard>
            ))}
          </div>

          <div className="text-center pt-4 text-[11px] text-[#708188]">
            Balaji Heart Center Patient PWA • Version 1.0.0 (Production Frontend)
          </div>
        </div>
      </ScreenContainer>
    </div>
  );
};
