import { useState } from "react";
import type { MouseEvent } from "react";
import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Divider,
  Chip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { keyframes } from "@mui/system";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../store/auth";
import { usePortfolioContext } from "../store/portfolio";
import { ManagePortfoliosDialog } from "./portfolio/ManagePortfoliosDialog";

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

  const portfolioContext = isAuthenticated ? usePortfolioContext() : null;

  const {
    portfolios = [],
    activePortfolioId = null,
    activePortfolio = null,
    loading: portfoliosLoading = false,
    error: portfoliosError = null,
    setActivePortfolioId = () => {},
    createPortfolio = async () => null,
    updatePortfolio = async () => null,
    deletePortfolio = async () => false,
    setDefaultPortfolio = async () => null,
  } = portfolioContext || {};

  const [portfolioMenuAnchor, setPortfolioMenuAnchor] = useState<null | HTMLElement>(null);
  const portfolioMenuOpen = Boolean(portfolioMenuAnchor);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const handlePortfolioMenuClick = (event: MouseEvent<HTMLElement>) => {
    setPortfolioMenuAnchor(event.currentTarget);
  };

  const handlePortfolioMenuClose = () => {
    setPortfolioMenuAnchor(null);
  };

  const handleSelectPortfolio = (id: number) => {
    setActivePortfolioId(id);
    handlePortfolioMenuClose();
  };

  const handleOpenManageDialog = () => {
    handlePortfolioMenuClose();
    setManageDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
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
                background: "linear-gradient(120deg, #90caf9, #ce93d8, #ffcc80, #90caf9)",
                backgroundSize: "200% 200%",
                animation: `${shimmer} 6s ease-in-out infinite`,
                boxShadow: 3,
              }}
            >
              <AutoAwesome sx={{ fontSize: 20, animation: `${sparkle} 2.8s ease-in-out infinite` }} />
            </Box>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.5,
                background: "linear-gradient(90deg, #ffffff, #e3f2fd, #f3e5f5, #ffe0b2)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              FinanceBuddy
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button color="inherit" component={RouterLink} to={homeTarget}>Home</Button>

            {isAuthenticated && (
              <>
                <Button color="inherit" component={RouterLink} to="/dashboard">Dashboard</Button>
                <Button color="inherit" component={RouterLink} to="/tools/euro">Euro Options</Button>
                <Button color="inherit" component={RouterLink} to="/tools/american">American Options</Button>
                <Button color="inherit" component={RouterLink} to="/tools/euro/greeks">Greeks</Button>
                <Button color="inherit" component={RouterLink} to="/portfolio">Portfolio</Button>

                <Box sx={{ ml: 1 }}>
                  <Button
                    color="inherit"
                    onClick={handlePortfolioMenuClick}
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                      textTransform: "none",
                      backgroundColor: portfolioMenuOpen ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      borderRadius: 2,
                      px: 2,
                      "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.15)" },
                    }}
                  >
                    <AccountBalanceWalletIcon sx={{ mr: 1, fontSize: 18 }} />
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", maxWidth: 150 }}>
                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {activePortfolio?.name || "Select Portfolio"}
                      </Typography>
                      {activePortfolio && (
                        <Typography sx={{ fontSize: "0.6875rem", opacity: 0.7, lineHeight: 1 }}>
                          {formatCurrency(activePortfolio.cash_balance)}
                        </Typography>
                      )}
                    </Box>
                  </Button>

                  <Menu
                    anchorEl={portfolioMenuAnchor}
                    open={portfolioMenuOpen}
                    onClose={handlePortfolioMenuClose}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    PaperProps={{ sx: { minWidth: 250, maxWidth: 320, mt: 1 } }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "text.secondary", letterSpacing: "0.05em" }}>
                        Switch Portfolio
                      </Typography>
                    </Box>

                    {portfolios.map((portfolio) => (
                      <MenuItem
                        key={portfolio.id}
                        onClick={() => handleSelectPortfolio(portfolio.id)}
                        selected={portfolio.id === activePortfolioId}
                        sx={{ py: 1.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {portfolio.id === activePortfolioId ? (
                            <CheckIcon fontSize="small" color="primary" />
                          ) : (
                            <Box sx={{ width: 20 }} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography sx={{ fontWeight: 500 }}>{portfolio.name}</Typography>
                              {portfolio.is_default && (
                                <Chip label="Default" size="small" sx={{ height: 18, fontSize: "0.625rem" }} />
                              )}
                            </Box>
                          }
                          secondary={formatCurrency(portfolio.cash_balance)}
                        />
                      </MenuItem>
                    ))}

                    {portfolios.length === 0 && (
                      <MenuItem disabled>
                        <Typography sx={{ color: "text.secondary", fontSize: "0.875rem" }}>No portfolios found</Typography>
                      </MenuItem>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <MenuItem onClick={handleOpenManageDialog}>
                      <ListItemIcon><SettingsIcon fontSize="small" /></ListItemIcon>
                      <ListItemText primary="Manage Portfolios" />
                    </MenuItem>
                  </Menu>
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
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

      {isAuthenticated && portfolioContext && (
        <ManagePortfoliosDialog
          open={manageDialogOpen}
          onClose={() => setManageDialogOpen(false)}
          portfolios={portfolios}
          activePortfolioId={activePortfolioId}
          onSelectPortfolio={(id: number) => setActivePortfolioId(id)}
          onCreatePortfolio={createPortfolio}
          onRenamePortfolio={(id: number, name: string) => updatePortfolio(id, { name })}
          onDeletePortfolio={deletePortfolio}
          onSetDefault={setDefaultPortfolio}
          loading={portfoliosLoading}
          error={portfoliosError}
        />
      )}
    </>
  );
}