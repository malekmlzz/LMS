// components/student/LessonCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

const LessonCard = ({ lesson, onPress }) => {
  // دریافت روز و ساعت از schedule
  const getDayAndTime = () => {
    if (lesson.schedule) {
      const parts = lesson.schedule.split(' ');
      if (parts.length >= 2) {
        return { day: parts[0], time: parts[1] };
      }
    }
    return { day: lesson.day || 'نامشخص', time: lesson.time || 'نامشخص' };
  };

  const { day, time } = getDayAndTime();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.lessonName}>{lesson.name}</Text>
        {lesson.code && <Text style={styles.lessonCode}>{lesson.code}</Text>}
      </View>
      
      <View style={styles.details}>
        {lesson.teacher_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👨‍🏫</Text>
            <Text style={styles.detailText}>{lesson.teacher_name}</Text>
          </View>
        )}
        {lesson.class_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🏫</Text>
            <Text style={styles.detailText}>{lesson.class_name}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>{day} - {time}</Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>مشاهده جزئیات →</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  lessonCode: {
    fontSize: 12,
    color: COLORS.gray,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailIcon: {
    fontSize: 14,
    width: 28,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  footer: {
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default LessonCard;