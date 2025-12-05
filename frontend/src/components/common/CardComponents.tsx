import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { colors } from "../../constants/theme";
import { MoneyDisplay } from "./DisplayComponents";

type SectionCardProps = {
  children: React.ReactNode;
  sx?: object;
  [key: string]: any;
};

export const SectionCard: React.FC<SectionCardProps> = ({ children, sx, ...props }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 2,
      border: `1px solid ${colors.border}`,
      backgroundColor: colors.cardBg,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Paper>
);

type StatCardProps = {
  label: string;
  value: number | null | undefined;
  currency?: string;
  highlight?: boolean;
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  currency = "USD",
  highlight = false,
}) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 2,
      backgroundColor: highlight ? "rgba(59, 130, 246, 0.08)" : "rgba(15, 23, 42, 0.5)",
      border: `1px solid ${highlight ? "rgba(59, 130, 246, 0.2)" : colors.border}`,
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: colors.textSecondary,
        fontSize: "0.75rem",
        fontWeight: 500,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        mb: 1,
      }}
    >
      {label}
    </Typography>
    <MoneyDisplay value={value} currency={currency} size="large" />
  </Box>
);
