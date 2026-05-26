import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { teacherPanelService } from '../../services/api/teacherPanelService';
import { Loading } from '../../components/feedback/Loading';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

// توابع تبدیل تاریخ شمسی
const toJalali = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const jalaliYear = year - 621;
  let jalaliMonth = month + 9;
  let jalaliDay = day;
  
  if (jalaliMonth > 12) {
    jalaliMonth -= 12;
  }
  
  return {
    year: jalaliYear,
    month: jalaliMonth,
    day: jalaliDay,
    formatted: `${jalaliYear}/${jalaliMonth.toString().padStart(2, '0')}/${jalaliDay.toString().padStart(2, '0')}`
  };
};

const toGregorian = (jalaliYear, jalaliMonth, jalaliDay) => {
  let gregorianYear = jalaliYear + 621;
  let gregorianMonth = jalaliMonth - 9;
  let gregorianDay = jalaliDay;
  
  if (gregorianMonth <= 0) {
    gregorianMonth += 12;
    gregorianYear -= 1;
  }
  
  return new Date(gregorianYear, gregorianMonth - 1, gregorianDay);
};

const getCurrentJalali = () => toJalali(new Date());
const parseJalaliDate = (jalaliString) => {
  const parts = jalaliString.split('/');
  if (parts.length === 3) {
    return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
  }
  return null;
};

const TeacherClassDetailScreen = ({ route, navigation }) => {
  const { classId, className } = route.params;
  
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [students, setStudents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const currentJalali = getCurrentJalali();
  const [jalaliDate, setJalaliDate] = useState(currentJalali.formatted);
  
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [examType, setExamType] = useState('quiz');
  const [score, setScore] = useState('');
  const [gradeSubmitting, setGradeSubmitting] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});

  const convertToGregorianForAPI = (jalaliDateStr) => {
    const parsed = parseJalaliDate(jalaliDateStr);
    if (parsed) {
      const gregorianDate = toGregorian(parsed.year, parsed.month, parsed.day);
      const year = gregorianDate.getFullYear();
      const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
      const day = String(gregorianDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null;
  };

  const loadLessons = async () => {
    try {
      const data = await teacherPanelService.getMyClassLessons(classId);
      setLessons(data);
      if (data.length > 0 && !selectedLesson) {
        setSelectedLesson(data[0]);
      }
    } catch (error) {
      console.error('Load lessons error:', error);
      Alert.alert('خطا', error.message);
    }
  };

  const loadStudentsForLesson = async () => {
    if (!selectedLesson) return;
    
    try {
      const gregorianDate = convertToGregorianForAPI(jalaliDate);
      const data = await teacherPanelService.getClassStudentsForLesson(
        classId, 
        selectedLesson.id, 
        gregorianDate
      );
      setStudents(data);
      
      const attendanceMap = {};
      data.forEach(student => {
        if (student.attendance_status) {
          attendanceMap[student.id] = student.attendance_status;
        }
      });
      setAttendanceData(attendanceMap);
      
    } catch (error) {
      console.error('Load students error:', error);
      Alert.alert('خطا', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await loadLessons();
    setLoading(false);
  };

  useFocusEffect(useCallback(() => {
    loadAllData();
  }, [classId]));

  useFocusEffect(useCallback(() => {
    if (selectedLesson) {
      loadStudentsForLesson();
    }
  }, [selectedLesson, jalaliDate]));

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentsForLesson();
  };

  const handleDateChange = (text) => {
    if (/^[\d\/]*$/.test(text) && text.length <= 10) {
      setJalaliDate(text);
      if (text.length === 10 && text.includes('/')) {
        const parsed = parseJalaliDate(text);
        if (parsed && parsed.year >= 1300 && parsed.year <= 1500 && 
            parsed.month >= 1 && parsed.month <= 12 && 
            parsed.day >= 1 && parsed.day <= 31) {
          // تاریخ تغییر کرد
        }
      }
    }
  };

  const handleAttendanceUpdate = async (studentId, status) => {
    if (!selectedLesson) {
      Alert.alert('خطا', 'لطفاً ابتدا یک درس انتخاب کنید');
      return;
    }
    
    try {
      const gregorianDate = convertToGregorianForAPI(jalaliDate);
      await teacherPanelService.recordAttendance(classId, selectedLesson.id, studentId, gregorianDate, status);
      setAttendanceData(prev => ({ ...prev, [studentId]: status }));
      Alert.alert('موفق', 'وضعیت حضور با موفقیت ثبت شد');
    } catch (error) {
      Alert.alert('خطا', error.message);
    }
  };

  const handleGradeSubmit = async () => {
    if (!selectedLesson) {
      Alert.alert('خطا', 'لطفاً ابتدا یک درس انتخاب کنید');
      return;
    }
    
    if (!score || parseFloat(score) < 0 || parseFloat(score) > 20) {
      Alert.alert('خطا', 'نمره باید بین 0 تا 20 باشد');
      return;
    }

    setGradeSubmitting(true);
    try {
      const gregorianDate = convertToGregorianForAPI(jalaliDate);
      await teacherPanelService.addGrade(classId, selectedLesson.id, selectedStudent.id, examType, parseFloat(score), gregorianDate);
      Alert.alert('موفق', 'نمره با موفقیت ثبت شد');
      setGradeModalVisible(false);
      setScore('');
      setExamType('quiz');
      setSelectedStudent(null);
      await loadStudentsForLesson();
    } catch (error) {
      Alert.alert('خطا', error.message);
    } finally {
      setGradeSubmitting(false);
    }
  };

  const openGradeModal = (student) => {
    setSelectedStudent(student);
    setScore('');
    setExamType('quiz');
    setGradeModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return COLORS.success;
      case 'absent': return COLORS.error;
      case 'late': return COLORS.warning;
      default: return COLORS.border;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غایب';
      case 'late': return 'تأخیر';
      default: return 'ثبت نشده';
    }
  };

  const getExamTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return 'assignment';
      case 'homework': return 'assignment';
      case 'midterm': return 'bar-chart';
      case 'final': return 'workspace-premium';
      default: return 'star';
    }
  };

  const getExamTypeLabel = (type) => {
    switch (type) {
      case 'quiz': return 'آزمون';
      case 'homework': return 'تکلیف';
      case 'midterm': return 'میان‌ترم';
      case 'final': return 'پایان‌ترم';
      default: return type;
    }
  };

  const getAverageColor = (avg) => {
    if (!avg) return COLORS.gray;
    if (avg >= 17) return COLORS.success;
    if (avg >= 14) return COLORS.warning;
    return COLORS.error;
  };

  const renderLessonSelector = () => {
    if (lessons.length === 0) {
      return (
        <View style={styles.noLessonCard}>
          <Icon name="info" size={32} color={COLORS.warning} />
          <Text style={styles.noLessonText}>هیچ درسی به شما تخصیص داده نشده است</Text>
          <Text style={styles.noLessonSubText}>لطفاً با مدیریت تماس بگیرید</Text>
        </View>
      );
    }

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.lessonSelector}
        contentContainerStyle={styles.lessonSelectorContent}
      >
        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={[
              styles.lessonTab,
              selectedLesson?.id === lesson.id && styles.lessonTabActive
            ]}
            onPress={() => setSelectedLesson(lesson)}
          >
            <Icon name="menu-book" size={20} color={selectedLesson?.id === lesson.id ? '#fff' : COLORS.primary} />
            <Text style={[
              styles.lessonTabText,
              selectedLesson?.id === lesson.id && styles.lessonTabTextActive
            ]}>
              {lesson.name}
            </Text>
            {lesson.schedule && (
              <View style={styles.lessonTabScheduleRow}>
                <Icon name="schedule" size={10} color={selectedLesson?.id === lesson.id ? 'rgba(255,255,255,0.7)' : '#94A3B8'} />
                <Text style={[
                  styles.lessonTabSchedule,
                  selectedLesson?.id === lesson.id && styles.lessonTabScheduleActive
                ]}>{lesson.schedule}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderStudentCard = ({ item }) => {
    const currentStatus = attendanceData[item.id];
    const displayGrades = item.grades || [];
    const cumulativeAverage = item.average;
    
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.studentInfo}>
            <Text style={styles.studentName}>{item.full_name}</Text>
            <View style={styles.studentUsernameRow}>
              <Icon name="person" size={12} color="#94A3B8" />
              <Text style={styles.studentUsername}>{item.username}</Text>
            </View>
          </View>
          <View style={styles.attendanceButtons}>
            <TouchableOpacity
              style={[styles.attendanceBtn, currentStatus === 'present' && styles.attendanceBtnPresent]}
              onPress={() => handleAttendanceUpdate(item.id, 'present')}>
              <Icon name="check" size={14} color={currentStatus === 'present' ? '#fff' : '#64748B'} />
              <Text style={[styles.attendanceBtnText, currentStatus === 'present' && styles.attendanceBtnTextActive]}>حاضر</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceBtn, currentStatus === 'absent' && styles.attendanceBtnAbsent]}
              onPress={() => handleAttendanceUpdate(item.id, 'absent')}>
              <Icon name="close" size={14} color={currentStatus === 'absent' ? '#fff' : '#64748B'} />
              <Text style={[styles.attendanceBtnText, currentStatus === 'absent' && styles.attendanceBtnTextActive]}>غایب</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.attendanceBtn, currentStatus === 'late' && styles.attendanceBtnLate]}
              onPress={() => handleAttendanceUpdate(item.id, 'late')}>
              <Icon name="access-time" size={14} color={currentStatus === 'late' ? '#fff' : '#64748B'} />
              <Text style={[styles.attendanceBtnText, currentStatus === 'late' && styles.attendanceBtnTextActive]}>تأخیر</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.gradesContainer}>
          <View style={styles.gradesHeader}>
            <Icon name="grade" size={14} color={COLORS.primary} />
            <Text style={styles.gradesTitle}>نمرات درس {selectedLesson?.name}</Text>
            <Text style={styles.gradesDate}>({jalaliDate})</Text>
          </View>
          <View style={styles.gradesList}>
            {displayGrades.length > 0 ? (
              displayGrades.map((grade, index) => (
                <View key={index} style={styles.gradeTag}>
                  <Icon name={getExamTypeIcon(grade.exam_type)} size={12} color={COLORS.primary} />
                  <Text style={styles.gradeTagText}>
                    {getExamTypeLabel(grade.exam_type)}: {grade.score}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.noGradesRow}>
                <Icon name="inbox" size={16} color="#94A3B8" />
                <Text style={styles.noGradesText}>هیچ نمره‌ای ثبت نشده است</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.averageCard}>
          <View style={styles.averageRow}>
            <View style={styles.averageLabelRow}>
              <Icon name="analytics" size={14} color={COLORS.primary} />
              <Text style={styles.averageLabel}>میانگین درس {selectedLesson?.name}</Text>
            </View>
            <Text style={[styles.averageValue, { color: getAverageColor(cumulativeAverage) }]}>
              {cumulativeAverage !== null && cumulativeAverage !== undefined ? cumulativeAverage : '---'}
            </Text>
          </View>
          {cumulativeAverage !== null && cumulativeAverage !== undefined && (
            <View style={styles.averageBar}>
              <View 
                style={[
                  styles.averageBarFill, 
                  { width: `${(cumulativeAverage / 20) * 100}%`, 
                    backgroundColor: getAverageColor(cumulativeAverage) }
                ]} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.studentFooter}>
          <View style={styles.statusRow}>
            <Icon name="event" size={14} color={getStatusColor(currentStatus)} />
            <Text style={styles.statusText}>
              وضعیت: <Text style={{ color: getStatusColor(currentStatus), fontWeight: 'bold' }}>
                {getStatusText(currentStatus)}
              </Text>
            </Text>
          </View>
          <TouchableOpacity style={styles.gradeBtn} onPress={() => openGradeModal(item)}>
            <Icon name="edit" size={14} color="#fff" />
            <Text style={styles.gradeBtnText}>ثبت نمره</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && lessons.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{className}</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderLessonSelector()}

      <View style={styles.infoBar}>
        <View style={styles.dateContainer}>
          <Icon name="date-range" size={18} color="#64748B" />
          <Text style={styles.dateLabel}>تاریخ (شمسی):</Text>
          <TextInput
            style={styles.dateInput}
            value={jalaliDate}
            onChangeText={handleDateChange}
            placeholder="1403/01/01"
            keyboardType="default"
          />
        </View>
        <View style={styles.studentsCount}>
          <Icon name="people" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>{students.length} دانش‌آموز</Text>
        </View>
      </View>

      {!selectedLesson ? (
        <View style={styles.emptyContainer}>
          <Icon name="menu-book" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>لطفاً یک درس انتخاب کنید</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderStudentCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="people" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>هیچ دانش‌آموزی در این کلاس ثبت نشده است</Text>
            </View>
          }
        />
      )}

      <Modal visible={gradeModalVisible} transparent animationType="fade" onRequestClose={() => setGradeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="edit" size={28} color={COLORS.primary} />
              <Text style={styles.modalTitle}>ثبت نمره</Text>
            </View>
            <Text style={styles.modalSubtitle}>دانش‌آموز: {selectedStudent?.full_name}</Text>
            <Text style={styles.modalSubtitle}>درس: {selectedLesson?.name}</Text>
            <Text style={styles.modalSubtitle}>تاریخ: {jalaliDate}</Text>
            
            <View style={styles.examTypeContainer}>
              <Text style={styles.examTypeLabel}>نوع امتحان:</Text>
              <View style={styles.examTypeButtons}>
                <TouchableOpacity style={[styles.examTypeBtn, examType === 'quiz' && styles.examTypeBtnActive]} onPress={() => setExamType('quiz')}>
                  <Icon name="assignment" size={16} color={examType === 'quiz' ? '#fff' : '#64748B'} />
                  <Text style={[styles.examTypeBtnText, examType === 'quiz' && styles.examTypeBtnTextActive]}>آزمون</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.examTypeBtn, examType === 'homework' && styles.examTypeBtnActive]} onPress={() => setExamType('homework')}>
                  <Icon name="assignment" size={16} color={examType === 'homework' ? '#fff' : '#64748B'} />
                  <Text style={[styles.examTypeBtnText, examType === 'homework' && styles.examTypeBtnTextActive]}>تکلیف</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.examTypeBtn, examType === 'midterm' && styles.examTypeBtnActive]} onPress={() => setExamType('midterm')}>
                  <Icon name="bar-chart" size={16} color={examType === 'midterm' ? '#fff' : '#64748B'} />
                  <Text style={[styles.examTypeBtnText, examType === 'midterm' && styles.examTypeBtnTextActive]}>میان‌ترم</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.examTypeBtn, examType === 'final' && styles.examTypeBtnActive]} onPress={() => setExamType('final')}>
                  <Icon name="workspace-premium" size={16} color={examType === 'final' ? '#fff' : '#64748B'} />
                  <Text style={[styles.examTypeBtnText, examType === 'final' && styles.examTypeBtnTextActive]}>پایان‌ترم</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Input label="نمره (0 تا 20)" value={score} onChangeText={setScore} placeholder="مثال: 17.5" keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <Button title="لغو" onPress={() => setGradeModalVisible(false)} variant="outline" />
              <Button title="ثبت نمره" onPress={handleGradeSubmit} loading={gradeSubmitting} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    paddingTop: 48,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  backBtn: { padding: 8 },
  
  lessonSelector: { maxHeight: 90, marginTop: 12 },
  lessonSelectorContent: { paddingHorizontal: 16, gap: 12 },
  lessonTab: { 
    backgroundColor: '#fff', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6,
  },
  lessonTabActive: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary,
  },
  lessonTabText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#1E293B',
  },
  lessonTabTextActive: { 
    color: '#fff',
  },
  lessonTabScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonTabSchedule: {
    fontSize: 10,
    color: '#94A3B8',
  },
  lessonTabScheduleActive: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  noLessonCard: {
    backgroundColor: '#FEF3C7',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  noLessonText: { fontSize: 14, fontWeight: 'bold', color: '#92400E' },
  noLessonSubText: { fontSize: 12, color: '#B45309' },
  
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
  },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#1E293B',
    backgroundColor: '#fff',
    width: 110,
  },
  studentsCount: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  
  listContent: { padding: 16, paddingTop: 0 },
  
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  studentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  studentUsernameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  studentUsername: { fontSize: 12, color: '#94A3B8' },
  
  attendanceButtons: { flexDirection: 'row', gap: 8 },
  attendanceBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  attendanceBtnPresent: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  attendanceBtnAbsent: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  attendanceBtnLate: { backgroundColor: COLORS.warning, borderColor: COLORS.warning },
  attendanceBtnText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  attendanceBtnTextActive: { color: '#fff' },
  
  gradesContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  gradesHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  gradesTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  gradesDate: { fontSize: 11, color: '#94A3B8' },
  gradesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4,
    backgroundColor: '#fff', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gradeTagText: { fontSize: 11, color: COLORS.primary },
  noGradesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  noGradesText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  
  averageCard: {
    backgroundColor: COLORS.primary + '8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  averageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  averageLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  averageLabel: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  averageValue: { fontSize: 18, fontWeight: 'bold' },
  averageBar: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 10, overflow: 'hidden' },
  averageBarFill: { height: '100%', borderRadius: 3 },
  
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, color: '#64748B' },
  gradeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
  },
  gradeBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 20 },
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  modalSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 8 },
  examTypeContainer: { marginBottom: 16 },
  examTypeLabel: { fontSize: 14, fontWeight: '500', color: '#1E293B', marginBottom: 10 },
  examTypeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  examTypeBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 24, 
    backgroundColor: '#F1F5F9',
  },
  examTypeBtnActive: { backgroundColor: COLORS.primary },
  examTypeBtnText: { fontSize: 13, color: '#64748B' },
  examTypeBtnTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
});

export default TeacherClassDetailScreen;