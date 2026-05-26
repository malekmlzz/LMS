import apiClient from './client';
import { storage } from '../../utils/storage';

export const userService = {
  getMe: async () => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  
  updateProfile: async (data) => {
    const response = await apiClient.put('/users/profile', {
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
    });
    
    const currentUser = await storage.getUser();
    const updatedUser = { ...currentUser, ...response.data };
    await storage.setUser(updatedUser);
    
    return updatedUser;
  },
  
  changePassword: async (data) => {
    const response = await apiClient.post('/users/change-password', {
      current_password: data.current_password,
      new_password: data.new_password,
    });
    return response.data;
  },
  
  deleteProfileImage: async () => {
    try {
      const response = await apiClient.delete('/users/profile-image');
      return response.data;
    } catch {
      return { message: 'عکس حذف شد' };
    }
  },
};