import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import RunsPage from "./pages/RunsPage";
import TemplatesPage from "./pages/TemplatesPage";
import AuditPage from "./pages/AuditPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage"; // Import RegisterPage
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ValidationPage from "./pages/ValidationPage";
import MappingPage from "./pages/MappingPage";
import ExportPage from "./pages/ExportPage";
import TemplateDetailPage from "./pages/TemplateDetailPage";
import { RunProvider } from "./context/RunContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RunProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} /> {/* New Register Route */}
              
              {/* Protected Routes - require authentication */}
              <Route path="/" element={<ProtectedRoute><MainLayout><Index /></MainLayout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><MainLayout><DashboardPage /></MainLayout></ProtectedRoute>} />
              <Route path="/runs" element={<ProtectedRoute><MainLayout><RunsPage /></MainLayout></ProtectedRoute>} />
              <Route path="/map" element={<ProtectedRoute><MainLayout><MappingPage /></MainLayout></ProtectedRoute>} />
              <Route path="/validation" element={<ProtectedRoute><MainLayout><ValidationPage /></MainLayout></ProtectedRoute>} />
              <Route path="/export" element={<ProtectedRoute><MainLayout><ExportPage /></MainLayout></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><MainLayout><TemplatesPage /></MainLayout></ProtectedRoute>} />
              <Route path="/templates/:templateId" element={<ProtectedRoute><MainLayout><TemplateDetailPage /></MainLayout></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute><MainLayout><AuditPage /></MainLayout></ProtectedRoute>} />
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RunProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;