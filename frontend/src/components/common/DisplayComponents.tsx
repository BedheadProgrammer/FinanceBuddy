import React from "react";
import { Box, Typography } from "@mui/material";
import { colors, typography } from "../../constants/theme";

type MoneyDisplayProps = {
  value: number | null | undefined;
  currency?: string;
  size?: "small" | "normal" | "large";
  showSign?: boolean;
};

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({
  value,
  currency = "USD",
  size = "normal",
  showSign = false,
}) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <Typography
        component="span"
        sx={{
          fontFamily: typography.mono,
          color: colors.textMuted,
          fontSize:
            size === "large" ? "1.5rem" : size === "small" ? "0.8125rem" : "0.9375rem",
        }}
      >
        —
      </Typography>
    );
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = showSign
    ? isPositive
      ? colors.positive
      : isNegative
      ? colors.negative
      : colors.textPrimary
    : colors.textPrimary;

  const formatted = Math.abs(value).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const displayValue =
    showSign && isPositive
      ? `+${formatted}`
      : showSign && isNegative
      ? `-${formatted.replace("-", "")}`
      : formatted;

  return (
    <Typography
      component="span"
      sx={{
        fontFamily: typography.mono,
        fontWeight: size === "large" ? 600 : 500,
        fontSize:
          size === "large" ? "1.5rem" : size === "small" ? "0.8125rem" : "0.9375rem",
        color,
        letterSpacing: "-0.02em",
      }}
    >
      {displayValue}
    </Typography>
  );
};

type NumberDisplayProps = {
  value: number | null | undefined;
  decimals?: number;
  size?: "small" | "normal";
};

export const NumberDisplay: React.FC<NumberDisplayProps> = ({
  value,
  decimals = 2,
  size = "normal",
}) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <Typography
        component="span"
        sx={{
          fontFamily: typography.mono,
          color: colors.textMuted,
          fontSize: size === "small" ? "0.8125rem" : "0.9375rem",
        }}
      >
        —
      </Typography>
    );
  }

  return (
    <Typography
      component="span"
      sx={{
        fontFamily: typography.mono,
        fontWeight: 500,
        fontSize: size === "small" ? "0.8125rem" : "0.9375rem",
        color: colors.textPrimary,
        letterSpacing: "-0.02em",
      }}
    >
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </Typography>
  );
};

type PnLDisplayProps = {
  value: number | null | undefined;
  currency?: string;
};

export const PnLDisplay: React.FC<PnLDisplayProps> = ({
  value,
  currency = "USD",
}) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return (
      <Typography
        component="span"
        sx={{
          fontFamily: typography.mono,
          color: colors.textMuted,
          fontSize: "0.9375rem",
        }}
      >
        —
      </Typography>
    );
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const color = isPositive ? colors.positive : isNegative ? colors.negative : colors.textPrimary;
  const bgColor = isPositive ? colors.positiveBg : isNegative ? colors.negativeBg : "transparent";

  const formatted = Math.abs(value).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.25,
        borderRadius: 1,
        backgroundColor: bgColor,
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: typography.mono,
          fontWeight: 600,
          fontSize: "0.9375rem",
          color,
          letterSpacing: "-0.02em",
        }}
      >
        {isPositive ? "+" : isNegative ? "-" : ""}
        {formatted.replace("-", "")}
      </Typography>
    </Box>
  );
};
