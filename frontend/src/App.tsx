// frontend/src/App.tsx
import { Box } from "@mui/material";
import type { ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import { Dashboard } from "./pages/Dashboard";
import EuroOptionsPricing from "./pages/EuroOptionsPricing";
import GreeksVisualization from "./pages/GreeksVisualization";
import AmericanOptionsPricing from "./pages/AmericanOptionsPricing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Landing } from "./pages/Landing";
import { useAuth } from "./store/auth";
import Portfolio from "./pages/Portfolio";

type ProtectedRouteProps = {
  children: ReactElement;
};

function ProtectedRoute({ children }: ProtectedRouteProps): ReactElement {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App(): ReactElement {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <NavBar />
      <Box component="main" sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tools/euro"
            element={
              <ProtectedRoute>
                <EuroOptionsPricing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tools/american"
            element={
              <ProtectedRoute>
                <AmericanOptionsPricing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tools/euro/greeks"
            element={
              <ProtectedRoute>
                <GreeksVisualization />
              </ProtectedRoute>
            }
          />

          <Route
            path="/portfolio"
            element={
              <ProtectedRoute>
                <Portfolio />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}

export default App;