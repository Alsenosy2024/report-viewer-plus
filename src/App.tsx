import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ContentIdeas from "./pages/ContentIdeas";
import MeetingSummary from "./pages/MeetingSummary";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ConvAINavigator } from "@/components/ConvAINavigator";
import { AgentNavigationListener } from "@/components/AgentNavigationListener";
import { VoiceAssistantProvider } from "@/contexts/VoiceAssistantContext";
import { VoiceAssistantWidget } from "@/components/voice/VoiceAssistantWidget";

const queryClient = new QueryClient();

const App = () => {
  // LiveKit Agent Navigation - Enable voice agent to navigate website
  // Set enabled=true and provide LiveKit credentials to activate
  const enableAgentNavigation = import.meta.env.VITE_ENABLE_AGENT_NAVIGATION === 'true';
  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL;
  const livekitToken = import.meta.env.VITE_LIVEKIT_TOKEN;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <VoiceAssistantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SidebarProvider className="flex-col">
                <ConvAINavigator />
                <AgentNavigationListener
                  enabled={enableAgentNavigation}
                  livekitUrl={livekitUrl}
                  livekitToken={livekitToken}
                />
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
              <Route path="/content-ideas" element={
                <ProtectedRoute>
                  <ContentIdeas />
                </ProtectedRoute>
              } />
              <Route path="/meeting-summary" element={
                <ProtectedRoute>
                  <MeetingSummary />
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
            </SidebarProvider>

            {/* LiveKit Voice Assistant Widget */}
            <VoiceAssistantWidget />
          </BrowserRouter>
        </TooltipProvider>
      </VoiceAssistantProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
