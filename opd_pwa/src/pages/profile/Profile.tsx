import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../store/uiStore';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PageHeader } from '../../components/layout/PageHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { Avatar } from '../../components/ui/Avatar';
import { BottomSheet } from '../../components/ui/BottomSheet';
import { maskPhoneNumber } from '../../utils/phone';
import { useAppNavigation } from '../../hooks/useAppNavigation';
import {
  User,
  Phone,
  Globe,
  Bell,
  Building2,
  HelpCircle,
  LogOut,
  ChevronRight,
  Download,
  Shield,
  Lock,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { patient, logout } = useAuth();
  const { language, setLanguage } = useUIStore();
  const { isInstallable, triggerInstall } = useInstallPrompt();
  const nav = useAppNavigation();

  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title="Patient Profile & Settings" showBack={false} />

      <ScreenContainer hasBottomNav={true}>
        {/* Profile Card */}
        <AppCard className="bg-gradient-to-b from-[#DFF3F5]/30 to-white text-center p-6 mb-4">
          <Avatar name={patient?.fullName || 'Rajesh K. Sharma'} size="large" className="mx-auto mb-3 w-16 h-16" />
          <h1 className="text-base font-extrabold text-[#16343C]">{patient?.fullName || 'Rajesh K. Sharma'}</h1>
          <p className="text-xs font-semibold text-[#0B6875] mt-0.5">
            MR Number: <span className="font-extrabold">{patient?.mrNumber || 'MR-2026-8842'}</span>
          </p>
          <p className="text-xs text-[#708188] mt-1 flex items-center justify-center gap-1">
            <Phone className="w-3.5 h-3.5 text-[#0B6875]" /> {maskPhoneNumber(patient?.mobile || '9876543210')}
          </p>
        </AppCard>

        {/* Account Settings List */}
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider px-1">Account & Preferences</h2>

          <AppCard variant="interactive" onClick={() => nav.navigate('/profile/edit')} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#DFF3F5] text-[#0B6875]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16343C]">Edit Personal Details</p>
                <p className="text-[11px] text-[#708188]">Name, city, address & emergency contact</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#708188]" />
          </AppCard>

          <AppCard variant="interactive" onClick={() => nav.navigate('/profile/change-mobile')} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#DFF3F5] text-[#0B6875]">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16343C]">Change Registered Mobile Number</p>
                <p className="text-[11px] text-[#708188]">Dual OTP verification process</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#708188]" />
          </AppCard>

          <AppCard variant="interactive" onClick={() => setShowLangSheet(true)} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#DFF3F5] text-[#0B6875]">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16343C]">App Display Language</p>
                <p className="text-[11px] text-[#708188] uppercase">{language === 'en' ? 'English' : language === 'hi' ? 'Hindi (हिंदी)' : 'Marathi (मराठी)'}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#708188]" />
          </AppCard>

          <AppCard variant="interactive" onClick={() => nav.navigate('/profile/notifications')} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#DFF3F5] text-[#0B6875]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16343C]">Notification Preferences</p>
                <p className="text-[11px] text-[#708188]">Queue alerts, reminders & quiet hours</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#708188]" />
          </AppCard>

          {isInstallable && (
            <AppCard variant="interactive" onClick={triggerInstall} className="flex items-center justify-between bg-[#DFF3F5]/40 border-[#0B6875]/30">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-[#0B6875] text-white">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#16343C]">Install Patient PWA App</p>
                  <p className="text-[11px] text-[#0B6875] font-medium">Add Balaji Heart Center to home screen</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#0B6875]" />
            </AppCard>
          )}
        </div>

        {/* Support & Logout */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-[#16343C] uppercase tracking-wider px-1">Support & Security</h2>

          <AppCard variant="interactive" onClick={nav.goToSupport} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-[12px] bg-[#708188]/10 text-[#708188]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#16343C]">Help & Support</p>
                <p className="text-[11px] text-[#708188]">OPD helpline & report issues</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#708188]" />
          </AppCard>

          <AppButton
            size="full-width"
            variant="outline"
            className="border-[#C94B4B]/30 text-[#C94B4B] hover:bg-[#C94B4B]/10 mt-4"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => setShowLogoutSheet(true)}
          >
            Logout Patient Session
          </AppButton>
        </div>
      </ScreenContainer>

      {/* Logout Sheet */}
      <BottomSheet isOpen={showLogoutSheet} onClose={() => setShowLogoutSheet(false)} title="Logout Confirmation">
        <div className="space-y-4 text-left">
          <p className="text-xs text-[#708188]">
            Are you sure you want to log out of Balaji Heart Center Patient Account? You will need your mobile OTP to log in again.
          </p>
          <div className="flex gap-2.5">
            <AppButton variant="outline" size="full-width" onClick={() => setShowLogoutSheet(false)}>
              Cancel
            </AppButton>
            <AppButton variant="destructive" size="full-width" onClick={logout}>
              Yes, Logout
            </AppButton>
          </div>
        </div>
      </BottomSheet>

      {/* Language Selection Sheet */}
      <BottomSheet isOpen={showLangSheet} onClose={() => setShowLangSheet(false)} title="Select Preferred Language">
        <div className="space-y-2 text-left">
          {[
            { code: 'en', name: 'English' },
            { code: 'hi', name: 'हिंदी (Hindi)' },
            { code: 'mr', name: 'मराठी (Marathi)' },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                setLanguage(l.code as any);
                setShowLangSheet(false);
              }}
              className={`w-full p-3 rounded-[12px] text-xs font-bold flex justify-between items-center ${language === l.code ? 'bg-[#0B6875] text-white' : 'bg-[#F7F9F8] text-[#16343C]'}`}
            >
              <span>{l.name}</span>
              {language === l.code && <span>✓</span>}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
