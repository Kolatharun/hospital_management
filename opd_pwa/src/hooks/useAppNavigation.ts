import { useNavigate } from 'react-router-dom';

export const useAppNavigation = () => {
  const navigate = useNavigate();

  return {
    navigate,
    goHome: () => navigate('/home'),
    goBack: () => navigate(-1),
    goToLogin: () => navigate('/login'),
    goToVerifyOtp: () => navigate('/verify-otp'),
    goToCreateProfile: () => navigate('/create-profile'),
    goToDoctorDetails: (id: string) => navigate(`/doctors/${id}`),
    goToBookDoctor: (id: string) => navigate(`/doctors/${id}/book`),
    goToAppointmentDetails: (id: string) => navigate(`/appointments/${id}`),
    goToCheckIn: (id: string) => navigate(`/appointments/${id}/check-in`),
    goToQueueTrack: (id: string) => navigate(`/queue/${id}`),
    goToTokenCalled: (id: string) => navigate(`/queue/${id}/called`),
    goToPrescription: (id: string) => navigate(`/prescriptions/${id}`),
    goToDocument: (id: string) => navigate(`/documents/${id}`),
    goToNotifications: () => navigate('/notifications'),
    goToProfile: () => navigate('/profile'),
    goToSupport: () => navigate('/support'),
    goToCareCircle: () => navigate('/care-circle'),
    goToPatientJourney: (memberId?: string) => navigate(memberId ? `/patient-journey/${memberId}` : '/care-circle'),
  };
};
