import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import PharmacyAppShell from './components/shell/PharmacyAppShell';
import { PH01_QueueDashboard } from './pages/PH01_QueueDashboard';
import { PH02_PrescriptionReview } from './pages/PH02_PrescriptionReview';
import { PH03_MedicinePreparation } from './pages/PH03_MedicinePreparation';
import { PH04_ReadyPickup } from './pages/PH04_ReadyPickup';
import { PH05_MedicineStock } from './pages/PH05_MedicineStock';
import { PH06_DispensingHistory } from './pages/PH06_DispensingHistory';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/pharmacy" replace />} />
          <Route element={<PharmacyAppShell />}>
            <Route path="/pharmacy" element={<PH01_QueueDashboard />} />
            <Route path="/pharmacy/requests/:requestId/review" element={<PH02_PrescriptionReview />} />
            <Route path="/pharmacy/requests/:requestId/prepare" element={<PH03_MedicinePreparation />} />
            <Route path="/pharmacy/ready" element={<PH04_ReadyPickup />} />
            <Route path="/pharmacy/stock" element={<PH05_MedicineStock />} />
            <Route path="/pharmacy/history" element={<PH06_DispensingHistory />} />
          </Route>
          <Route path="*" element={<Navigate to="/pharmacy" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
