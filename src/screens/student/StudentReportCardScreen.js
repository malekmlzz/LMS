import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants/colors';
import { studentPanelService } from '../../services/api/studentPanelService';
import { Loading } from '../../components/feedback/Loading';

const { width } = Dimensions.get('window');

const StudentReportCardScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);

  const loadData = async () => {
    try {
      const data = await studentPanelService.getReportCard();
      setReportData(data);
    } catch (error) {
      console.error('Load report card error:', error);
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

  const getGradeColor = (score) => {
    if (score >= 17) return COLORS.success;
    if (score >= 14) return COLORS.warning;
    return COLORS.error;
  };

  const getGradeIcon = (score) => {
    if (score >= 17) return 'emoji-events';
    if (score >= 14) return 'sentiment-satisfied';
    return 'sentiment-dissatisfied';
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 'عالی': return COLORS.success;
      case 'خیلی خوب': return '#2196F3';
      case 'خوب': return COLORS.warning;
      default: return COLORS.error;
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 'عالی': return 'stars';
      case 'خیلی خوب': return 'thumb-up';
      case 'خوب': return 'thumb-up';
      default: return 'warning';
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!reportData || reportData.total_lessons === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="insert-chart" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>گزارشی وجود ندارد</Text>
        <Text style={styles.emptyText}>شما در هیچ کلاسی ثبت‌نام نشده‌اید</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header با گرادینت */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Icon name="assessment" size={40} color="#fff" />
        <Text style={styles.headerTitle}>کارنامه تحصیلی</Text>
        <Text style={styles.headerSubtitle}>نیم‌سال اول ۱۴۰۴</Text>
      </LinearGradient>

      {/* کارت خلاصه عملکرد */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Icon name="analytics" size={22} color={COLORS.primary} />
          <Text style={styles.summaryTitle}>خلاصه عملکرد</Text>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reportData.overall_average}</Text>
            <Text style={styles.summaryLabel}>میانگین کل</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Icon name="check-circle" size={20} color={COLORS.success} />
            <Text style={styles.summaryValue}>{reportData.overall_attendance}%</Text>
            <Text style={styles.summaryLabel}>درصد حضور</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Icon name="menu-book" size={20} color={COLORS.primary} />
            <Text style={styles.summaryValue}>{reportData.total_lessons}</Text>
            <Text style={styles.summaryLabel}>تعداد دروس</Text>
          </View>
        </View>
      </View>

      {/* کارت رتبه */}
      <View style={[styles.rankCard, { backgroundColor: getRankColor(reportData.rank) + '15' }]}>
        <Icon name={getRankIcon(reportData.rank)} size={32} color={getRankColor(reportData.rank)} />
        <View style={styles.rankContent}>
          <Text style={styles.rankLabel}>وضعیت تحصیلی</Text>
          <Text style={[styles.rankValue, { color: getRankColor(reportData.rank) }]}>
            {reportData.rank}
          </Text>
        </View>
      </View>

      {/* درس برتر و درس ضعیف */}
      <View style={styles.highlightsRow}>
        {reportData.top_lesson && (
          <View style={[styles.highlightCard, { backgroundColor: COLORS.success + '10', borderColor: COLORS.success + '30' }]}>
            <Icon name="workspace-premium" size={32} color={COLORS.success} />
            <Text style={styles.highlightLabel}>درس برتر</Text>
            <Text style={styles.highlightName}>{reportData.top_lesson.lesson_name}</Text>
            <Text style={[styles.highlightScore, { color: COLORS.success }]}>
              {reportData.top_lesson.average}
            </Text>
          </View>
        )}
        {reportData.weak_lesson && (
          <View style={[styles.highlightCard, { backgroundColor: COLORS.error + '10', borderColor: COLORS.error + '30' }]}>
            <Icon name="warning" size={32} color={COLORS.error} />
            <Text style={styles.highlightLabel}>نیاز به تلاش</Text>
            <Text style={styles.highlightName}>{reportData.weak_lesson.lesson_name}</Text>
            <Text style={[styles.highlightScore, { color: COLORS.error }]}>
              {reportData.weak_lesson.average}
            </Text>
          </View>
        )}
      </View>

      {/* جدول دروس */}
      <View style={styles.tableHeaderWrapper}>
        <View style={styles.tableHeaderLeft}>
          <Icon name="menu-book" size={20} color={COLORS.primary} />
          <Text style={styles.tableTitle}>جزئیات دروس</Text>
        </View>
        <View style={styles.tableHeaderBadge}>
          <Text style={styles.tableHeaderBadgeText}>{reportData.report_cards.length} درس</Text>
        </View>
      </View>
      
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.cellLesson]}>درس</Text>
        <Text style={[styles.tableHeaderCell, styles.cellAverage]}>میانگین</Text>
        <Text style={[styles.tableHeaderCell, styles.cellAttendance]}>حضور</Text>
      </View>

      {reportData.report_cards.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.tableRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('StudentLessonDetail', {
            lessonId: item.lesson_id,
            lessonName: item.lesson_name,
            teacherName: item.teacher,
          })}
        >
          <View style={[styles.tableCell, styles.cellLesson]}>
            <Text style={styles.lessonName}>{item.lesson_name}</Text>
            {item.teacher && (
              <View style={styles.teacherRow}>
                <Icon name="person" size={12} color="#94A3B8" />
                <Text style={styles.teacherName}>{item.teacher}</Text>
              </View>
            )}
          </View>
          <View style={[styles.tableCell, styles.cellAverage]}>
            <Icon name={getGradeIcon(item.average)} size={16} color={getGradeColor(item.average)} />
            <Text style={[styles.averageText, { color: getGradeColor(item.average) }]}>
              {item.average}
            </Text>
          </View>
          <View style={[styles.tableCell, styles.cellAttendance]}>
            <Icon name="trending-up" size={14} color={item.attendance_rate >= 90 ? COLORS.success : COLORS.warning} />
            <Text style={styles.attendanceText}>{item.attendance_rate}%</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// نیاز به import LinearGradient
import { LinearGradient } from 'expo-linear-gradient';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 28,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 12, marginBottom: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  summaryItem: { alignItems: 'center', flex: 1, gap: 4 },
  summaryDivider: { width: 1, height: 50, backgroundColor: '#E2E8F0' },
  summaryValue: { fontSize: 28, fontWeight: 'bold', color: '#1E293B' },
  summaryLabel: { fontSize: 12, color: '#94A3B8' },
  
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  rankContent: { flex: 1 },
  rankLabel: { fontSize: 13, color: '#64748B' },
  rankValue: { fontSize: 20, fontWeight: 'bold' },
  
  highlightsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  highlightCard: { 
    flex: 1, 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center',
    borderWidth: 1,
  },
  highlightLabel: { fontSize: 12, color: '#64748B', marginTop: 8, marginBottom: 4 },
  highlightName: { fontSize: 14, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  highlightScore: { fontSize: 22, fontWeight: 'bold', marginTop: 6 },
  
  tableHeaderWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tableHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tableTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
  tableHeaderBadge: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tableHeaderBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  tableHeaderCell: { fontSize: 13, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  cellLesson: { flex: 2, textAlign: 'right' },
  cellAverage: { flex: 1, textAlign: 'center' },
  cellAttendance: { flex: 1, textAlign: 'center' },
  
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  tableCell: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  teacherName: { fontSize: 11, color: '#94A3B8' },
  averageText: { fontSize: 16, fontWeight: 'bold' },
  attendanceText: { fontSize: 13, fontWeight: '500', color: '#1E293B' },
  
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 20, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E293B' },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
});

export default StudentReportCardScreen;