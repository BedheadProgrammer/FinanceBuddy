import { Box, Container, Typography } from '@mui/material'

export function Footer() {
  return (
    <Box component="footer" sx={{ py: 3, borderTop: '1px solid #eee', mt: 4 }}>
      <Container>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} FinanceBuddy
        </Typography>
      </Container>
    </Box>
  )
}


