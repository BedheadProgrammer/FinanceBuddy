import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

type FormValues = { username: string; password: string; confirm: string }

export function Register() {
  const { register, handleSubmit } = useForm<FormValues>()
  const onSubmit = (_data: FormValues) => {
    // TODO: wire to backend
  }
  return (
    <Box maxWidth={400} mx="auto">
      <Typography variant="h5" mb={2}>Sign up</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField label="Username" {...register('username')} fullWidth />
          <TextField label="Password" type="password" {...register('password')} fullWidth />
          <TextField label="Confirm Password" type="password" {...register('confirm')} fullWidth />
          <Button type="submit" variant="contained">Create account</Button>
        </Stack>
      </form>
    </Box>
  )
}


