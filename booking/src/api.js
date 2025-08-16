// API and Socket.IO helpers for frontend integration
import axios from 'axios';
import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config.url,
        data: error.response.data,
      });

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        console.warn('Authentication required - token may have expired');
        // Clear invalid token from localStorage
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          console.log('Clearing expired token from localStorage');
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Set auth token in headers
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token set in headers');
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed from headers');
  }
}

// Initialize socket connection
export function connectSocket(token) {
  console.log('Initializing socket connection...');
  const socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
}
