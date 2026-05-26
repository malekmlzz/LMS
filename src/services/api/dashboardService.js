import { teacherManagementService } from './teacherManagementService';
import { studentManagementService } from './studentManagementService';

export const dashboardService = {
  // دریافت آمار کلی
  getStats: async () => {
    try {
      const teachers = await teacherManagementService.getTeachers();
      const students = await studentManagementService.getStudents();
      
      // محاسبه تعداد کلاس‌ها و درس‌ها
      let totalClasses = 0;
      let totalLessons = 0;
      
      for (const teacher of teachers) {
        // این تابع الان وجود داره
        const teacherClasses = await teacherManagementService.getTeacherClasses(teacher.id);
        totalClasses += teacherClasses.length;
        
        for (const cls of teacherClasses) {
          const lessons = await teacherManagementService.getClassLessons(cls.id);
          totalLessons += lessons.length;
        }
      }
      
      // آمار پایه‌های تحصیلی
      const gradeStats = {};
      for (const student of students) {
        const grade = student.grade || 'نامشخص';
        gradeStats[grade] = (gradeStats[grade] || 0) + 1;
      }
      
      return {
        teachersCount: teachers.length,
        studentsCount: students.length,
        classesCount: totalClasses,
        lessonsCount: totalLessons,
        gradeStats,
        recentTeachers: teachers.slice(-5).reverse(),
        recentStudents: students.slice(-5).reverse(),
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      // برگرداندن دیتای پیش‌فرض در صورت خطا
      return {
        teachersCount: 0,
        studentsCount: 0,
        classesCount: 0,
        lessonsCount: 0,
        gradeStats: {},
        recentTeachers: [],
        recentStudents: [],
      };
    }
  },
  
  // دریافت روند تغییرات
  getTrends: async () => {
    try {
      const teachers = await teacherManagementService.getTeachers();
      const students = await studentManagementService.getStudents();
      
      // گروه‌بندی بر اساس ماه
      const monthlyData = {};
      
      teachers.forEach(teacher => {
        const month = new Date(teacher.createdAt).toLocaleDateString('fa-IR', { month: 'long' });
        if (!monthlyData[month]) monthlyData[month] = { teachers: 0, students: 0 };
        monthlyData[month].teachers++;
      });
      
      students.forEach(student => {
        const month = new Date(student.createdAt).toLocaleDateString('fa-IR', { month: 'long' });
        if (!monthlyData[month]) monthlyData[month] = { teachers: 0, students: 0 };
        monthlyData[month].students++;
      });
      
      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        teachers: data.teachers,
        students: data.students,
      }));
    } catch (error) {
      console.error('Trends error:', error);
      return [];
    }
  },
};