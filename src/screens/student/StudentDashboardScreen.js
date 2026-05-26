import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { studentPanelService } from '../../services/api/studentPanelService';
import { storage } from '../../utils/storage';
import { Loading } from '../../components/feedback/Loading';

const StudentDashboardScreen = ({ navigation }) => {
  const [classInfo, setClassInfo] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const loadData = async () => {
    try {
      const user = await storage.getUser();
      setStudentName(user?.full_name || 'دانش‌آموز');
      setSchoolName(user?.school_name || 'مدرسه');

      const data = await studentPanelService.getStudentDashboard();
      console.log('Dashboard data:', data);
      
      setClassInfo(data.class);
      setLessons(data.lessons);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getInitial = () => {
    if (studentName) return studentName.charAt(0);
    return 'د';
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header با طراحی شاد */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>سلام 👋</Text>
            <Text style={styles.studentName}>{studentName}</Text>
            <View style={styles.schoolBadge}>
              <Icon name="business" size={14} color="#fff" />
              <Text style={styles.schoolName}>{schoolName}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('StudentProfile')}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* کارت آمار */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="menu-book" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{lessons.length}</Text>
          <Text style={styles.statLabel}>درس فعال</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="school" size={28} color="#10B981" />
          <Text style={styles.statNumber}>{classInfo?.name || '---'}</Text>
          <Text style={styles.statLabel}>کلاس من</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="star" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>۱۴۰۴</Text>
          <Text style={styles.statLabel}>سال تحصیلی</Text>
        </View>
      </View>

      {/* کارت کلاس دانش‌آموز */}
      {classInfo ? (
        <View style={styles.classCard}>
          <View style={styles.classCardHeader}>
            <Icon name="class" size={24} color={COLORS.primary} />
            <Text style={styles.classCardTitle}>کلاس من</Text>
          </View>
          <Text style={styles.className}>{classInfo.name}</Text>
          <View style={styles.classDetails}>
            <View style={styles.classDetailItem}>
              <Icon name="fingerprint" size={16} color="#64748B" />
              <Text style={styles.classDetailText}>کد: {classInfo.code}</Text>
            </View>
            <View style={styles.classDetailItem}>
              <Icon name="menu-book" size={16} color="#64748B" />
              <Text style={styles.classDetailText}>پایه: {classInfo.grade || 'نامشخص'}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyClassCard}>
          <Icon name="warning" size={48} color="#F59E0B" />
          <Text style={styles.emptyClassTitle}>شما در هیچ کلاسی ثبت‌نام نشده‌اید</Text>
          <Text style={styles.emptyClassSubtitle}>لطفاً با مدیریت مدرسه تماس بگیرید</Text>
        </View>
      )}

      {/* عنوان درس‌ها */}
      <View style={styles.sectionHeader}>
        <Icon name="menu-book" size={22} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>درس‌های من</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{lessons.length} درس</Text>
        </View>
      </View>

      {/* لیست درس‌ها */}
      {lessons.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="book" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>هیچ درسی برای این کلاس تعریف نشده است</Text>
        </View>
      ) : (
        lessons.map((lesson, index) => (
          <TouchableOpacity
            key={lesson.id}
            style={[styles.lessonCard, { marginTop: index === 0 ? 0 : 12 }]}
            onPress={() => {
              console.log('=== Navigating to lesson detail with ID:', lesson.id);
              navigation.navigate('StudentLessonDetail', {
                lessonId: lesson.id,
                lessonName: lesson.name,
                teacherName: lesson.teacher_name,
                schedule: lesson.schedule
              });
            }}
            activeOpacity={0.7}
          >
            <View style={styles.lessonIconContainer}>
              <Icon name="menu-book" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.lessonContent}>
              <View style={styles.lessonHeader}>
                <Text style={styles.lessonName}>{lesson.name}</Text>
                {lesson.code && <Text style={styles.lessonCode}>{lesson.code}</Text>}
              </View>
              {lesson.teacher_name && (
                <View style={styles.lessonInfoRow}>
                  <Icon name="person" size={14} color="#64748B" />
                  <Text style={styles.lessonTeacher}>{lesson.teacher_name}</Text>
                </View>
              )}
              {lesson.schedule && (
                <View style={styles.lessonInfoRow}>
                  <Icon name="schedule" size={14} color="#64748B" />
                  <Text style={styles.lessonSchedule}>{lesson.schedule}</Text>
                </View>
              )}
            </View>
            <Icon name="chevron-right" size={24} color="#CBD5E1" />
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
  header: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  schoolName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  profileButton: {
    borderRadius: 40,
    overflow: 'hidden',
    marginLeft: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  
  // Class Card
  classCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  classCardTitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  className: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  classDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classDetailText: {
    fontSize: 13,
    color: '#64748B',
  },
  
  // Empty Class Card
  emptyClassCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyClassTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyClassSubtitle: {
    fontSize: 12,
    color: '#B45309',
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Lesson Card
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  lessonIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  lessonContent: {
    flex: 1,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  lessonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  lessonCode: {
    fontSize: 11,
    color: '#94A3B8',
  },
  lessonInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  lessonTeacher: {
    fontSize: 13,
    color: '#64748B',
  },
  lessonSchedule: {
    fontSize: 13,
    color: COLORS.primary,
  },
  
  // Empty Card
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
  },
});

export default StudentDashboardScreen;