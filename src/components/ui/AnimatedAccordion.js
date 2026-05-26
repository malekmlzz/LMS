import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS } from '../../constants/colors';

// فعال کردن LayoutAnimation برای اندروید
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const AnimatedAccordion = ({
  title,
  titleRight,
  children,
  expanded: externalExpanded,
  onToggle,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newState = !isExpanded;
    if (externalExpanded === undefined) {
      setInternalExpanded(newState);
    }
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleToggle} style={styles.header} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {titleRight && <View style={styles.headerRight}>{titleRight}</View>}
      </TouchableOpacity>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  expandIcon: {
    fontSize: 14,
    color: COLORS.primary,
    width: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
});

export default AnimatedAccordion;
