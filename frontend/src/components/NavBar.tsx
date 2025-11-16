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
    <AppBar
      position="static"
      color="transparent"
      sx={{ boxShadow: "none", backgroundImage: "none" }}
    >
      <Toolbar>
        <Typography
          component={RouterLink}
          to={homeTarget}
          variant="h6"
          sx={{
            flexGrow: 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            cursor: "pointer",
            userSelect: "none",
            fontWeight: 800,
            letterSpacing: 0.2,
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
            lineHeight: 1.1,
            whiteSpace: "nowrap",
            filter: "drop-shadow(0 0 2px rgba(124,77,255,0.15))",
            transition:
              "transform 250ms ease, filter 250ms ease, background-position 250ms ease",
            willChange: "transform, filter, background-position",
            "&:hover": {
              transform: "translateY(-1px) scale(1.02)",
              filter: "drop-shadow(0 0 10px rgba(124,77,255,0.45))",
            },
            "&:active": {
              transform: "translateY(0) scale(0.99)",
            },
            "&:hover .brandGradient": {
              animation: `${shimmer} 4s linear infinite`,
            },
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
              "&:hover": { transform: "none" },
              "& .brandGradient": { animation: "none" },
            },
          }}
        >
          <AutoAwesome
            sx={{
              fontSize: 22,
              color: "#ffea00",
              filter: "drop-shadow(0 0 6px rgba(255,234,0,0.35))",
              animation: `${sparkle} 5s ease-in-out infinite`,
              "@media (prefers-reduced-motion: reduce)": { animation: "none" },
            }}
          />
          <Box
            component="span"
            className="brandGradient"
            sx={{
              background: "linear-gradient(90deg, #00e5ff, #7c4dff, #ff4081)",
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: `${shimmer} 12s linear infinite`,
            }}
          >
            FinanceBuddy
          </Box>
        </Typography>

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
                European Option Calculator
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/tools/euro/greeks"
              >
                Greeks
              </Button>
              <Button
                color="inherit"
                component={RouterLink}
                to="/tools/american"
              >
                American Option Calculator
              </Button>
              <Button color="inherit" onClick={logout}>
                Logout
              </Button>
            </>
          )}

          {!isAuthenticated && (
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
