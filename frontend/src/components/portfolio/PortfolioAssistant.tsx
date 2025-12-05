import React from "react";
import { Box, Typography, TextField, Button, Alert } from "@mui/material";
import { colors, inputSx } from "../../constants/theme";
import type { AssistantMessage, PortfolioSummaryPayload } from "../../types/portfolio";

type PortfolioAssistantProps = {
  messages: AssistantMessage[];
  input: string;
  setInput: (val: string) => void;
  loading: boolean;
  error: string | null;
  onSendMessage: (e: React.FormEvent, snapshot: PortfolioSummaryPayload | null) => void;
  summary: PortfolioSummaryPayload | null;
};

export const PortfolioAssistant: React.FC<PortfolioAssistantProps> = ({
  messages,
  input,
  setInput,
  loading,
  error,
  onSendMessage,
  summary,
}) => {
  return (
    <Box
      sx={{
        mt: 4,
        p: 3,
        borderRadius: 2,
        border: `1px solid ${colors.borderStrong}`,
        backgroundColor: "rgba(15, 23, 42, 0.8)",
      }}
    >
      <Typography
        sx={{
          fontWeight: 600,
          color: colors.textPrimary,
          mb: 2,
        }}
      >
        FinanceBud Analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          maxHeight: 280,
          overflowY: "auto",
          mb: 2,
          pr: 1,
        }}
      >
        {messages.length === 0 && !loading && !error && (
          <Typography
            sx={{
              color: colors.textMuted,
              fontSize: "0.875rem",
            }}
          >
            Click &quot;Ask FinanceBud&quot; to get an analysis of your portfolio.
          </Typography>
        )}
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              mb: 2,
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <Box
              sx={{
                display: "inline-block",
                maxWidth: "85%",
                px: 2.5,
                py: 2,
                borderRadius: 2,
                backgroundColor:
                  msg.role === "user"
                    ? "rgba(59, 130, 246, 0.2)"
                    : colors.cardBg,
                border: `1px solid ${
                  msg.role === "user"
                    ? "rgba(59, 130, 246, 0.3)"
                    : colors.border
                }`,
              }}
            >
              <Typography
                sx={{
                  color: colors.textPrimary,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.content}
              </Typography>
            </Box>
          </Box>
        ))}
        {loading && (
          <Typography sx={{ color: colors.textMuted, fontSize: "0.875rem" }}>
            Analyzing your portfolio...
          </Typography>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={(e) => onSendMessage(e, summary)}
        sx={{ display: "flex", gap: 1.5 }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask a question about your portfolio..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          sx={inputSx}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !input.trim()}
          sx={{
            px: 3,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            backgroundColor: colors.accent,
            "&:hover": {
              backgroundColor: colors.accentHover,
            },
          }}
        >
          Send
        </Button>
      </Box>
    </Box>
  );
};
