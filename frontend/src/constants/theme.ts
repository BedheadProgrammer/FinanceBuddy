export const colors = {
  pageBg: "#0a0f1a",
  cardBg: "#111827",
  cardBgHover: "#1a2332",
  tableBg: "#0d1321",
  tableRowHover: "rgba(59, 130, 246, 0.08)",
  textPrimary: "#f8fafc",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  positive: "#22c55e",
  positiveBg: "rgba(34, 197, 94, 0.12)",
  negative: "#ef4444",
  negativeBg: "rgba(239, 68, 68, 0.12)",
  accent: "#3b82f6",
  accentHover: "#2563eb",
  border: "rgba(148, 163, 184, 0.15)",
  borderStrong: "rgba(148, 163, 184, 0.25)",
};

export const typography = {
  mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

export const inputSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 1.5,
    "& fieldset": {
      borderColor: colors.border,
    },
    "&:hover fieldset": {
      borderColor: colors.borderStrong,
    },
    "&.Mui-focused fieldset": {
      borderColor: colors.accent,
    },
  },
  "& .MuiInputLabel-root": {
    color: colors.textSecondary,
    fontSize: "0.875rem",
  },
  "& .MuiOutlinedInput-input": {
    color: colors.textPrimary,
    fontFamily: typography.mono,
    fontSize: "0.9375rem",
  },
};

export const toggleButtonSx = {
  "&.MuiToggleButtonGroup-grouped": {
    borderColor: colors.border,
    color: colors.textSecondary,
    fontSize: "0.8125rem",
    fontWeight: 500,
    py: 1,
    "&.Mui-selected": {
      backgroundColor: "rgba(59, 130, 246, 0.15)",
      color: colors.accent,
      borderColor: colors.accent,
    },
    "&:hover": {
      backgroundColor: "rgba(59, 130, 246, 0.08)",
    },
  },
};
