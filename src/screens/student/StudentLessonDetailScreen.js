import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { studentPanelService } from '../../services/api/studentPanelService';
import { Loading } from '../../components/feedback/Loading';

const { width } = Dimensions.get('window');

const StudentLessonDetailScreen = ({ route, navigation }) => {
  const { lessonId, lessonName, teacherName, schedule } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [grades, setGrades] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    total: 0,
    attendanceRate: 0,
  });
  const [average, setAverage] = useState(0);

  const loadData = async () => {
    try {
      const gradesData = await studentPanelService.getLessonGrades(lessonId);
      
      if (gradesData && Array.isArray(gradesData)) {
        setGrades(gradesData);
        
        if (gradesData.length > 0) {
          const sum = gradesData.reduce((total, g) => total + (g.score || 0), 0);
          const avg = (sum / gradesData.length).toFixed(2);
          setAverage(avg);
        }
      }
      
      const attendancesData = await studentPanelService.getLessonAttendances(lessonId);
      
      if (attendancesData && Array.isArray(attendancesData)) {
        const presentCount = attendancesData.filter(a => a.status === 'present').length;
        const absentCount = attendancesData.filter(a => a.status === 'absent').length;
        const lateCount = attendancesData.filter(a => a.status === 'late').length;
        const total = attendancesData.length;
        const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;
        
        setAttendanceStats({
          presentCount,
          absentCount,
          lateCount,
          total,
          attendanceRate,
        });
      }
      
    } catch (error) {
      console.error('Load lesson detail error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [lessonId]));

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (rate) => {
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  const getGradeColor = (score) => {
    if (score >= 17) return COLORS.success;
    if (score >= 14) return COLORS.warning;
    return COLORS.error;
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

  const convertToJalali = (gregorianDate) => {
    if (!gregorianDate) return 'تاریخ نامشخص';
    try {
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
      return `${jalaliYear}/${jalaliMonth.toString().padStart(2, '0')}/${jalaliDay.toString().padStart(2, '0')}`;
    } catch (e) {
      return gregorianDate;
    }
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
      {/* Header با آیکون */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Icon name="menu-book" size={28} color="#fff" />
          <Text style={styles.headerTitle}>{lessonName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* اطلاعات درس */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconCircle}>
            <Icon name="person" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>معلم</Text>
            <Text style={styles.infoValue}>{teacherName || 'نامشخص'}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <View style={styles.infoIconCircle}>
            <Icon name="schedule" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>زمان برگزاری</Text>
            <Text style={styles.infoValue}>{schedule || 'نامشخص'}</Text>
          </View>
        </View>
      </View>

      {/* کارت آمار حضور غیاب */}
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <Icon name="people" size={22} color={COLORS.primary} />
          <Text style={styles.statsTitle}>آمار حضور غیاب</Text>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{attendanceStats.total}</Text>
            <Text style={styles.statLabel}>جلسات</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="check-circle" size={20} color={COLORS.success} />
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {attendanceStats.presentCount}
            </Text>
            <Text style={styles.statLabel}>حاضر</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="cancel" size={20} color={COLORS.error} />
            <Text style={[styles.statValue, { color: COLORS.error }]}>
              {attendanceStats.absentCount}
            </Text>
            <Text style={styles.statLabel}>غایب</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Icon name="access-time" size={20} color={COLORS.warning} />
            <Text style={[styles.statValue, { color: COLORS.warning }]}>
              {attendanceStats.lateCount}
            </Text>
            <Text style={styles.statLabel}>تأخیر</Text>
          </View>
        </View>
        
        <View style={styles.rateContainer}>
          <View style={styles.rateBar}>
            <View 
              style={[
                styles.rateFill, 
                { width: `${Math.min(attendanceStats.attendanceRate, 100)}%`, 
                  backgroundColor: getStatusColor(attendanceStats.attendanceRate) }
              ]} 
            />
          </View>
          <Text style={[styles.rateText, { color: getStatusColor(attendanceStats.attendanceRate) }]}>
            درصد حضور: {attendanceStats.attendanceRate}%
          </Text>
        </View>
      </View>

      {/* کارت میانگین نمرات */}
      <View style={styles.averageCard}>
        <Icon name="analytics" size={32} color={COLORS.primary} />
        <Text style={styles.averageLabel}>میانگین نمرات درس</Text>
        <Text style={[styles.averageValue, { color: getGradeColor(parseFloat(average)) }]}>
          {average || '---'}
        </Text>
        <View style={styles.averageBar}>
          <View 
            style={[
              styles.averageFill, 
              { width: `${Math.min((average / 20) * 100, 100)}%`, 
                backgroundColor: getGradeColor(parseFloat(average)) }
            ]} 
          />
        </View>
        <Text style={styles.averageHint}>از ۲۰ نمره</Text>
      </View>

      {/* لیست نمرات */}
      <View style={styles.gradesHeader}>
        <View style={styles.gradesHeaderLeft}>
          <Icon name="grade" size={22} color={COLORS.primary} />
          <Text style={styles.gradesHeaderTitle}>لیست نمرات</Text>
        </View>
        <View style={styles.gradesHeaderCount}>
          <Text style={styles.gradesHeaderCountText}>{grades.length}</Text>
        </View>
      </View>

      {grades.length === 0 ? (
        <View style={styles.emptyCard}>
          <Icon name="inbox" size={56} color="#CBD5E1" />
          <Text style={styles.emptyText}>هیچ نمره‌ای برای این درس ثبت نشده است</Text>
        </View>
      ) : (
        grades.map((grade, index) => (
          <View key={grade.id || index} style={styles.gradeCard}>
            <View style={styles.gradeCardLeft}>
              <View style={styles.gradeIconContainer}>
                <Icon name={getExamTypeIcon(grade.exam_type)} size={26} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.gradeType}>{getExamTypeLabel(grade.exam_type)}</Text>
                <View style={styles.gradeDateRow}>
                  <Icon name="date-range" size={12} color="#94A3B8" />
                  <Text style={styles.gradeDate}>
                    {convertToJalali(grade.exam_date)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.gradeCardRight}>
              <Text style={[styles.gradeScore, { color: getGradeColor(grade.score) }]}>
                {grade.score}
              </Text>
              <Text style={styles.gradeMaxScore}>/ 20</Text>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { padding: 4 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoTextContainer: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 14 },
  
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, flex: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1, gap: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#94A3B8' },
  statDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0' },
  
  rateContainer: { marginTop: 20 },
  rateBar: { height: 8, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  rateFill: { height: '100%', borderRadius: 4 },
  rateText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 10 },
  
  averageCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  averageLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '500', marginTop: 12, marginBottom: 8 },
  averageValue: { fontSize: 52, fontWeight: 'bold' },
  averageBar: { width: '70%', height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  averageFill: { height: '100%', borderRadius: 3 },
  averageHint: { fontSize: 11, color: '#94A3B8', marginTop: 8 },
  
  gradesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  gradesHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradesHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  gradesHeaderCount: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  gradesHeaderCountText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  
  gradeCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  gradeCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  gradeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeType: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  gradeDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gradeDate: { fontSize: 11, color: '#94A3B8' },
  gradeCardRight: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  gradeScore: { fontSize: 28, fontWeight: 'bold' },
  gradeMaxScore: { fontSize: 12, color: '#94A3B8' },
  
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 50,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});

export default StudentLessonDetailScreen;