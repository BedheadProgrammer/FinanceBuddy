import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';

export function Assistant() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: 'Hi! Ask me about your options calculation.' },
  ]);
  const [input, setInput] = useState('');

  usePageMeta(
    'AI Assistant | FinanceBuddy',
    'Ask questions about your options calculations and get assistant responses in FinanceBuddy.'
  );

  const send = () => {
    if (!input.trim()) return;
    setMessages((m) => [
      ...m,
      { role: 'user', content: input },
      { role: 'assistant', content: 'This is a placeholder response.' },
    ]);
    setInput('');
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h5">AI Assistant</Typography>
      <Box sx={{ p: 2, minHeight: 240 }} role="log" aria-live="polite">
        {messages.map((m, idx) => (
          <Typography
            key={idx}
            sx={{ mb: 1 }}
            color={m.role === 'assistant' ? 'text.primary' : 'text.secondary'}
          >
            <strong>{m.role === 'assistant' ? 'Assistant' : 'You'}:</strong> {m.content}
          </Typography>
        ))}
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
        />
        <Button variant="contained" onClick={send}>
          Send
        </Button>
      </Stack>
    </Stack>
  );
}
