import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';
import LandingPage from '@/pages/LandingPage';
import AuthPage from '@/pages/AuthPage';
import PatientDashboard from '@/pages/PatientDashboard';
import ChatbotPage from '@/pages/ChatbotPage';
import DoctorDashboard from '@/pages/DoctorDashboard';
import SummaryView from '@/pages/SummaryView';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute role="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/chat/:appointmentId"
              element={
                <ProtectedRoute role="patient">
                  <ChatbotPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute role="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/summary/:summaryId"
              element={
                <ProtectedRoute role="doctor">
                  <SummaryView />
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
