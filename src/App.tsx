import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";
import { initSupabaseStorage } from "./lib/supabaseInit";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import LaborDashboard from "./pages/labor/LaborDashboard";
import LaborProfile from "./pages/labor/LaborProfile";
import LaborEarnings from "./pages/labor/LaborEarnings";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProfile from "./pages/client/ClientProfile";
import BookLabor from "./pages/client/BookLabor";
import LaborDetails from "./pages/client/LaborDetails";

const queryClient = new QueryClient();

// Protected route for authenticated users
const ProtectedRoute = ({ children, requiredRole }: { children: JSX.Element, requiredRole?: "labor" | "client" }) => {
  const { currentUser, userData, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // If role is required, check if user has that role
  if (requiredRole && userData?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// App wrapper with providers
const AppWithProviders = () => {
  // Initialize Supabase storage on app load
  useEffect(() => {
    initSupabaseStorage().then(result => {
      if (result.success) {
        console.log("Supabase storage initialized successfully");
      } else {
        console.error("Failed to initialize Supabase storage:", result.error);
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// App routes
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Labor Routes */}
        <Route 
          path="/labor/dashboard" 
          element={
            <ProtectedRoute requiredRole="labor">
              <LaborDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/labor/profile" 
          element={
            <ProtectedRoute requiredRole="labor">
              <LaborProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/labor/earnings" 
          element={
            <ProtectedRoute requiredRole="labor">
              <LaborEarnings />
            </ProtectedRoute>
          } 
        />
        
        {/* Client Routes */}
        <Route 
          path="/client/dashboard" 
          element={
            <ProtectedRoute requiredRole="client">
              <ClientDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/profile" 
          element={
            <ProtectedRoute requiredRole="client">
              <ClientProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/book" 
          element={
            <ProtectedRoute requiredRole="client">
              <BookLabor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/client/labor/:id" 
          element={
            <ProtectedRoute requiredRole="client">
              <LaborDetails />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => <AppWithProviders />;

export default App;
