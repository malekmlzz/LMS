import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ReportCard = ({ className, teacher, average, attendanceRate, totalClasses }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const getGradeColor = (avg) => {
    const numAvg = parseFloat(avg);
    if (numAvg >= 17) return COLORS.success;
    if (numAvg >= 14) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.header} onPress={toggleExpand} activeOpacity={0.7}>
        <View>
          <Text style={styles.className}>{className}</Text>
          <Text style={styles.teacher}>👨‍🏫 {teacher}</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.averageBox}>
            <Text style={[styles.averageValue, { color: getGradeColor(average) }]}>
              {average}
            </Text>
            <Text style={styles.averageLabel}>میانگین</Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>تعداد جلسات:</Text>
            <Text style={styles.detailValue}>{totalClasses} جلسه</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>درصد حضور:</Text>
            <Text style={[styles.detailValue, { color: parseFloat(attendanceRate) >= 90 ? COLORS.success : COLORS.warning }]}>
              {attendanceRate}%
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>وضعیت تحصیلی:</Text>
            <Text style={[styles.detailValue, { color: getGradeColor(average) }]}>
              {parseFloat(average) >= 17 ? 'عالی' : parseFloat(average) >= 14 ? 'خوب' : 'نیاز به تلاش بیشتر'}
            </Text>
          </View>
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
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  teacher: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  averageBox: {
    alignItems: 'center',
  },
  averageValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  averageLabel: {
    fontSize: 10,
    color: COLORS.gray,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.black,
  },
});

export default ReportCard;
