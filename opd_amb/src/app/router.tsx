import React, { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { EMSAppShell } from '@/features/ems/components/EMSAppShell'
import { AppLoadingScreen } from '@/components/shared/AppLoadingScreen'

const ShiftHomePage = lazy(() => import('@/features/ems/pages/ShiftHomePage').then(m => ({ default: m.ShiftHomePage })))
const IncomingMissionPage = lazy(() => import('@/features/ems/pages/IncomingMissionPage').then(m => ({ default: m.IncomingMissionPage })))
const MissionNavigationPage = lazy(() => import('@/features/ems/pages/MissionNavigationPage').then(m => ({ default: m.MissionNavigationPage })))
const SceneSafetyPage = lazy(() => import('@/features/ems/pages/SceneSafetyPage').then(m => ({ default: m.SceneSafetyPage })))
const PatientCarePage = lazy(() => import('@/features/ems/pages/PatientCarePage').then(m => ({ default: m.PatientCarePage })))
const HospitalTransportPage = lazy(() => import('@/features/ems/pages/HospitalTransportPage').then(m => ({ default: m.HospitalTransportPage })))
const HandoverPage = lazy(() => import('@/features/ems/pages/HandoverPage').then(m => ({ default: m.HandoverPage })))
const MissionCompletionPage = lazy(() => import('@/features/ems/pages/MissionCompletionPage').then(m => ({ default: m.MissionCompletionPage })))
const MissionHistoryPage = lazy(() => import('@/features/ems/pages/MissionHistoryPage').then(m => ({ default: m.MissionHistoryPage })))
const EMSProfilePage = lazy(() => import('@/features/ems/pages/EMSProfilePage').then(m => ({ default: m.EMSProfilePage })))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/ems" replace />,
  },
  {
    element: <EMSAppShell />,
    children: [
      {
        path: '/ems',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Duty Dashboard..." />}>
            <ShiftHomePage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/alert',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Dispatch Alert..." />}>
            <IncomingMissionPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading GPS Telematics..." />}>
            <MissionNavigationPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/scene',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Scene Protocols..." />}>
            <SceneSafetyPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/care',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Clinical Care Interface..." />}>
            <PatientCarePage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/transport',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Hospital Telemetry..." />}>
            <HospitalTransportPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/handover',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Handover Protocol..." />}>
            <HandoverPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/missions/:incidentId/complete',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Summary Logs..." />}>
            <MissionCompletionPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/history',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Run History..." />}>
            <MissionHistoryPage />
          </Suspense>
        ),
      },
      {
        path: '/ems/profile',
        element: (
          <Suspense fallback={<AppLoadingScreen message="Loading Responder Profile..." />}>
            <EMSProfilePage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/ems" replace />,
      },
    ],
  },
])
