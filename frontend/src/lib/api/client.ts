import axios from 'axios';


const baseURL = import.meta.env.VITE_API_BASE ?? '';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});