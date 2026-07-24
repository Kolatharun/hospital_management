import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { AppShell } from '../components/layout/AppShell';
import { AuthShell } from '../components/layout/AuthShell';

import { Login } from '../pages/auth/Login';
import { VerifyOTP } from '../pages/auth/VerifyOTP';
import { CreateProfile } from '../pages/onboarding/CreateProfile';
import { ProfileCreated } from '../pages/onboarding/ProfileCreated';

import { Home } from '../pages/home/Home';
import { FindDoctor } from '../pages/doctors/FindDoctor';
import { DoctorDetails } from '../pages/doctors/DoctorDetails';
import { BookDoctor } from '../pages/doctors/BookDoctor';

import { MyAppointments } from '../pages/appointments/MyAppointments';
import { AppointmentDetails } from '../pages/appointments/AppointmentDetails';
import { RescheduleAppointment } from '../pages/appointments/RescheduleAppointment';

import { ClinicCheckIn } from '../pages/queue/ClinicCheckIn';
import { LiveQueue } from '../pages/queue/LiveQueue';
import { TokenCalled } from '../pages/queue/TokenCalled';
import { MissedToken } from '../pages/queue/MissedToken';

import { MedicalRecords } from '../pages/records/MedicalRecords';
import { VisitDetails } from '../pages/records/VisitDetails';
import { LabReports } from '../pages/records/LabReports';
import { LabReportDetails } from '../pages/records/LabReportDetails';

import { PrescriptionDetails } from '../pages/prescriptions/PrescriptionDetails';
import { SendToPharmacy } from '../pages/pharmacy/SendToPharmacy';
import { PharmacyRequestStatus } from '../pages/pharmacy/PharmacyRequestStatus';

import { DocumentViewer } from '../pages/documents/DocumentViewer';
import { Notifications } from '../pages/notifications/Notifications';

import { Profile } from '../pages/profile/Profile';
import { EditProfile } from '../pages/profile/EditProfile';
import { ChangeMobile } from '../pages/profile/ChangeMobile';
import { NotificationPreferences } from '../pages/profile/NotificationPreferences';

import { HelpSupport } from '../pages/support/HelpSupport';
import { ReportIssue } from '../pages/support/ReportIssue';

import { CareCirclePage } from '../pages/careCircle/CareCirclePage';
import { PatientJourneyPage } from '../pages/careCircle/PatientJourneyPage';

import { OfflinePage } from '../pages/system/OfflinePage';
import { SessionExpired } from '../pages/system/SessionExpired';
import { NotFound } from '../pages/system/NotFound';

// Route Protection HOCs
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isProfileRequired } = useAuth();
  if (!isAuthenticated) {
    if (isProfileRequired) return <Navigate to="/create-profile" replace />;
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
};

const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isProfileRequired, isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    element: <AuthShell />,
    children: [
      {
        path: '/login',
        element: (
          <PublicRoute>
            <Login />
          </PublicRoute>
        ),
      },
      {
        path: '/verify-otp',
        element: <VerifyOTP />,
      },
      {
        path: '/create-profile',
        element: (
          <OnboardingRoute>
            <CreateProfile />
          </OnboardingRoute>
        ),
      },
      {
        path: '/profile-created',
        element: <ProfileCreated />,
      },
    ],
  },
  {
    element: <AppShell />,
    children: [
      {
        path: '/',
        element: <Navigate to="/home" replace />,
      },
      {
        path: '/home',
        element: (
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctors',
        element: (
          <ProtectedRoute>
            <FindDoctor />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctors/:doctorId',
        element: (
          <ProtectedRoute>
            <DoctorDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/doctors/:doctorId/book',
        element: (
          <ProtectedRoute>
            <BookDoctor />
          </ProtectedRoute>
        ),
      },
      {
        path: '/appointments',
        element: (
          <ProtectedRoute>
            <MyAppointments />
          </ProtectedRoute>
        ),
      },
      {
        path: '/appointments/:appointmentId',
        element: (
          <ProtectedRoute>
            <AppointmentDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/appointments/:appointmentId/reschedule',
        element: (
          <ProtectedRoute>
            <RescheduleAppointment />
          </ProtectedRoute>
        ),
      },
      {
        path: '/appointments/:appointmentId/check-in',
        element: (
          <ProtectedRoute>
            <ClinicCheckIn />
          </ProtectedRoute>
        ),
      },
      {
        path: '/queue/:appointmentId',
        element: (
          <ProtectedRoute>
            <LiveQueue />
          </ProtectedRoute>
        ),
      },
      {
        path: '/queue/:appointmentId/called',
        element: (
          <ProtectedRoute>
            <TokenCalled />
          </ProtectedRoute>
        ),
      },
      {
        path: '/queue/:appointmentId/missed',
        element: (
          <ProtectedRoute>
            <MissedToken />
          </ProtectedRoute>
        ),
      },
      {
        path: '/records',
        element: (
          <ProtectedRoute>
            <MedicalRecords />
          </ProtectedRoute>
        ),
      },
      {
        path: '/records/visits/:visitId',
        element: (
          <ProtectedRoute>
            <VisitDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/records/labs',
        element: (
          <ProtectedRoute>
            <LabReports />
          </ProtectedRoute>
        ),
      },
      {
        path: '/records/labs/:reportId',
        element: (
          <ProtectedRoute>
            <LabReportDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/prescriptions/:prescriptionId',
        element: (
          <ProtectedRoute>
            <PrescriptionDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/prescriptions/:prescriptionId/pharmacy',
        element: (
          <ProtectedRoute>
            <SendToPharmacy />
          </ProtectedRoute>
        ),
      },
      {
        path: '/pharmacy/requests/:requestId',
        element: (
          <ProtectedRoute>
            <PharmacyRequestStatus />
          </ProtectedRoute>
        ),
      },
      {
        path: '/documents/:documentId',
        element: (
          <ProtectedRoute>
            <DocumentViewer />
          </ProtectedRoute>
        ),
      },
      {
        path: '/notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/edit',
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/change-mobile',
        element: (
          <ProtectedRoute>
            <ChangeMobile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/profile/notifications',
        element: (
          <ProtectedRoute>
            <NotificationPreferences />
          </ProtectedRoute>
        ),
      },
      {
        path: '/support',
        element: (
          <ProtectedRoute>
            <HelpSupport />
          </ProtectedRoute>
        ),
      },
      {
        path: '/support/report-issue',
        element: (
          <ProtectedRoute>
            <ReportIssue />
          </ProtectedRoute>
        ),
      },
      {
        path: '/care-circle',
        element: (
          <ProtectedRoute>
            <CareCirclePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/care-circle/:memberId',
        element: (
          <ProtectedRoute>
            <PatientJourneyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/patient-journey/:memberId',
        element: (
          <ProtectedRoute>
            <PatientJourneyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/offline',
        element: <OfflinePage />,
      },
      {
        path: '/session-expired',
        element: <SessionExpired />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);
