import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Testes from "./pages/Testes";
import TesteDetalhe from "./pages/TesteDetalhe";
import Empresas from "./pages/Empresas";
import Profissionais from "./pages/Profissionais";
import Planos from "./pages/Planos";
import Sobre from "./pages/Sobre";
import NR1 from "./pages/NR1";
import Contato from "./pages/Contato";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Relatorio from "./pages/Relatorio";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTestes from "./pages/admin/AdminTestes";
import AdminPerguntas from "./pages/admin/AdminPerguntas";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConfig from "./pages/admin/AdminConfig";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminNotificacoes from "./pages/admin/AdminNotificacoes";
import AdminMapso from "./pages/admin/AdminMapso";
import MapsoApp from "./modules/mapso/MapsoApp";
import DiscApp from "./modules/disc/DiscApp";
import MbtiApp from "./modules/mbti/MbtiApp";
import TemperamentoApp from "./modules/temperamento/TemperamentoApp";
import EneagramaApp from "./modules/eneagrama/EneagramaApp";
import DashboardEmpresa from "./pages/dashboard/DashboardEmpresa";
import DashboardEmpresaMapso from "./pages/dashboard/DashboardEmpresaMapso";
import DashboardProfissional from "./pages/dashboard/DashboardProfissional";
import DashboardUsuario from "./pages/dashboard/DashboardUsuario";
import ProtectedRoute from "./pages/dashboard/ProtectedRoute";
import EmployeeRespondFlow from "./modules/mapso/components/EmployeeRespondFlow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/testes" element={<Testes />} />
              <Route path="/testes/:id" element={<TesteDetalhe />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/profissionais" element={<Profissionais />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/nr1" element={<NR1 />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/relatorio/:id" element={<Relatorio />} />
              <Route path="/mapso/respond/:token" element={<EmployeeRespondFlow />} />
              <Route path="/mapso/*" element={<MapsoApp />} />
              <Route path="/testes/disc/aplicar" element={<DiscApp />} />
              <Route path="/testes/mbti/aplicar" element={<MbtiApp />} />
              <Route path="/testes/temperamento/aplicar" element={<TemperamentoApp />} />
              <Route path="/testes/eneagrama/aplicar" element={<EneagramaApp />} />
              <Route path="/dashboard/empresa" element={
                <ProtectedRoute allowedRoles={["company", "admin"]}>
                  <DashboardEmpresa />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/empresa/mapso" element={
                <ProtectedRoute allowedRoles={["company", "admin"]}>
                  <DashboardEmpresaMapso />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/profissional" element={
                <ProtectedRoute allowedRoles={["professional", "admin"]}>
                  <DashboardProfissional />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/usuario" element={
                <ProtectedRoute allowedRoles={["user", "admin"]}>
                  <DashboardUsuario />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="mapso" element={<AdminMapso />} />
                <Route path="testes" element={<AdminTestes />} />
                <Route path="perguntas" element={<AdminPerguntas />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
                <Route path="auditoria" element={<AdminAuditLogs />} />
                <Route path="notificacoes" element={<AdminNotificacoes />} />
                <Route path="config" element={<AdminConfig />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
