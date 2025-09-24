import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WhatsAppReports from "./pages/WhatsAppReports";
import ProductivityReports from "./pages/ProductivityReports";
import AdsReports from "./pages/AdsReports";
import MailReports from "./pages/MailReports";
import NotFound from "./pages/NotFound";
import AdminSettings from "./pages/AdminSettings";
import AwaitingApproval from "./pages/AwaitingApproval";
import BotControls from "./pages/BotControls";
import SocialMediaPosts from "./pages/SocialMediaPosts";
import CoursesPrices from "./pages/CoursesPrices";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNavigationTools } from "@/hooks/useNavigationTools";
import { NavigationController } from "@/utils/NavigationController";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

// Component to handle navigation setup inside the router
const AppContent = () => {
  const navigate = useNavigate();
  const { clientTools } = useNavigationTools();

  // Delay widget load until client tools are available
  const [canLoadWidget, setCanLoadWidget] = useState(false);

  useEffect(() => {
    // Set the navigate function in NavigationController
    NavigationController.setNavigateFunction(navigate);
  }, [navigate]);

  useEffect(() => {
    const checkReady = () => {
      const ready =
        typeof window !== 'undefined' &&
        (window as any).__client_tools_registered__ === true;
      if (ready) {
        console.log('✅ ElevenLabs: client tools detected, enabling widget.');
        setCanLoadWidget(true);
      }
      return ready;
    };

    if (checkReady()) return;

    console.log('⏳ ElevenLabs: waiting for client tools to register...');
    const onReady = () => {
      console.log('✅ ElevenLabs: client-tools-ready event received.');
      setCanLoadWidget(true);
    };

    window.addEventListener('client-tools-ready', onReady as any, { once: true } as any);

    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval);
        window.removeEventListener('client-tools-ready', onReady as any);
      }
    }, 300);

    return () => {
      clearInterval(interval);
      window.removeEventListener('client-tools-ready', onReady as any);
    };
  }, []);

  return (
    <SidebarProvider className="flex-col">
      <SiteHeader />
      <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/awaiting-approval" element={
                <ProtectedRoute>
                  <AwaitingApproval />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/whatsapp-reports" element={
                <ProtectedRoute>
                  <WhatsAppReports />
                </ProtectedRoute>
              } />
              <Route path="/productivity-reports" element={
                <ProtectedRoute>
                  <ProductivityReports />
                </ProtectedRoute>
              } />
              <Route path="/ads-reports" element={
                <ProtectedRoute>
                  <AdsReports />
                </ProtectedRoute>
              } />
              <Route path="/mail-reports" element={
                <ProtectedRoute>
                  <MailReports />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              } />
              <Route path="/bots" element={
                <ProtectedRoute>
                  <BotControls />
                </ProtectedRoute>
              } />
              <Route path="/social-posts" element={
                <ProtectedRoute>
                  <SocialMediaPosts />
                </ProtectedRoute>
              } />
              <Route path="/courses-prices" element={
                <ProtectedRoute>
                  <CoursesPrices />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
      
      {/* ElevenLabs widget - load after navigation tools are registered */}
      {canLoadWidget && (
        <div 
          dangerouslySetInnerHTML={{ 
            __html: `
              <script src="https://elevenlabs.io/convai-widget/index.js" async></script>
              <elevenlabs-convai 
                agent-id="agent_2401k5v85f8beantem3febzmgj81"
              ></elevenlabs-convai>
            ` 
          }} 
        />
      )}
      </SidebarProvider>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
