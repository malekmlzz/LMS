import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { studentPanelService } from '../../services/api/studentPanelService';
import GradeCard from '../../components/student/GradeCard';
import AttendanceCard from '../../components/student/AttendanceCard';

const StudentClassDetailScreen = ({ route, navigation }) => {
  const { classId, className } = route.params;
  const [grades, setGrades] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [gradesData, attendancesData] = await Promise.all([
        studentPanelService.getClassGrades(classId),
        studentPanelService.getClassAttendances(classId),
      ]);
      setGrades(gradesData);
      setAttendances(attendancesData);
      setAttendanceStats(studentPanelService.getAttendanceStats(attendancesData));
    } catch (error) {
      console.error(error);
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

  // گروه‌بندی نمرات بر اساس درس
  const groupedGrades = () => {
    const groups = {};
    grades.forEach(grade => {
      if (!groups[grade.lessonName]) {
        groups[grade.lessonName] = [];
      }
      groups[grade.lessonName].push(grade);
    });
    
    return Object.keys(groups).map(lesson => ({
      lesson,
      average: groups[lesson].reduce((sum, g) => sum + g.score, 0) / groups[lesson].length,
      exams: groups[lesson].map(g => ({
        type: g.examType === 'quiz' ? 'آزمون' : g.examType === 'homework' ? 'تکلیف' : g.examType === 'midterm' ? 'میان‌ترم' : 'پایان‌ترم',
        score: g.score,
      })),
    }));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>در حال بارگذاری...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{className}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← بازگشت</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.infoCard}>
          <AttendanceCard className={className} stats={attendanceStats} />
        </View>

        <Text style={styles.sectionTitle}>📖 نمرات دروس</Text>
        {groupedGrades().length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>هیچ نمره‌ای ثبت نشده است</Text>
          </View>
        ) : (
          groupedGrades().map((item, index) => (
            <GradeCard
              key={index}
              lesson={item.lesson}
              average={item.average.toFixed(2)}
              exams={item.exams}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: COLORS.primary, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  backBtn: { fontSize: 14, color: COLORS.white },
  infoCard: { margin: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black, marginHorizontal: 16, marginTop: 16, marginBottom: 12 },
  emptyCard: { backgroundColor: COLORS.white, marginHorizontal: 16, padding: 30, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14, color: COLORS.gray },
});

export default StudentClassDetailScreen;
