import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageContainer } from '@/components/layout/PageContainer';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { PatientRegistration } from '@/components/frontoffice/PatientRegistration';
import { AppointmentQueue } from '@/components/frontoffice/AppointmentQueue';
import { PatientSearch } from '@/components/frontoffice/PatientSearch';
import { BillingSection } from '@/components/frontoffice/BillingSection';
import { VitalsCollection } from '@/components/frontoffice/VitalsCollection';
import { DocumentUpload } from '@/components/frontoffice/DocumentUpload';
import { BillsList } from '@/components/frontoffice/BillsList';
import { DayPayments } from '@/components/frontoffice/DayPayments';
import { Patient } from '@/contexts/ClinicDataContext';

import { ClipboardList, Users, Search, IndianRupee, Activity, Tv, FileText, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Interface for patient data passed from registration to billing
export interface RegistrationToBillingData {
  patient: Patient;
  doctorId: string;
  doctorName: string;
}

const tabs = [
  {
    id: 'registration',
    label: 'OP Registration',
    icon: <ClipboardList className="w-4 h-4" />,
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: <IndianRupee className="w-4 h-4" />,
  },
  {
    id: 'vitals',
    label: 'Vitals Collection',
    icon: <Activity className="w-4 h-4" />,
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: 'queue',
    label: 'Main Queue',
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: 'bills',
    label: 'Bills',
    icon: <Receipt className="w-4 h-4" />,
  },
  {
    id: 'day-payments',
    label: 'Day Payments',
    icon: <Wallet className="w-4 h-4" />,
  },
  {
    id: 'search',
    label: 'Patient Search',
    icon: <Search className="w-4 h-4" />,
  },
];

export default function FrontOfficeDashboard() {
  const [activeTab, setActiveTab] = useState('registration');
  // State to hold patient data when redirecting from registration to billing
  const [pendingBillingPatient, setPendingBillingPatient] = useState<RegistrationToBillingData | null>(null);

  // Callback for PatientRegistration to redirect to billing with patient data
  const handleRegistrationComplete = useCallback((data: RegistrationToBillingData) => {
    setPendingBillingPatient(data);
    setActiveTab('billing');
  }, []);

  // Callback for BillingSection to clear the pending patient after billing is done
  const handleBillingComplete = useCallback(() => {
    setPendingBillingPatient(null);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'registration':
        return <PatientRegistration onRegistrationComplete={handleRegistrationComplete} />;
      case 'billing':
        return (
          <BillingSection
            pendingPatient={pendingBillingPatient}
            onBillingComplete={handleBillingComplete}
          />
        );
      case 'vitals':
        return <VitalsCollection />;
      case 'documents':
        return <DocumentUpload />;
      case 'queue':
        return <AppointmentQueue />;
      case 'bills':
        return <BillsList />;
      case 'day-payments':
        return <DayPayments />;
      case 'search':
        return <PatientSearch />;
      default:
        return null;
    }
  };

  const tvDisplayButton = (
    <Link to="/tv-display" target="_blank">
      <Button className="gap-2 animate-blink-tv font-bold text-lg px-6 py-2">
        <Tv className="w-5 h-5" />
        TV Display
      </Button>
    </Link>
  );

  return (
    <>
      <Header />
      <PageContainer
        title="OP Dashboard"
        description="Manage patient registration, appointments, and queue"
        actions={tvDisplayButton}
      >
        <div className="space-y-6">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="animate-fade-in">{renderTabContent()}</div>
        </div>
      </PageContainer>
    </>
  );
}
