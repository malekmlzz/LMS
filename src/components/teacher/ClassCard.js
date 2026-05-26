import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ClassCard = ({ classItem, onPress }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📚</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{classItem.name}</Text>
            <Text style={styles.code}>کد: {classItem.code}</Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>پایه</Text>
            <Text style={styles.detailValue}>{classItem.grade || 'نامشخص'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>تعداد دانش‌آموز</Text>
            <Text style={styles.detailValue}>{classItem.studentsCount || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.lessonsContainer}>
          <Text style={styles.lessonsTitle}>📖 درس‌های این کلاس</Text>
          {classItem.lessons && classItem.lessons.length > 0 ? (
            classItem.lessons.map((lesson) => (
              <View key={lesson.id} style={styles.lessonItem}>
                <View style={styles.lessonHeader}>
                  <Text style={styles.lessonName}>{lesson.name}</Text>
                  <Text style={styles.lessonCode}>{lesson.code}</Text>
                </View>
                <View style={styles.lessonSchedule}>
                  <Text style={styles.scheduleIcon}>📅</Text>
                  <Text style={styles.scheduleText}>{lesson.schedule}</Text>
                </View>
                <Text style={styles.lessonCredits}>واحد: {lesson.credits}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noLessons}>هیچ درسی برای این کلاس ثبت نشده است</Text>
          )}
          <TouchableOpacity style={styles.detailBtn} onPress={onPress}>
            <Text style={styles.detailBtnText}>مشاهده دانش‌آموزان →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  icon: { fontSize: 24 },
  info: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  code: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  expandIcon: { fontSize: 16, color: COLORS.primary, padding: 8 },
  details: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: COLORS.border, paddingVertical: 12, marginBottom: 8 },
  detailItem: { flex: 1, alignItems: 'center' },
  detailLabel: { fontSize: 11, color: COLORS.gray },
  detailValue: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 4 },
  lessonsContainer: { marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  lessonsTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  lessonItem: { backgroundColor: COLORS.background, borderRadius: 10, padding: 12, marginBottom: 8 },
  lessonHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  lessonName: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  lessonCode: { fontSize: 11, color: COLORS.gray },
  lessonSchedule: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  scheduleIcon: { fontSize: 12, marginRight: 6 },
  scheduleText: { fontSize: 12, color: COLORS.primary },
  lessonCredits: { fontSize: 11, color: COLORS.gray },
  noLessons: { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', textAlign: 'center', paddingVertical: 12 },
  detailBtn: { marginTop: 8, alignItems: 'flex-end' },
  detailBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});

export default ClassCard;
