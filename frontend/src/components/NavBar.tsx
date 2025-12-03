// frontend/src/components/NavBar.tsx
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import { keyframes } from "@mui/system";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../store/auth";

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const sparkle = keyframes`
  0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.9; }
  50% { transform: rotate(8deg) scale(1.08); opacity: 1; }
`;

export function NavBar() {
  const { isAuthenticated, logout } = useAuth();
  const homeTarget = isAuthenticated ? "/dashboard" : "/";

  return (
    <AppBar position="static" color="primary">
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box
          component={RouterLink}
          to={homeTarget}
          sx={{
            textDecoration: "none",
            color: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                "linear-gradient(120deg, #90caf9, #ce93d8, #ffcc80, #90caf9)",
              backgroundSize: "200% 200%",
              animation: `${shimmer} 6s ease-in-out infinite`,
              boxShadow: 3,
            }}
          >
            <AutoAwesome
              sx={{
                fontSize: 20,
                animation: `${sparkle} 2.8s ease-in-out infinite`,
              }}
            />
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 700,
              letterSpacing: 0.5,
              background:
                "linear-gradient(90deg, #ffffff, #e3f2fd, #f3e5f5, #ffe0b2)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            FinanceBuddy
          </Typography>
        </Box>

        {/* Main nav buttons */}
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" component={RouterLink} to={homeTarget}>
            Home
          </Button>

          {isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={RouterLink} to="/tools/euro">
                Euro Options
              </Button>
              <Button color="inherit" component={RouterLink} to="/tools/american">
                American Options
              </Button>
              <Button color="inherit" component={RouterLink} to="/tools/euro/greeks">
                Greeks
              </Button>
              <Button color="inherit" component={RouterLink} to="/portfolio">
                Portfolio
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {isAuthenticated ? (
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login">
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
