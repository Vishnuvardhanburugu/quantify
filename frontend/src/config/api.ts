// src/config/api.ts
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
} as const;

export const API_ENDPOINTS = {
  // Auth
  login: '/api/auth/login',
  register: '/api/auth/register',
  refresh: '/api/auth/refresh',
  
  // Portfolio
  portfolio: '/api/portfolio',
  
  // Trades
  trades: '/api/trades',
  
  // Market Data
  market: '/api/market',
  
  // MACD
  macd: '/api/macd',
  
  // Chat
  chat: '/api/chat',
  chatSessions: '/api/chat/sessions',
  
  // Insights
  insights: '/api/insights',
} as const;
