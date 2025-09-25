import DeleteIcon from '@mui/icons-material/Delete'
import { Button, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'

const mockRows = [
  { id: 1, spot: 100, strike: 105, price: 3.2, type: 'Call' },
  { id: 2, spot: 95, strike: 90, price: 6.1, type: 'Put' },
]

export function Saved() {
  return (
    <Stack spacing={2}>
      <Typography variant="h5">Saved Predictions</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <TextField label="Search" size="small" />
        <Button variant="outlined">Export</Button>
      </Stack>
       <Table sx={{ backgroundColor: 'transparent' }}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Spot</TableCell>
              <TableCell>Strike</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Price</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.spot}</TableCell>
                <TableCell>{row.strike}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.price}</TableCell>
                <TableCell align="right">
              <IconButton aria-label="delete" size="small" color="inherit"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>
    </Stack>
  )
}


