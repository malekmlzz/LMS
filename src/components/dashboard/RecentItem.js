import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

const RecentItem = ({ name, subtitle, date, icon }) => {
  const formattedDate = new Date(date).toLocaleDateString('fa-IR');
  
  return (
    <View style={styles.item}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.date}>📅 {formattedDate}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  icon: { fontSize: 28, width: 44, textAlign: 'center' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.black },
  subtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  date: { fontSize: 11, color: COLORS.grayLight, marginTop: 4 },
});

export default RecentItem;
