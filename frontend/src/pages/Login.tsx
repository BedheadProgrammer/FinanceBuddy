import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

type FormValues = { username: string; password: string }

export function Login() {
  const { register, handleSubmit } = useForm<FormValues>()
  const { login } = useAuth()
  const navigate = useNavigate()
  const onSubmit = async (_data: FormValues) => {
    await login(_data.username, _data.password)
    navigate('/dashboard')
  }
  return (
    <Box maxWidth={400} mx="auto">
      <Typography variant="h5" mb={2}>Log in</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField label="Username" {...register('username')} fullWidth />
          <TextField label="Password" type="password" {...register('password')} fullWidth />
          <Button type="submit" variant="contained">Log in</Button>
        </Stack>
      </form>
    </Box>
  )
}


