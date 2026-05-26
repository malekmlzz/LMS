// services/api/teacherPanelService.js
import apiClient from './client';

export const teacherPanelService = {
  // ========== کلاس‌های معلم ==========
  getMyClasses: async () => {
    try {
      const response = await apiClient.get('/teacher/my-classes');
      console.log('[API] My classes:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get my classes error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت کلاس‌ها');
    }
  },
  
  // ========== درس‌های معلم در یک کلاس ==========
  getMyClassLessons: async (classId) => {
    try {
      const response = await apiClient.get(`/teacher/classes/${classId}/my-lessons`);
      console.log(`[API] My lessons for class ${classId}:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get my class lessons error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت درس‌ها');
    }
  },
  
  // ========== دریافت دانش‌آموزان برای یک درس خاص با فیلتر تاریخ ==========
  getClassStudentsForLesson: async (classId, lessonId, examDate = null) => {
    try {
      const params = {};
      if (examDate) {
        params.exam_date = examDate;
      }
      const response = await apiClient.get(`/teacher/classes/${classId}/lessons/${lessonId}/students`, {
        params
      });
      console.log(`[API] Students for class ${classId} lesson ${lessonId} on date ${examDate}:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get class students for lesson error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت دانش‌آموزان');
    }
  },
  
  // ========== دریافت حضور غیاب یک درس در تاریخ مشخص ==========
  getAttendanceByClassLessonAndDate: async (classId, lessonId, date) => {
    try {
      console.log(`[API] Getting attendance for class ${classId}, lesson ${lessonId} on date ${date}`);
      const response = await apiClient.get(`/teacher/classes/${classId}/lessons/${lessonId}/attendance`, {
        params: { date }
      });
      console.log(`[API] Attendance data:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Get attendance error:', error);
      return [];
    }
  },
  
  // ========== ثبت حضور غیاب ==========
  recordAttendance: async (classId, lessonId, studentId, date, status) => {
    try {
      console.log(`[API] Recording attendance: class=${classId}, lesson=${lessonId}, student=${studentId}, date=${date}, status=${status}`);
      
      const response = await apiClient.post(`/teacher/attendance`, {
        class_id: classId,
        lesson_id: lessonId,
        student_id: studentId,
        date: date,
        status: status
      });
      
      console.log(`[API] Attendance recorded successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Record attendance error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در ثبت حضور غیاب');
    }
  },
  
  // ========== دریافت حضور غیاب یک دانش‌آموز در یک درس خاص ==========
  getStudentAttendanceForLesson: async (studentId, classId, lessonId) => {
    try {
      const response = await apiClient.get(`/teacher/students/${studentId}/attendance`, {
        params: { class_id: classId, lesson_id: lessonId }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Get student attendance error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت حضور غیاب دانش‌آموز');
    }
  },
  
  // ========== دریافت آمار حضور غیاب ==========
  getStudentAttendanceStatsForLesson: async (studentId, classId, lessonId) => {
    try {
      const attendances = await teacherPanelService.getStudentAttendanceForLesson(studentId, classId, lessonId);
      
      const presentCount = attendances.filter(a => a.status === 'present').length;
      const absentCount = attendances.filter(a => a.status === 'absent').length;
      const lateCount = attendances.filter(a => a.status === 'late').length;
      const total = attendances.length;
      const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;
      
      return { presentCount, absentCount, lateCount, total, attendanceRate };
    } catch (error) {
      console.error('[API] Get student attendance stats error:', error);
      return { presentCount: 0, absentCount: 0, lateCount: 0, total: 0, attendanceRate: 0 };
    }
  },
  
  // ========== ثبت نمره ==========
  addGrade: async (classId, lessonId, studentId, examType, score, examDate = null) => {
    try {
      const payload = {
        class_id: classId,
        lesson_id: lessonId,
        student_id: studentId,
        exam_type: examType,
        score: score,
      };
      if (examDate) {
        payload.exam_date = examDate;
      }
      
      const response = await apiClient.post(`/teacher/grade`, payload);
      console.log('[API] Grade added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('[API] Add grade error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در ثبت نمره');
    }
  },
  
  // ========== دریافت نمرات یک دانش‌آموز در یک درس خاص ==========
  getStudentGradesForLesson: async (studentId, classId, lessonId) => {
    try {
      const response = await apiClient.get(`/teacher/students/${studentId}/grades`, {
        params: { class_id: classId, lesson_id: lessonId }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Get student grades error:', error);
      throw new Error(error.response?.data?.detail || 'مشکل در دریافت نمرات');
    }
  },
  
  // ========== دریافت نمرات بر اساس تاریخ و درس ==========
  getStudentGradesByDateForLesson: async (studentId, classId, lessonId, examDate) => {
    try {
      const response = await apiClient.get(`/teacher/students/${studentId}/grades`, {
        params: { 
          class_id: classId,
          lesson_id: lessonId,
          exam_date: examDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('[API] Get student grades by date error:', error);
      return [];
    }
  },
  
  // ========== محاسبه میانگین نمرات یک دانش‌آموز در یک درس خاص ==========
  getStudentAverageForLesson: async (studentId, classId, lessonId) => {
    try {
      const grades = await teacherPanelService.getStudentGradesForLesson(studentId, classId, lessonId);
      if (grades.length === 0) return 0;
      
      const sum = grades.reduce((total, g) => total + g.score, 0);
      return (sum / grades.length).toFixed(2);
    } catch (error) {
      console.error('[API] Get student average error:', error);
      return 0;
    }
  },
  
  // ========== دریافت میانگین تجمعی برای یک درس (تا تاریخ جاری) ==========
  getCumulativeAverageForLesson: async (studentId, classId, lessonId, examDate) => {
    try {
      const response = await apiClient.get(`/teacher/students/${studentId}/grades`, {
        params: {
          class_id: classId,
          lesson_id: lessonId,
          exam_date: examDate,
          cumulative: true
        }
      });
      const grades = response.data;
      if (grades.length === 0) return 0;
      const sum = grades.reduce((total, g) => total + g.score, 0);
      return (sum / grades.length).toFixed(2);
    } catch (error) {
      console.error('[API] Get cumulative average error:', error);
      return 0;
    }
  }
};