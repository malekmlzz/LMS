import apiClient from './client';

export const classManagementService = {
  // دریافت لیست کلاس‌ها
  getClasses: async (teacherId = null) => {
    try {
      let url = '/classes';
      if (teacherId) {
        url += `?teacher_id=${teacherId}`;
      }
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('[API] Get classes error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت لیست کلاس‌ها');
    }
  },
  
  // دریافت کلاس با شناسه
  getClass: async (classId) => {
    try {
      const response = await apiClient.get(`/classes/${classId}`);
      return response.data;
    } catch (error) {
      console.error('[API] Get class error:', error);
      throw new Error(error.response?.data?.detail || 'کلاس یافت نشد');
    }
  },
  
  // افزودن کلاس جدید
  addClass: async (data) => {
    try {
      const response = await apiClient.post('/classes', {
        name: data.name,
        code: data.code,
        grade: data.grade,
        teacher_id: data.teacherId,
        description: data.description || '',
      });
      return response.data;
    } catch (error) {
      console.error('[API] Add class error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در افزودن کلاس');
    }
  },
  
  // ویرایش کلاس
  updateClass: async (classId, data) => {
    try {
      const response = await apiClient.put(`/classes/${classId}`, {
        name: data.name,
        grade: data.grade,
        teacher_id: data.teacherId,
        description: data.description,
        is_active: data.isActive,
      });
      return response.data;
    } catch (error) {
      console.error('[API] Update class error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در ویرایش کلاس');
    }
  },
  
  // حذف کلاس
  deleteClass: async (classId) => {
    try {
      await apiClient.delete(`/classes/${classId}`);
      return true;
    } catch (error) {
      console.error('[API] Delete class error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در حذف کلاس');
    }
  },
  
  // دریافت لیست درس‌های یک کلاس
   getClassLessons: async (classId) => {
  try {
    
    const response = await apiClient.get(`/classes/${classId}/lessons`);
    
    return response.data;
  } catch (error) {
    console.error(`[API] getClassLessons ERROR for ${classId}:`, error);
    return [];
  }
},
  
// افزودن درس جدید به کلاس
addLesson: async (classId, data) => {
    try {
      const response = await apiClient.post(`/classes/${classId}/lessons`, {
        name: data.name,
        schedule: data.schedule,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'مشکل در افزودن درس');
    }
  },
  
  
  // ویرایش درس
  updateLesson: async (lessonId, data) => {
  try {
    const response = await apiClient.put(`/classes/lessons/${lessonId}`, {
      name: data.name,
      schedule: data.schedule,
      // code و credits را حذف کنید
    });
    return response.data;
  } catch (error) {
    console.error('Update lesson error:', error);
    throw new Error(error.response?.data?.detail || 'مشکل در ویرایش درس');
  }
},
  
  // حذف درس
   deleteLesson: async (lessonId) => {
    try {
      await apiClient.delete(`/classes/lessons/${lessonId}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'مشکل در حذف درس');
    }
  },
};