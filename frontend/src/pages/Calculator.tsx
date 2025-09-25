import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material'
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useForm } from 'react-hook-form'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

type FormValues = {
  spot: number
  strike: number
  time: number
  rate: number
  dividend: number
  vol: number
  type: 'Call' | 'Put'
}

export function Calculator() {
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { type: 'Call' } as any,
  })

  const onSubmit = (_data: FormValues) => {
    // TODO: call backend; currently mocked
  }

  const mockChart = {
    labels: ['Delta', 'Gamma', 'Vega', 'Theta', 'Rho'],
    datasets: [{ label: 'Greeks', data: [0.5, 0.1, 0.3, -0.2, 0.05], borderColor: '#1976d2' }],
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Options Calculator</Typography>
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField label="Spot Price" type="number" {...register('spot', { valueAsNumber: true })} />
          <TextField label="Strike Price" type="number" {...register('strike', { valueAsNumber: true })} />
          <TextField label="Time to Expiry (years)" type="number" {...register('time', { valueAsNumber: true })} />
          <TextField label="Risk-free Rate (dec)" type="number" {...register('rate', { valueAsNumber: true })} />
          <TextField label="Dividend Yield (dec)" type="number" {...register('dividend', { valueAsNumber: true })} />
          <TextField label="Volatility (dec)" type="number" {...register('vol', { valueAsNumber: true })} />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select labelId="type-label" label="Type" defaultValue={'Call'} {...(register('type') as any)}>
              <MenuItem value={'Call'}>Call</MenuItem>
              <MenuItem value={'Put'}>Put</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">Calculate</Button>
        </Stack>
      </Box>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Greeks Visualization</Typography>
      <Line data={mockChart} />
    </Stack>
  )
}


