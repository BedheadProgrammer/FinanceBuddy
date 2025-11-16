import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { useAuth } from '../store/auth'

type FormValues = {
  username: string
  password: string
  confirm: string
}

export function Register() {
  usePageMeta(
    'Sign up | FinanceBuddy',
    'Create a FinanceBuddy account to explore options pricing tools and analytics.',
  )

  const { register, handleSubmit } = useForm<FormValues>()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (data: FormValues) => {
    setError(null)

    if (data.password !== data.confirm) {
      setError('Passwords do not match')
      return
    }

    try {
      const resp = await fetch('/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: data.username,
          password: data.password,
          confirm: data.confirm,
        }),
      })

      const payload: any = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        const message =
          (payload && typeof payload.error === 'string' && payload.error) ||
          'Registration failed'
        throw new Error(message)
      }

      // Also tell the React auth context we are logged in
      await login(data.username, data.password)
      navigate('/dashboard')
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
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
        Create your account
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
          <TextField
            label="Confirm Password"
            type="password"
            {...register('confirm', { required: true })}
            fullWidth
          />
          <Button type="submit" variant="contained">
            Create account
          </Button>
        </Stack>
      </form>
    </Box>
  )
}
