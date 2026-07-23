import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Pill,
  LayoutDashboard,
  ClipboardList,
  CheckCircle2,
  Package,
  History,
  Search,
  Bell,
  Volume2,
  VolumeX,
  Wifi,
  ChevronLeft,
  ChevronRight,
  User,
  ShieldCheck,
  LogOut,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { usePharmacyStore } from '../../store/usePharmacyStore';
import { pharmacyService } from '../../services/pharmacyService';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { PrescriptionDetailDrawer } from '../modals/PrescriptionDetailDrawer';
import { HandoverModal } from '../modals/HandoverModal';
import { PrintLabelModal } from '../modals/PrintLabelModal';
import { StockAdjustModal } from '../modals/StockAdjustModal';

export const PharmacyAppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isSidebarCollapsed,
    toggleSidebar,
    searchQuery,
    setSearchQuery,
    audioAlertsEnabled,
    toggleAudioAlerts,
    connectionStatus,
    pharmacist,
    notificationCount,
    clearNotifications,
  } = usePharmacyStore();

  const navItems = [
    {
      title: 'Queue Dashboard',
      subtitle: 'PH-01 Live Queue',
      path: '/pharmacy',
      icon: LayoutDashboard,
      badge: 2, // Pending count
      badgeVariant: 'pending' as const,
    },
    {
      title: 'Ready for Pickup',
      subtitle: 'PH-04 Handover Station',
      path: '/pharmacy/ready',
      icon: CheckCircle2,
      badge: 1, // Ready count
      badgeVariant: 'ready' as const,
    },
    {
      title: 'Medicine Stock',
      subtitle: 'PH-05 Inventory & Batches',
      path: '/pharmacy/stock',
      icon: Package,
      badge: 2, // Low stock count
      badgeVariant: 'destructive' as const,
    },
    {
      title: 'Dispensing History',
      subtitle: 'PH-06 Audit Trail',
      path: '/pharmacy/history',
      icon: History,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-900 font-sans">
      {/* FIXED LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-xl ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-900/50 shrink-0">
              <Pill className="h-6 w-6 text-slate-950" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-sm text-slate-100 tracking-wide">
                  BALAJI HEART CENTER
                </span>
                <span className="text-[11px] font-medium text-teal-400 flex items-center gap-1">
                  OPD Pharmacy Desktop <Sparkles className="h-3 w-3 inline" />
                </span>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Shift Badge & Counter Notice */}
        {!isSidebarCollapsed && (
          <div className="m-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium text-emerald-300">{pharmacist.shift} Shift Active</span>
            </div>
            <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
              {pharmacist.counter_number.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.path === '/pharmacy'
                ? location.pathname === '/pharmacy' || location.pathname.startsWith('/pharmacy/requests')
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/pharmacy'}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-900/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-teal-400 group-hover:text-teal-300'}`} />
                  {!isSidebarCollapsed && (
                    <div className="flex flex-col truncate">
                      <span className="truncate">{item.title}</span>
                      <span className="text-[10px] opacity-75 font-normal truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  )}
                </div>
                {!isSidebarCollapsed && item.badge !== undefined && (
                  <Badge variant={item.badgeVariant} className="ml-2 font-mono text-[11px] px-2 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer / Pharmacist Quick Details */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <Avatar className="h-9 w-9 border border-teal-500/30">
              <AvatarFallback className="bg-teal-800 text-teal-100 font-bold text-xs">
                RP
              </AvatarFallback>
            </Avatar>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate text-xs">
                <span className="font-semibold text-slate-100 truncate">{pharmacist.full_name}</span>
                <span className="text-[10px] text-slate-400 truncate">{pharmacist.license_number}</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        }`}
      >
        {/* STICKY TOP HEADER */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs">
          {/* Left: Global Search Bar */}
          <div className="flex items-center space-x-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Global Search by Patient Name, MRN (BHC-...), Token #, or Medicine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9 bg-slate-100/70 border-slate-200 focus:bg-white text-sm rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Realtime Socket Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium border border-slate-200 text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Wifi className="h-3.5 w-3.5 text-teal-600" />
              <span>Realtime Live</span>
            </div>

            {/* Audio Alert Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudioAlerts}
              title={audioAlertsEnabled ? 'Audio Alerts Enabled' : 'Audio Alerts Muted'}
              className="text-slate-600 hover:text-slate-900"
            >
              {audioAlertsEnabled ? (
                <Volume2 className="h-5 w-5 text-teal-600" />
              ) : (
                <VolumeX className="h-5 w-5 text-slate-400" />
              )}
            </Button>

            {/* Notification Bell with Popover */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-2">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
                  <span className="font-semibold text-sm">Pharmacy Alerts</span>
                  <button
                    onClick={clearNotifications}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2 py-2 text-xs">
                  <div className="p-2 bg-rose-50 rounded border border-rose-100 flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-900">STAT Request #104</p>
                      <p className="text-rose-700 text-[11px]">Rajesh Kumar Verma - High Priority</p>
                    </div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded border border-amber-100 flex items-start space-x-2">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">Low Stock Alert</p>
                      <p className="text-amber-700 text-[11px]">Tab. Atorvastatin 20mg (8 units left)</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pharmacist Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                  <Avatar className="h-8 w-8 border border-slate-200">
                    <AvatarFallback className="bg-slate-800 text-white text-xs font-bold">
                      RP
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800">
                      {pharmacist.full_name.split(',')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500">Senior Pharmacist</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-bold">{pharmacist.full_name}</span>
                    <span className="text-xs text-slate-500 font-normal">
                      License: {pharmacist.license_number}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">
                  <ShieldCheck className="h-4 w-4 mr-2 text-teal-600" />
                  {pharmacist.counter_number}
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs">
                  <User className="h-4 w-4 mr-2 text-slate-600" />
                  Shift: {pharmacist.shift} (08:00 AM - 04:00 PM)
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-xs text-amber-700 font-medium"
                  onClick={() => {
                    pharmacyService.resetDemoData();
                    toast.success('Reset OPD Pharmacy demo data to default initial state!');
                    window.location.reload();
                  }}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Demo Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-rose-600 font-medium">
                  <LogOut className="h-4 w-4 mr-2" />
                  End Shift / Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* GLOBAL MODALS & DRAWERS */}
      <PrescriptionDetailDrawer />
      <HandoverModal />
      <PrintLabelModal />
      <StockAdjustModal />
    </div>
  );
};
export default PharmacyAppShell;
