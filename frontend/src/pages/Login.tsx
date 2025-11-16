import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { useAuth } from '../store/auth'

type FormValues = { username: string; password: string }

export function Login() {
  usePageMeta(
    'Log in | FinanceBuddy',
    'Log in to FinanceBuddy to access your dashboard and options pricing tools.',
  )

  const { register, handleSubmit } = useForm<FormValues>()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: FormValues) => {
    setError(null)
    try {
      await login(data.username, data.password)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e?.message || 'Invalid username or password')
    }
  }

  return (
    <Box
      maxWidth={400}
      mx="auto"
      mt={8}
      p={4}
      borderRadius={2}
      boxShadow={3}
      bgcolor="background.paper"
    >
      <Typography variant="h5" mb={2}>
        Log in
      </Typography>
      {error && (
        <Box mb={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField
            label="Username"
            {...register('username', { required: true })}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            {...register('password', { required: true })}
            fullWidth
          />
          <Button type="submit" variant="contained">
            Log in
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
