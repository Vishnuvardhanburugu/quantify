import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 60000, // Increased to 60 seconds for cold starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle timeout errors more gracefully
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.error('Request timeout - server may be waking up');
      return Promise.reject({
        ...error,
        message: 'Server is waking up. Please try again in a moment.',
      });
    }

    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Refresh token expired or invalid
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/signin';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;