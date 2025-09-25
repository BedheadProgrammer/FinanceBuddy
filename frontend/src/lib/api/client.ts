import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL,
  withCredentials: true,
})


