import { Container } from '@mui/material'
import type { ReactElement } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Footer } from './components/Footer'
import { NavBar } from './components/NavBar'
import { Assistant } from './pages/Assistant'
import { Calculator } from './pages/Calculator'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Saved } from './pages/Saved'
import { Settings } from './pages/Settings'
// Temporary: disable auth guard so pages are directly reachable
function PrivateRoute({ element }: { element: ReactElement }) {
  return element
}

function App() {
  return (
    <>
      <NavBar />
      <Container sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
          <Route path="/calculator" element={<PrivateRoute element={<Calculator />} />} />
          <Route path="/saved" element={<PrivateRoute element={<Saved />} />} />
          <Route path="/settings" element={<PrivateRoute element={<Settings />} />} />
          <Route path="/assistant" element={<PrivateRoute element={<Assistant />} />} />
        </Routes>
      </Container>
      <Footer />
    </>
  )
}

export default App
