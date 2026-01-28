import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Tickets from "./pages/Tickets";
import NewTicket from "./pages/NewTicket";
import PublicNewTicket from "./pages/PublicNewTicket";
import Admin from "./pages/Admin";
import TicketDetail from "./pages/TicketDetail";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import PublicTicketCreated from "./pages/publicTicketCreated";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* כל המערכת נעולה */}
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

          <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path="/tickets/new" element={<ProtectedRoute><NewTicket /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetail /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          {/* Public */}
          <Route path="/public/new" element={<PublicNewTicket />} />
          <Route path="/ticketcreated" element={<PublicTicketCreated />} />


          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Placeholder routes – גם נעולים כדי שלא יראו “מערכת” בלי הזדהות */}
          <Route path="/customers" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/organizations" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/knowledge-base" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/automations" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Index /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
