import { Stack, TextField, Typography } from '@mui/material'

export function Settings() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Settings</Typography>
      <Stack spacing={2}>
        <Typography variant="h6" gutterBottom>User Profile</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Display Name" />
          <TextField label="Email" />
        </Stack>
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h6" gutterBottom>API Configuration</Typography>
        <TextField label="OpenAI API Key" fullWidth />
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h6" gutterBottom>Display Preferences</Typography>
        <TextField label="Theme" placeholder="dark" />
      </Stack>
      <Stack spacing={1}>
        <Typography variant="h6" gutterBottom>Data Management</Typography>
        <Typography variant="body2">Export/import coming soon.</Typography>
      </Stack>
    </Stack>
  )
}


