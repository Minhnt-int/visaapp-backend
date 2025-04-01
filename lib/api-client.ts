import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Auth token functions
export const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getStoredRefreshToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setStoredAuth = (accessToken: string, refreshToken: string, user: any, expiresIn: number) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('tokenExpiry', (Date.now() + expiresIn * 1000).toString());
};

export const removeStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('tokenExpiry');
};

// Tạo axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào mỗi request
apiClient.interceptors.request.use(
  async (config) => {
    // Lấy token từ local storage
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý refresh token khi token hết hạn
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu token hết hạn (401) và chưa thử refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Lấy refresh token
        const refreshToken = getStoredRefreshToken();
        
        if (!refreshToken) {
          // Xóa auth data nếu không có refresh token
          removeStoredAuth();
          return Promise.reject(error);
        }

        // Gọi API refresh token
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken,
        });

        // Lưu token mới
        const { accessToken, user, expiresIn } = res.data;
        setStoredAuth(accessToken, refreshToken, user, expiresIn);

        // Thử lại request ban đầu với token mới
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Xóa auth data nếu refresh token cũng hết hạn
        removeStoredAuth();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Các API calls

// Auth
export const loginWithToken = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login-token`, {
      email,
      password,
    });
    
    // Lưu tokens và user info vào local storage
    const { accessToken, refreshToken, user, expiresIn } = response.data;
    setStoredAuth(accessToken, refreshToken, user, expiresIn);
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const refreshToken = getStoredRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken,
    });
    
    // Lưu token mới và user info
    const { accessToken, user, expiresIn } = response.data;
    setStoredAuth(accessToken, refreshToken, user, expiresIn);
    
    return response.data;
  } catch (error) {
    removeStoredAuth();
    throw error;
  }
};

export const logout = () => {
  removeStoredAuth();
};

export const register = async (name: string, email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/register', {
      name,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Users
export const getUsers = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await apiClient.get('/users', {
      params: { page, limit, search },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserRole = async (userId: number, role: string) => {
  try {
    const response = await apiClient.put(`/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default apiClient; 