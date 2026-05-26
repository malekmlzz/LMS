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
import { teacherPanelService } from '../../services/api/teacherPanelService';
import { storage } from '../../utils/storage';
import { Loading } from '../../components/feedback/Loading';

const TeacherDashboardScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const loadData = async () => {
    try {
      const user = await storage.getUser();
      setTeacherName(user?.full_name || 'معلم');
      setSchoolName(user?.school_name || 'مدرسه');

      const data = await teacherPanelService.getMyClasses();
      console.log('Classes with teacher lessons:', data);
      setClasses(data);
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
    if (teacherName) {
      return teacherName.charAt(0);
    }
    return 'م';
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
      {/* Header با طراحی حرفه‌ای */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>خوش آمدید 👋</Text>
            <Text style={styles.teacherName}>{teacherName}</Text>
            <View style={styles.schoolBadge}>
              <Icon name="business" size={14} color="#fff" />
              <Text style={styles.schoolName}>{schoolName}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('TeacherProfile')}
          >
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{getInitial()}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>به پنل معلم خوش آمدید</Text>
      </View>

      {/* کارت آمار */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="class" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>{classes.length}</Text>
          <Text style={styles.statLabel}>کلاس فعال</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="people" size={28} color="#10B981" />
          <Text style={styles.statNumber}>
            {classes.reduce((sum, cls) => sum + (cls.students_count || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>دانش‌آموز</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="menu-book" size={28} color="#F59E0B" />
          <Text style={styles.statNumber}>
            {classes.reduce((sum, cls) => sum + (cls.teacher_lessons?.length || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>درس تدریسی</Text>
        </View>
      </View>

      {/* عنوان کلاس‌ها */}
      <View style={styles.sectionHeader}>
        <Icon name="class" size={22} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>کلاس‌های من</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{classes.length} کلاس</Text>
        </View>
      </View>

      {classes.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="inbox" size={56} color="#CBD5E1" />
          <Text style={styles.emptyText}>هیچ کلاسی به شما تخصیص داده نشده است</Text>
        </View>
      ) : (
        classes.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={styles.classCard}
            onPress={() => navigation.navigate('TeacherClassDetail', { 
              classId: cls.id, 
              className: cls.name 
            })}
            activeOpacity={0.7}
          >
            {/* هدر کلاس */}
            <View style={styles.classHeader}>
              <View style={styles.classIconContainer}>
                <Icon name="class" size={24} color={COLORS.primary} />
              </View>
              <View style={styles.classHeaderInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classCode}>کد: {cls.code}</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#CBD5E1" />
            </View>

            {/* اطلاعات کلاس */}
            <View style={styles.classInfo}>
              {cls.grade && (
                <View style={styles.infoItem}>
                  <Icon name="menu-book" size={14} color="#64748B" />
                  <Text style={styles.infoText}>پایه: {cls.grade}</Text>
                </View>
              )}
              <View style={styles.infoItem}>
                <Icon name="people" size={14} color="#64748B" />
                <Text style={styles.infoText}>{cls.students_count || 0} دانش‌آموز</Text>
              </View>
              <View style={styles.infoItem}>
                <Icon name="menu-book" size={14} color="#64748B" />
                <Text style={styles.infoText}>{cls.teacher_lessons?.length || 0} درس</Text>
              </View>
            </View>

            {/* درس‌هایی که معلم در این کلاس تدریس می‌کند */}
            {cls.teacher_lessons && cls.teacher_lessons.length > 0 ? (
              <View style={styles.teacherLessonsContainer}>
                <View style={styles.teacherLessonsHeader}>
                  <Icon name="menu-book" size={14} color={COLORS.primary} />
                  <Text style={styles.teacherLessonsTitle}>درس‌هایی که تدریس می‌کنید:</Text>
                </View>
                <View style={styles.teacherLessonsList}>
                  {cls.teacher_lessons.map((lesson) => (
                    <View key={lesson.id} style={styles.teacherLessonTag}>
                      <Text style={styles.teacherLessonName}>{lesson.name}</Text>
                      {lesson.schedule && (
                        <View style={styles.teacherLessonScheduleRow}>
                          <Icon name="schedule" size={10} color="#94A3B8" />
                          <Text style={styles.teacherLessonSchedule}>{lesson.schedule}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noTeacherLessonContainer}>
                <Icon name="info" size={20} color={COLORS.warning} />
                <Text style={styles.noTeacherLessonText}>
                  شما هنوز درسی برای این کلاس انتخاب نکرده‌اید
                </Text>
              </View>
            )}

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetails}>مشاهده کلاس</Text>
              <Icon name="arrow-forward" size={16} color={COLORS.primary} />
            </View>
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
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTextContainer: { flex: 1 },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  teacherName: {
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
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
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
  
  // Class Card
  classCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  classIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  classHeaderInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  classCode: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  classInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
  },
  
  // Teacher Lessons Section
  teacherLessonsContainer: {
    backgroundColor: COLORS.primary + '5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  teacherLessonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  teacherLessonsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  teacherLessonsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teacherLessonTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    minWidth: 80,
  },
  teacherLessonName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  teacherLessonScheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  teacherLessonSchedule: {
    fontSize: 10,
    color: '#94A3B8',
  },
  
  noTeacherLessonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  noTeacherLessonText: {
    fontSize: 12,
    color: COLORS.warning,
  },
  
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewDetails: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  
  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 50,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default TeacherDashboardScreen;