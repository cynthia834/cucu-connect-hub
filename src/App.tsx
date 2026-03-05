import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Ministries from "./pages/Ministries";
import Programs from "./pages/Programs";
import ServiceUpdates from "./pages/ServiceUpdates";
import Testimonies from "./pages/Testimonies";
import PrayerRequests from "./pages/PrayerRequests";
import Giving from "./pages/Giving";
import Welfare from "./pages/Welfare";
import Missions from "./pages/Missions";
import Finance from "./pages/Finance";
import Assets from "./pages/Assets";
import ICT from "./pages/ICT";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import SubcomDetail from "./pages/SubcomDetail";
import ResetPassword from "./pages/ResetPassword";
import CBRReading from "./pages/CBRReading";
import Certificates from "./pages/Certificates";
import ContactSupport from "./pages/ContactSupport";

const queryClient = new QueryClient();

function AppInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore(s => s.initialize);
  useEffect(() => { initialize(); }, [initialize]);
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppInitializer>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/ministries" element={<Ministries />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/service-updates" element={<ServiceUpdates />} />
              <Route path="/testimonies" element={<Testimonies />} />
              <Route path="/prayer-requests" element={<PrayerRequests />} />
              <Route path="/giving" element={<Giving />} />
              <Route path="/welfare" element={<Welfare />} />
              <Route path="/missions" element={<Missions />} />
              <Route path="/finance" element={<ProtectedRoute requiredRoles={['super_admin','cu_chairperson','finance_leader','finance_subcommittee']}><Finance /></ProtectedRoute>} />
              <Route path="/assets" element={<ProtectedRoute requiredRoles={['super_admin','cu_chairperson','assets_leader','assets_subcommittee']}><Assets /></ProtectedRoute>} />
              <Route path="/ict" element={<ProtectedRoute requiredRoles={['super_admin','cu_chairperson','ict_leader']}><ICT /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute requiredRoles={['super_admin','cu_chairperson']}><Reports /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRoles={['super_admin','cu_chairperson']}><Admin /></ProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/subcoms/:id" element={<SubcomDetail />} />
              <Route path="/cbr-reading" element={<CBRReading />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/contact-support" element={<ContactSupport />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppInitializer>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
