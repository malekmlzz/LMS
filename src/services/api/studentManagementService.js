import apiClient from './client';

export const studentManagementService = {
  // دریافت لیست دانش‌آموزان از API
  getStudents: async () => {
    try {
      const response = await apiClient.get('/students');
      return response.data;
    } catch (error) {
      console.error('[API] Get students error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت لیست دانش‌آموزان');
    }
  },
  
  // دریافت دانش‌آموز با شناسه
  getStudentById: async (id) => {
    try {
      const response = await apiClient.get(`/students/${id}`);
      return response.data;
    } catch (error) {
      console.error('[API] Get student error:', error);
      throw new Error(error.response?.data?.detail || 'دانش‌آموز یافت نشد');
    }
  },
  
  // افزودن دانش‌آموز جدید
  addStudent: async (data) => {
  const response = await apiClient.post('/students', {
    full_name: data.fullName,
    email: data.email || null,
    phone: data.phone || null,
    parent_phone: data.parentPhone || null,
    grade: data.grade || null,
    username: data.username,
    password: data.password,
    class_id: data.classId || null,  // ← اضافه شده
  });
  return response.data;
},
  
  // ویرایش دانش‌آموز
  updateStudent: async (id, data) => {
    try {
      const response = await apiClient.put(`/students/${id}`, {
        full_name: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        parent_phone: data.parentPhone,
        grade: data.grade,
        is_active: data.isActive,
      });
      return response.data;
    } catch (error) {
      console.error('[API] Update student error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در ویرایش دانش‌آموز');
    }
  },
  
  // تغییر رمز عبور دانش‌آموز
  changeStudentPassword: async (id, newPassword) => {
    try {
      const response = await apiClient.post(`/students/${id}/reset-password`, {
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('[API] Change password error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در تغییر رمز عبور');
    }
  },
  
  // حذف دانش‌آموز
  deleteStudent: async (id) => {
    try {
      await apiClient.delete(`/students/${id}`);
      return true;
    } catch (error) {
      console.error('[API] Delete student error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در حذف دانش‌آموز');
    }
  },
};