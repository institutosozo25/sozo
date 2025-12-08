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
import Auth from "./pages/Auth";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminTestes from "./pages/admin/AdminTestes";
import AdminPerguntas from "./pages/admin/AdminPerguntas";
import AdminRelatorios from "./pages/admin/AdminRelatorios";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminConfig from "./pages/admin/AdminConfig";
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
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="testes" element={<AdminTestes />} />
                <Route path="perguntas" element={<AdminPerguntas />} />
                <Route path="relatorios" element={<AdminRelatorios />} />
                <Route path="usuarios" element={<AdminUsuarios />} />
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
