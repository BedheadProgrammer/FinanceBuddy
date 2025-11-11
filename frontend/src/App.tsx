import { Container } from "@mui/material";
import type { ReactElement } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { Footer } from "./components/Footer";
import { NavBar } from "./components/NavBar";
import { Assistant } from "./pages/Assistant";
import { Dashboard } from "./pages/Dashboard";
import EuroOptionsPricing from "./pages/EuroOptionsPricing";
import GreeksVisualization from "./pages/GreeksVisualization";
import AmericanOptionsPricing from "./pages/AmericanOptionsPricing"

function App(): ReactElement {
  return (
    <>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/tools/american" element={<AmericanOptionsPricing />} />
          <Route path="/tools/euro" element={<EuroOptionsPricing />} />
          <Route path="/tools/euro/greeks" element={<GreeksVisualization />} />
        </Routes>
      </Container>
      <Footer />
    </>
  );
}

export default App;
