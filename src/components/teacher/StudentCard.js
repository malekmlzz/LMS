import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Button } from '../ui/Button';

const StudentCard = ({ student, onAttendanceUpdate, onGradeUpdate }) => {
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [examType, setExamType] = useState('quiz');
  const [score, setScore] = useState('');

  const handleGradeSubmit = () => {
    const numScore = parseFloat(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 20) {
      alert('نمره باید بین ۰ تا ۲۰ باشد');
      return;
    }
    onGradeUpdate(student.id, examType, numScore);
    setGradeModalVisible(false);
    setScore('');
  };

  const calculateAverage = () => {
    if (!student.grades || student.grades.length === 0) return '-';
    const sum = student.grades.reduce((total, g) => total + g.score, 0);
    return (sum / student.grades.length).toFixed(1);
  };

  const getQuizScore = () => {
    const quiz = student.grades?.find(g => g.examType === 'quiz');
    return quiz ? quiz.score : '-';
  };

  const getHomeworkScore = () => {
    const homework = student.grades?.find(g => g.examType === 'homework');
    return homework ? homework.score : '-';
  };

  const getStatusColor = (status) => {
    if (student.attendanceStatus === status) {
      switch (status) {
        case 'present': return COLORS.success;
        case 'absent': return COLORS.error;
        case 'late': return COLORS.warning;
        default: return COLORS.gray;
      }
    }
    return COLORS.border;
  };

  const avgGrade = calculateAverage();

  return (
    <View style={styles.card}>
      {/* هدر با نام و دکمه‌ها */}
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{student.fullName}</Text>
        </View>
        <View style={styles.attendanceButtons}>
          <TouchableOpacity
            style={[styles.attendanceBtn, { backgroundColor: getStatusColor('present') }]}
            onPress={() => onAttendanceUpdate(student.id, 'present')}
          >
            <Text style={styles.attendanceBtnText}>حاضر</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceBtn, { backgroundColor: getStatusColor('absent') }]}
            onPress={() => onAttendanceUpdate(student.id, 'absent')}
          >
            <Text style={styles.attendanceBtnText}>غایب</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.attendanceBtn, { backgroundColor: getStatusColor('late') }]}
            onPress={() => onAttendanceUpdate(student.id, 'late')}
          >
            <Text style={styles.attendanceBtnText}>تأخیر</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ردیف نمرات */}
      <View style={styles.gradesRow}>
        <View style={styles.gradeItem}>
          <Text style={styles.gradeLabel}>📝 آزمون</Text>
          <Text style={styles.gradeValue}>{getQuizScore()}</Text>
        </View>
        <View style={styles.gradeItem}>
          <Text style={styles.gradeLabel}>📋 تکلیف</Text>
          <Text style={styles.gradeValue}>{getHomeworkScore()}</Text>
        </View>
        <View style={styles.gradeItem}>
          <Text style={styles.gradeLabel}>📊 میانگین</Text>
          <Text style={styles.gradeValue}>{avgGrade}</Text>
        </View>
        <TouchableOpacity
          style={styles.addGradeBtn}
          onPress={() => setGradeModalVisible(true)}
        >
          <Text style={styles.addGradeBtnText}>+ ثبت نمره</Text>
        </TouchableOpacity>
      </View>

      {/* Modal ثبت نمره */}
      <Modal visible={gradeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ثبت نمره</Text>
            <Text style={styles.modalSubtitle}>{student.fullName}</Text>
            <View style={styles.examOptions}>
              <TouchableOpacity
                style={[styles.examBtn, examType === 'quiz' && styles.examBtnActive]}
                onPress={() => setExamType('quiz')}
              >
                <Text style={[styles.examBtnText, examType === 'quiz' && { color: COLORS.white }]}>آزمون</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.examBtn, examType === 'homework' && styles.examBtnActive]}
                onPress={() => setExamType('homework')}
              >
                <Text style={[styles.examBtnText, examType === 'homework' && { color: COLORS.white }]}>تکلیف</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.examBtn, examType === 'midterm' && styles.examBtnActive]}
                onPress={() => setExamType('midterm')}
              >
                <Text style={[styles.examBtnText, examType === 'midterm' && { color: COLORS.white }]}>میان‌ترم</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.examBtn, examType === 'final' && styles.examBtnActive]}
                onPress={() => setExamType('final')}
              >
                <Text style={[styles.examBtnText, examType === 'final' && { color: COLORS.white }]}>پایان‌ترم</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.scoreInput}
              placeholder="نمره (۰ تا ۲۰)"
              keyboardType="numeric"
              value={score}
              onChangeText={setScore}
            />
            <View style={styles.modalButtons}>
              <Button title="لغو" onPress={() => setGradeModalVisible(false)} variant="outline" />
              <Button title="ثبت" onPress={handleGradeSubmit} />
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flex: 1,
    marginRight: 80
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  attendanceButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  attendanceBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  attendanceBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.black,
  },
  gradesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  gradeItem: {
    flex: 1,
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginBottom: 2,
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  addGradeBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addGradeBtnText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 16,
  },
  examOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  examBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  examBtnActive: {
    backgroundColor: COLORS.primary,
  },
  examBtnText: {
    fontSize: 12,
    color: COLORS.black,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
});

export default StudentCard;
