// services/api/studentPanelService.js
import apiClient from './client';

export const studentPanelService = {
  // دریافت لیست درس‌های من (بر اساس کلاس دانش‌آموز)
  getMyLessons: async () => {
    try {
      const response = await apiClient.get('/student/my-lessons');
      console.log('[API] My lessons:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get my lessons error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت درس‌ها');
    }
  },

  // دریافت جزئیات یک درس (نمرات و حضور غیاب)
  getLessonDetail: async (lessonId) => {
    try {
      const response = await apiClient.get(`/student/lessons/${lessonId}`);
      return response.data;
    } catch (error) {
      console.error('[API] Get lesson detail error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت جزئیات درس');
    }
  },

  // دریافت کارنامه تحصیلی
  getReportCard: async () => {
    try {
      const response = await apiClient.get('/student/report-card');
      return response.data;
    } catch (error) {
      console.error('[API] Get report card error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت کارنامه');
    }
  },
  

  // دریافت نمرات یک درس خاص
 getLessonGrades: async (lessonId) => {
  try {
    console.log('[API] Getting grades for lesson:', lessonId);
    const response = await apiClient.get(`/student/lessons/${lessonId}/grades`);
    console.log('[API] Grades response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Get lesson grades error:', error);
    return [];
  }
},

  // دریافت حضور غیاب یک درس خاص
getLessonAttendances: async (lessonId) => {
  try {
    console.log('[API] Getting attendances for lesson:', lessonId);
    const response = await apiClient.get(`/student/lessons/${lessonId}/attendances`);
    console.log('[API] Attendances response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Get lesson attendances error:', error);
    return [];
  }
},

  // محاسبه آمار حضور غیاب
  getAttendanceStats: (attendances) => {
  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;
  const lateCount = attendances.filter(a => a.status === 'late').length;
  const total = attendances.length;
  const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;
  return { presentCount, absentCount, lateCount, total, attendanceRate };
},

  // دریافت داشبورد دانش‌آموز (کلاس + درس‌ها)
getStudentDashboard: async () => {
  try {
    const response = await apiClient.get('/student/my-dashboard');
    console.log('[API] Student dashboard:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Get student dashboard error:', error);
    throw new Error(error.response?.data?.detail || 'مشکل در دریافت اطلاعات');
  }
},

getReportCard: async () => {
  try {
    const response = await apiClient.get('/student/report-card');
    console.log('[API] Report card:', response.data);
    return response.data;
  } catch (error) {
    console.error('[API] Get report card error:', error);
    throw new Error(error.response?.data?.detail || 'مشکل در دریافت کارنامه');
  }
},


};