import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';

const StatCard = ({ title, value, icon, color, onPress }) => {
  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  icon: { fontSize: 28, marginBottom: 8 },
  value: { fontSize: 24, fontWeight: 'bold', color: COLORS.white, marginBottom: 4 },
  title: { fontSize: 12, color: COLORS.white, opacity: 0.9 },
});

export default StatCard;
