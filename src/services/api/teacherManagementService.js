import apiClient from './client';

export const teacherManagementService = {
  // دریافت لیست معلمین از API
  getTeachers: async () => {
    try {
      const response = await apiClient.get('/teachers');
      console.log('[API] Teachers loaded:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get teachers error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت لیست معلمین');
    }
  },
  
  // دریافت معلم با شناسه
  getTeacherById: async (id) => {
    try {
      const response = await apiClient.get(`/teachers/${id}`);
      return response.data;
    } catch (error) {
      console.error('[API] Get teacher error:', error);
      throw new Error(error.response?.data?.detail || 'معلم یافت نشد');
    }
  },
  
  // افزودن معلم جدید
  addTeacher: async (data) => {
    try {
      console.log('[API] Adding teacher:', data);
      const response = await apiClient.post('/teachers', {
        full_name: data.fullName,
        email: data.email || null,
        phone: data.phone || null,
        username: data.username,
        password: data.password,
        subject: data.subject || null,
      });
      console.log('[API] Teacher added:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Add teacher error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در افزودن معلم');
    }
  },
  
  // ویرایش معلم
  updateTeacher: async (id, data) => {
    try {
      const response = await apiClient.put(`/teachers/${id}`, {
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        is_active: data.isActive,
      });
      return response.data;
    } catch (error) {
      console.error('[API] Update teacher error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در ویرایش معلم');
    }
  },
  
  // تغییر رمز عبور معلم
  changeTeacherPassword: async (id, newPassword) => {
    try {
      const response = await apiClient.post(`/teachers/${id}/reset-password`, {
        new_password: newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('[API] Change password error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در تغییر رمز عبور');
    }
  },
  
  // حذف معلم
  deleteTeacher: async (id) => {
    try {
      await apiClient.delete(`/teachers/${id}`);
      console.log('[API] Teacher deleted:', id);
      return true;
    } catch (error) {
      console.error('[API] Delete teacher error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در حذف معلم');
    }
  },
  
  // ===== مدیریت کلاس‌های معلم =====
  getTeacherClasses: async (teacherId) => {
    try {
      const response = await apiClient.get(`/classes?teacher_id=${teacherId}`);
      return response.data;
    } catch (error) {
      console.error('[API] Get teacher classes error:', error);
      return [];
    }
  },
  
  getClassLessons: async (classId) => {
    try {
      const response = await apiClient.get(`/classes/${classId}/lessons`);
      return response.data;
    } catch (error) {
      console.error('[API] Get class lessons error:', error);
      return [];
    }
  },
  
  // دریافت لیست کلاس‌های موجود برای اختصاص به معلم
  getAvailableClasses: async () => {
    try {
      const response = await apiClient.get('/teachers/available-classes');
      return response.data;
    } catch (error) {
      console.error('[API] Get available classes error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت لیست کلاس‌ها');
    }
  },
  
  // اختصاص کلاس به معلم
  assignClassToTeacher: async (teacherId, classId) => {
    try {
      const response = await apiClient.post(`/teachers/${teacherId}/assign-class`, {
        class_id: classId
      });
      return response.data;
    } catch (error) {
      console.error('[API] Assign class error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در اختصاص کلاس به معلم');
    }
  },
  
  // حذف کلاس از معلم
  removeClassFromTeacher: async (teacherId, classId) => {
    try {
      const response = await apiClient.delete(`/teachers/${teacherId}/remove-class`, {
        data: { class_id: classId }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Remove class error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در حذف کلاس');
    }
  },
  
  // ===== مدیریت درس‌های معلم =====
  
  // افزودن درس به معلم در یک کلاس خاص
  addLessonToTeacher: async (teacherId, classId, lessonId) => {
    try {
      console.log('========== ADD LESSON TO TEACHER ==========');
      console.log('teacherId:', teacherId);
      console.log('classId:', classId);
      console.log('lessonId:', lessonId);
      
      const response = await apiClient.post(`/teachers/${teacherId}/add-lesson`, {
        class_id: classId,
        lesson_id: lessonId
      });
      console.log('Response:', response.data);
      console.log('========== ADD LESSON SUCCESS ==========');
      return response.data;
    } catch (error) {
      console.error('========== ADD LESSON ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw new Error(error.response?.data?.detail || 'مشکل در افزودن درس');
    }
  },
  
  // حذف یک درس از معلم
  removeLessonFromTeacher: async (teacherId, classId, lessonId) => {
    try {
      console.log('========== REMOVE LESSON FROM TEACHER ==========');
      console.log('teacherId:', teacherId);
      console.log('classId:', classId);
      console.log('lessonId:', lessonId);
      
      const response = await apiClient.delete(`/teachers/${teacherId}/remove-lesson`, {
        data: {
          class_id: classId,
          lesson_id: lessonId
        }
      });
      console.log('Response:', response.data);
      console.log('========== REMOVE LESSON SUCCESS ==========');
      return response.data;
    } catch (error) {
      console.error('========== REMOVE LESSON ERROR ==========');
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'مشکل در حذف درس');
    }
  },
  
  // دریافت درس‌هایی که معلم در یک کلاس خاص تدریس می‌کند
  getTeacherClassLessons: async (teacherId, classId) => {
    try {
      const response = await apiClient.get(`/teachers/${teacherId}/classes/${classId}/lessons`);
      return response.data;
    } catch (error) {
      console.error('[API] Get teacher class lessons error:', error);
      return [];
    }
  },
};