import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Divider,
  InputAdornment,
  Collapse,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import type { Portfolio, CreatePortfolioInput } from "../../types/portfolio";

interface ManagePortfoliosDialogProps {
  open: boolean;
  onClose: () => void;
  portfolios: Portfolio[];
  activePortfolioId: number | null;
  onSelectPortfolio: (id: number) => void;
  onCreatePortfolio: (input: CreatePortfolioInput) => Promise<Portfolio | null>;
  onRenamePortfolio: (id: number, name: string) => Promise<Portfolio | null>;
  onDeletePortfolio: (id: number) => Promise<boolean>;
  onSetDefault: (id: number) => Promise<Portfolio | null>;
  loading?: boolean;
  error?: string | null;
}

export function ManagePortfoliosDialog({
  open,
  onClose,
  portfolios,
  activePortfolioId,
  onSelectPortfolio,
  onCreatePortfolio,
  onRenamePortfolio,
  onDeletePortfolio,
  onSetDefault,
  error = null,
}: ManagePortfoliosDialogProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInitialCash, setNewInitialCash] = useState("100000");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreateError("Portfolio name is required");
      return;
    }

    const initialCash = parseFloat(newInitialCash);
    if (isNaN(initialCash) || initialCash <= 0) {
      setCreateError("Initial cash must be a positive number");
      return;
    }

    setCreateError(null);
    setCreateLoading(true);

    try {
      const result = await onCreatePortfolio({
        name: newName.trim(),
        initial_cash: initialCash,
      });

      if (result) {
        setNewName("");
        setNewInitialCash("100000");
        setShowCreateForm(false);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStartEdit = (portfolio: Portfolio) => {
    setEditingId(portfolio.id);
    setEditName(portfolio.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) {
      setLocalError("Name cannot be empty");
      return;
    }

    setEditLoading(true);
    setLocalError(null);

    try {
      await onRenamePortfolio(id, editName.trim());
      setEditingId(null);
      setEditName("");
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = async (id: number) => {
    setDeleteLoading(true);
    setLocalError(null);

    try {
      const success = await onDeletePortfolio(id);
      if (success) {
        setDeleteConfirmId(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setLocalError(null);
    await onSetDefault(id);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Manage Portfolios
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {(error || localError) && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error || localError}
          </Alert>
        )}

        <List sx={{ py: 0 }}>
          {portfolios.map((portfolio) => {
            const isActive = portfolio.id === activePortfolioId;
            const isEditing = editingId === portfolio.id;
            const isDeleting = deleteConfirmId === portfolio.id;

            return (
              <React.Fragment key={portfolio.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    backgroundColor: isActive ? "action.selected" : "transparent",
                    borderLeft: isActive ? 3 : 0,
                    borderColor: "primary.main",
                    "&:hover": {
                      backgroundColor: isActive ? "action.selected" : "action.hover",
                    },
                  }}
                >
                  {isEditing ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                      <TextField
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        size="small"
                        fullWidth
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSaveEdit(portfolio.id);
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleSaveEdit(portfolio.id)}
                        disabled={editLoading}
                        color="success"
                      >
                        <CheckIcon />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelEdit}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  ) : isDeleting ? (
                    <Box sx={{ width: "100%" }}>
                      <Typography color="error" sx={{ mb: 1, fontSize: "0.875rem" }}>
                        Delete "{portfolio.name}"? This cannot be undone.
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => handleDelete(portfolio.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <>
                      <ListItemText
                        primary={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography
                              sx={{ fontWeight: isActive ? 600 : 500, cursor: "pointer" }}
                              onClick={() => {
                                onSelectPortfolio(portfolio.id);
                                onClose();
                              }}
                            >
                              {portfolio.name}
                            </Typography>
                            {portfolio.is_default && (
                              <Chip
                                label="Default"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: "0.6875rem" }}
                              />
                            )}
                            {isActive && (
                              <Chip
                                label="Active"
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: "0.6875rem" }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Cash: {formatCurrency(portfolio.cash_balance)} • Initial:{" "}
                            {formatCurrency(portfolio.initial_cash)}
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleSetDefault(portfolio.id)}
                            disabled={portfolio.is_default}
                            title={portfolio.is_default ? "Already default" : "Set as default"}
                            color={portfolio.is_default ? "primary" : "default"}
                          >
                            {portfolio.is_default ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleStartEdit(portfolio)}
                            title="Rename"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirmId(portfolio.id)}
                            disabled={portfolios.length <= 1}
                            title={portfolios.length <= 1 ? "Cannot delete only portfolio" : "Delete"}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>

        <Collapse in={showCreateForm}>
          <Box sx={{ p: 3, borderTop: 1, borderColor: "divider" }}>
            <Typography sx={{ fontWeight: 600, mb: 2 }}>Create New Portfolio</Typography>

            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Portfolio Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Growth Portfolio"
              />

              <TextField
                label="Starting Cash"
                value={newInitialCash}
                onChange={(e) => setNewInitialCash(e.target.value)}
                size="small"
                fullWidth
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />

              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewName("");
                    setNewInitialCash("100000");
                    setCreateError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCreate}
                  disabled={createLoading}
                >
                  {createLoading ? "Creating..." : "Create Portfolio"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Collapse>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: "divider",
          justifyContent: "space-between",
        }}
      >
        {!showCreateForm && (
          <Button startIcon={<AddIcon />} onClick={() => setShowCreateForm(true)}>
            New Portfolio
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}