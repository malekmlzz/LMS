import apiClient from './client';
import { storage } from '../../utils/storage';

export const authService = {
  registerSchool: async (data) => {
    try {
      const response = await apiClient.post('/auth/register-school', {
        schoolName: data.schoolName,
        adminName: data.adminName,
        email: data.email,
        phone: data.phone,
        username: data.username,
        password: data.password,
      });
      
      if (response.data.access_token) {
        await storage.setToken(response.data.access_token);
        await storage.setTokenExpiry(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      if (response.data.user) {
        await storage.setUser(response.data.user);
      }
      
      return {
        success: true,
        token: response.data.access_token,
        user: response.data.user,
      };
    } catch (error) {
      let message = 'مشکل در ثبت‌نام، لطفاً دوباره تلاش کنید';
      if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      throw new Error(message);
    }
  },
  
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      
      if (response.data.access_token) {
        await storage.setToken(response.data.access_token);
        await storage.setTokenExpiry(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
      if (response.data.user) {
        await storage.setUser(response.data.user);
      }
      
      return {
        success: true,
        token: response.data.access_token,
        user: response.data.user,
      };
    } catch (error) {
      let message = 'نام کاربری یا رمز عبور اشتباه است';
      if (error.response?.data?.detail) {
        message = error.response.data.detail;
      }
      throw new Error(message);
    }
  },
  
  checkAuth: async () => {
    try {
      const token = await storage.getToken();
      const tokenExpiry = await storage.getTokenExpiry();
      
      if (!token) {
        return false;
      }
      
      if (tokenExpiry && Date.now() > tokenExpiry) {
        await storage.clearAll();
        return false;
      }
      
      const response = await apiClient.get('/auth/verify');
      return response.data.valid === true;
    } catch {
      return false;
    }
  },
  
  logout: async () => {
    // ابتدا توکن را بگیریم
    const token = await storage.getToken();
    
    // اگر توکن وجود داشت، سعی کنیم API خروج را صدا بزنیم (اختیاری)
    if (token) {
      try {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        // خطای API را نادیده می‌گیریم چون مهم نیست
        console.log('Logout API error (ignored):', error.message);
      }
    }
    
    // حتماً همه اطلاعات را پاک کنیم
    await storage.clearAll();
    
    return true;
  },
};