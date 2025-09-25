import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../store/auth'

export function NavBar() {
  const { isAuthenticated, logout } = useAuth()
  return (
    <AppBar position="static" color="transparent" sx={{ boxShadow: 'none', backgroundImage: 'none' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          FinanceBuddy
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
          <Button color="inherit" component={RouterLink} to="/calculator">Calculator</Button>
          <Button color="inherit" component={RouterLink} to="/saved">Saved</Button>
          <Button color="inherit" component={RouterLink} to="/assistant">AI Assistant</Button>
          <Button color="inherit" component={RouterLink} to="/settings">Settings</Button>
          {isAuthenticated ? (
            <Button color="inherit" onClick={logout}>Logout</Button>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}


