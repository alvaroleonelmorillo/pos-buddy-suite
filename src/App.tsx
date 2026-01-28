import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import POSLayout from "@/layouts/POSLayout";
import Auth from "@/pages/Auth";
import Ventas from "@/pages/Ventas";
import Productos from "@/pages/Productos";
import Creditos from "@/pages/Creditos";
import Inventario from "@/pages/Inventario";
import Reportes from "@/pages/Reportes";
import Configuracion from "@/pages/Configuracion";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Auth route */}
            <Route path="/auth" element={<Auth />} />

            {/* POS routes with layout */}
            <Route element={<POSLayout />}>
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/creditos" element={<Creditos />} />
              <Route path="/inventario" element={<Inventario />} />
              <Route path="/reportes" element={<Reportes />} />
              <Route path="/configuracion" element={<Configuracion />} />
            </Route>

            {/* Redirect root to ventas */}
            <Route path="/" element={<Navigate to="/ventas" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
