import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const AttendanceCard = ({ className, stats }) => {
  const { presentCount, absentCount, lateCount, total, attendanceRate } = stats;
  
  const getRateColor = () => {
    const rate = parseFloat(attendanceRate);
    if (rate >= 90) return COLORS.success;
    if (rate >= 75) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.className}>{className}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{presentCount}</Text>
          <Text style={styles.statLabel}>حاضر</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.error }]}>{absentCount}</Text>
          <Text style={styles.statLabel}>غایب</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{lateCount}</Text>
          <Text style={styles.statLabel}>تأخیر</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>جلسات</Text>
        </View>
      </View>
      
      <View style={styles.rateContainer}>
        <View style={styles.rateBar}>
          <View 
            style={[
              styles.rateFill, 
              { width: `${attendanceRate}%`, backgroundColor: getRateColor() }
            ]} 
          />
        </View>
        <Text style={[styles.rateText, { color: getRateColor() }]}>
          درصد حضور: {attendanceRate}%
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 4,
  },
  rateContainer: {
    marginTop: 8,
  },
  rateBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    borderRadius: 4,
  },
  rateText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AttendanceCard;
