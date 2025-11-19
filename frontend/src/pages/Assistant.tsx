// frontend/src/pages/Assistant.tsx
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormEvent, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { api } from '../lib/api/client';

type Role = 'user' | 'assistant';

interface ChatMessage {
  role: Role;
  content: string;
}

interface AssistantChatResponse {
  thread_id: string;
  reply: string;
  messages: ChatMessage[];
}

export function Assistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your FinanceBud assistant. Ask me about your options calculations or anything you see in FinanceBuddy.",
    },
  ]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  usePageMeta(
    'AI Assistant | FinanceBuddy',
    'Ask questions about your options calculations and get assistant responses in FinanceBuddy.',
  );

  const send = async (evt?: FormEvent) => {
    evt?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Optimistically add the user message
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const payload: { message: string; thread_id?: string | null } = {
        message: trimmed,
      };
      if (threadId) {
        payload.thread_id = threadId;
      }

      const { data } = await api.post<AssistantChatResponse>(
        '/api/assistant/chat',
        payload,
      );

      setThreadId(data.thread_id);

      // Prefer the canonical transcript from the backend if provided.
      const updatedMessages =
        data.messages && data.messages.length > 0
          ? data.messages
          : [...nextMessages, { role: 'assistant', content: data.reply }];

      setMessages(updatedMessages);
    } catch (err: any) {
      console.error('Assistant error', err);

      const messageFromServer: string | undefined =
        err?.response?.data?.error ?? err?.message ?? 'Unknown error';

      setError(messageFromServer);

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I ran into a problem talking to the FinanceBud assistant. ' +
            'Please check that the backend is running and the OpenAI API key / assistant id are configured.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" gutterBottom>
        AI Assistant
      </Typography>

      <Typography variant="body1" color="text.secondary">
        This chat is powered by your FinanceBud assistant configured in the OpenAI
        dashboard. Your conversation persists per thread so you can ask follow-up
        questions.
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          maxHeight: 480,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.map((m, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              borderRadius: 2,
              px: 1.5,
              py: 1,
              bgcolor: m.role === 'user' ? 'primary.main' : 'background.paper',
              color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
              boxShadow: 1,
            }}
          >
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              {m.role === 'user' ? 'You' : 'FinanceBud'}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {m.content}
            </Typography>
          </Box>
        ))}

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              FinanceBud is thinking...
            </Typography>
          </Stack>
        )}
      </Paper>

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <Box component="form" onSubmit={send}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a recent option you priced, your Greeks, or anything finance-related..."
            disabled={loading}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !input.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
