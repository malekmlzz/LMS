import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GradeCard = ({ lesson, average, exams }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getScoreColor = (score) => {
    if (score >= 17) return COLORS.success;
    if (score >= 14) return COLORS.warning;
    return COLORS.error;
  };

  const getExamTypeIcon = (type) => {
    switch (type) {
      case 'آزمون': return '📝';
      case 'تکلیف': return '📋';
      case 'فعالیت کلاسی': return '📊';
      default: return '📌';
    }
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
        <View style={styles.titleContainer}>
          <Text style={styles.lessonIcon}>📖</Text>
          <Text style={styles.lessonName}>{lesson}</Text>
        </View>
        <View style={styles.averageContainer}>
          <Text style={[styles.averageValue, { color: getScoreColor(parseFloat(average)) }]}>
            {average}
          </Text>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <Text style={styles.detailsTitle}>جزئیات نمرات:</Text>
          {exams.map((exam, index) => (
            <View key={index} style={styles.examItem}>
              <View style={styles.examInfo}>
                <Text style={styles.examIcon}>{getExamTypeIcon(exam.type)}</Text>
                <Text style={styles.examType}>{exam.type}</Text>
              </View>
              <Text style={[styles.examScore, { color: getScoreColor(exam.score) }]}>
                {exam.score}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lessonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  lessonName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  averageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.gray,
  },
  details: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 10,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  examInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  examIcon: {
    fontSize: 14,
  },
  examType: {
    fontSize: 13,
    color: COLORS.gray,
  },
  examScore: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default GradeCard;
