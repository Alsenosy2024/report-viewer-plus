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
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SidebarProvider } from "@/components/ui/sidebar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
