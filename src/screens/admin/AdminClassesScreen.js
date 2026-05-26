import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { classManagementService } from '../../services/api/classManagementService';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import AnimatedModal from '../../components/ui/AnimatedModal';
import { Loading } from '../../components/feedback/Loading';

const AdminClassesScreen = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serverError, setServerError] = useState('');
  
  // Modal states for Class
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', code: '', grade: '' });
  const [classErrors, setClassErrors] = useState({});
  const [classSubmitting, setClassSubmitting] = useState(false);
  
  // Modal states for Lesson
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({ name: '', schedule: '' });
  const [lessonErrors, setLessonErrors] = useState({});
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  
  // Delete confirm modals
  const [deleteClassConfirmVisible, setDeleteClassConfirmVisible] = useState(false);
  const [deleteLessonConfirmVisible, setDeleteLessonConfirmVisible] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  const showSuccess = (message) => {
    Alert.alert('✅ موفق', message);
  };

  const showError = (message) => {
    setServerError(message);
    Alert.alert('❌ خطا', message);
  };

  const loadClasses = async () => {
    try {
      const data = await classManagementService.getClasses();
      const classesWithLessons = [];
      
      for (let i = 0; i < data.length; i++) {
        const cls = data[i];
        try {
          const lessons = await classManagementService.getClassLessons(cls.id);
          classesWithLessons.push({ ...cls, lessons: lessons || [] });
        } catch (error) {
          classesWithLessons.push({ ...cls, lessons: [] });
        }
      }
      setClasses(classesWithLessons);
      setServerError('');
    } catch (error) {
      console.error('Load classes error:', error);
      showError(error.message || 'مشکل در دریافت کلاس‌ها');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadClasses(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadClasses();
  };

  // ========== مدیریت کلاس ==========
  const validateClassForm = () => {
    const errors = {};
    if (!classForm.name.trim()) errors.name = 'نام کلاس الزامی است';
    setClassErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClass = async () => {
    if (!validateClassForm()) return;
    
    setClassSubmitting(true);
    setServerError('');
    
    try {
      if (editingClass) {
        await classManagementService.updateClass(editingClass.id, {
          name: classForm.name,
          code: classForm.code,
          grade: classForm.grade,
        });
        showSuccess('اطلاعات کلاس بروزرسانی شد');
      } else {
        await classManagementService.addClass({
          name: classForm.name,
          code: classForm.code,
          grade: classForm.grade,
        });
        showSuccess('کلاس جدید اضافه شد');
      }
      setClassModalVisible(false);
      resetClassForm();
      loadClasses();
    } catch (error) {
      showError(error.message);
    } finally {
      setClassSubmitting(false);
    }
  };

  const handleDeleteClass = (classItem) => {
    setClassToDelete(classItem);
    setDeleteClassConfirmVisible(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    
    try {
      await classManagementService.deleteClass(classToDelete.id);
      setDeleteClassConfirmVisible(false);
      setClassToDelete(null);
      loadClasses();
      showSuccess('کلاس با موفقیت حذف شد');
    } catch (error) {
      showError(error.message);
    }
  };

  const cancelDeleteClass = () => {
    setDeleteClassConfirmVisible(false);
    setClassToDelete(null);
  };

  const resetClassForm = () => {
    setClassForm({ name: '', code: '', grade: '' });
    setClassErrors({});
    setEditingClass(null);
    setServerError('');
  };

  const openAddClassModal = () => {
    resetClassForm();
    setClassModalVisible(true);
  };

  const openEditClassModal = (classItem) => {
    setEditingClass(classItem);
    setClassForm({
      name: classItem.name,
      code: classItem.code,
      grade: classItem.grade || '',
    });
    setClassModalVisible(true);
  };

  // ========== مدیریت درس ==========
  const validateLessonForm = () => {
    const errors = {};
    if (!lessonForm.name.trim()) errors.name = 'نام درس الزامی است';
    setLessonErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddLesson = async () => {
    if (!validateLessonForm()) return;
    
    setLessonSubmitting(true);
    setServerError('');
    
    try {
      if (editingLesson) {
        await classManagementService.updateLesson(editingLesson.id, {
          name: lessonForm.name,
          schedule: lessonForm.schedule,
        });
        showSuccess('اطلاعات درس بروزرسانی شد');
      } else {
        await classManagementService.addLesson(selectedClass.id, {
          name: lessonForm.name,
          schedule: lessonForm.schedule,
        });
        showSuccess('درس جدید اضافه شد');
      }
      setLessonModalVisible(false);
      resetLessonForm();
      loadClasses();
    } catch (error) {
      showError(error.message);
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = (lesson) => {
    setLessonToDelete(lesson);
    setDeleteLessonConfirmVisible(true);
  };

  const confirmDeleteLesson = async () => {
    if (!lessonToDelete) return;
    
    try {
      await classManagementService.deleteLesson(lessonToDelete.id);
      setDeleteLessonConfirmVisible(false);
      setLessonToDelete(null);
      loadClasses();
      showSuccess('درس با موفقیت حذف شد');
    } catch (error) {
      showError(error.message);
    }
  };

  const cancelDeleteLesson = () => {
    setDeleteLessonConfirmVisible(false);
    setLessonToDelete(null);
  };

  const resetLessonForm = () => {
    setLessonForm({ name: '', schedule: '' });
    setLessonErrors({});
    setEditingLesson(null);
    setServerError('');
  };

  const openAddLessonModal = (classItem) => {
    setSelectedClass(classItem);
    resetLessonForm();
    setLessonModalVisible(true);
  };

  const openEditLessonModal = (classItem, lesson) => {
    setSelectedClass(classItem);
    setEditingLesson(lesson);
    setLessonForm({
      name: lesson.name,
      schedule: lesson.schedule || '',
    });
    setLessonModalVisible(true);
  };

  // ========== رندر کارت کلاس ==========
  const renderClassCard = ({ item: cls }) => (
    <View style={styles.classCard}>
      <View style={styles.classHeader}>
        <View style={styles.classIconContainer}>
          <Icon name="class" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.classInfo}>
          <Text style={styles.className}>{cls.name}</Text>
          <View style={styles.classMeta}>
            <Icon name="fingerprint" size={12} color="#94A3B8" />
            <Text style={styles.classMetaText}>کد: {cls.code}</Text>
            <View style={styles.metaDivider} />
            <Icon name="menu-book" size={12} color="#94A3B8" />
            <Text style={styles.classMetaText}>پایه: {cls.grade || 'نامشخص'}</Text>
          </View>
        </View>
        <View style={styles.classActions}>
          <TouchableOpacity onPress={() => openEditClassModal(cls)} style={styles.actionBtn}>
            <Icon name="edit" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteClass(cls)} style={styles.actionBtn}>
            <Icon name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openAddLessonModal(cls)} style={[styles.actionBtn, styles.addLessonBtn]}>
            <Icon name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* درس‌های کلاس */}
      <View style={styles.lessonsContainer}>
        <View style={styles.lessonsHeader}>
          <Icon name="menu-book" size={16} color={COLORS.primary} />
          <Text style={styles.lessonsTitle}>درس‌های این کلاس</Text>
          <View style={styles.lessonsCount}>
            <Text style={styles.lessonsCountText}>{cls.lessons?.length || 0}</Text>
          </View>
        </View>
        
        {cls.lessons && cls.lessons.length > 0 ? (
          cls.lessons.map((lesson) => (
            <View key={lesson.id} style={styles.lessonItem}>
              <View style={styles.lessonIconContainer}>
                <Icon name="book" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonName}>{lesson.name}</Text>
                {lesson.schedule && (
                  <View style={styles.lessonScheduleRow}>
                    <Icon name="schedule" size={12} color="#94A3B8" />
                    <Text style={styles.lessonSchedule}>{lesson.schedule}</Text>
                  </View>
                )}
              </View>
              <View style={styles.lessonActions}>
                <TouchableOpacity onPress={() => openEditLessonModal(cls, lesson)} style={styles.lessonActionBtn}>
                  <Icon name="edit" size={18} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLesson(lesson)} style={styles.lessonActionBtn}>
                  <Icon name="delete" size={18} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noLessonsContainer}>
            <Icon name="inbox" size={32} color="#CBD5E1" />
            <Text style={styles.noLessons}>هیچ درسی برای این کلاس ثبت نشده است</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="class" size={24} color="#fff" />
          <Text style={styles.headerTitle}>مدیریت کلاس‌ها</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddClassModal}>
          <Icon name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>کلاس جدید</Text>
        </TouchableOpacity>
      </View>

      {/* Server Error */}
      {serverError ? (
        <View style={styles.serverErrorContainer}>
          <Icon name="error" size={20} color="#EF4444" />
          <Text style={styles.serverErrorText}>{serverError}</Text>
        </View>
      ) : null}

      {/* List of Classes */}
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderClassCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="class" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>هیچ کلاسی ثبت نشده است</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddClassModal}>
              <Icon name="add" size={18} color="#fff" />
              <Text style={styles.emptyAddBtnText}>افزودن کلاس جدید</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* MODAL: افزودن/ویرایش کلاس */}
      <AnimatedModal visible={classModalVisible} onClose={() => setClassModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Icon name={editingClass ? "edit" : "add-circle"} size={32} color={COLORS.primary} />
            <Text style={styles.modalTitle}>
              {editingClass ? 'ویرایش کلاس' : 'افزودن کلاس جدید'}
            </Text>
          </View>
          
          <Input
            label="نام کلاس"
            value={classForm.name}
            onChangeText={(v) => setClassForm({ ...classForm, name: v })}
            placeholder="مثال: کلاس دهم تجربی"
            icon="🏫"
            error={classErrors.name}
          />
          
          <Input
            label="کد کلاس (اختیاری)"
            value={classForm.code}
            onChangeText={(v) => setClassForm({ ...classForm, code: v })}
            placeholder="مثال: MATH101"
            icon="🔑"
          />
          
          <Input
            label="پایه تحصیلی (اختیاری)"
            value={classForm.grade}
            onChangeText={(v) => setClassForm({ ...classForm, grade: v })}
            placeholder="مثال: دهم"
            icon="📚"
          />
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setClassModalVisible(false)} variant="outline" />
            <Button title={editingClass ? 'بروزرسانی' : 'افزودن'} onPress={handleAddClass} loading={classSubmitting} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* MODAL: افزودن/ویرایش درس */}
      <AnimatedModal visible={lessonModalVisible} onClose={() => setLessonModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Icon name="menu-book" size={32} color={COLORS.primary} />
            <Text style={styles.modalTitle}>
              {editingLesson ? 'ویرایش درس' : 'افزودن درس جدید'}
            </Text>
          </View>
          <Text style={styles.modalSubtitle}>
            کلاس: {selectedClass?.name}
          </Text>
          
          <Input
            label="نام درس"
            value={lessonForm.name}
            onChangeText={(v) => setLessonForm({ ...lessonForm, name: v })}
            placeholder="مثال: ریاضی ۲"
            icon="📖"
            error={lessonErrors.name}
          />
          
          <Input
            label="زمان برگزاری (اختیاری)"
            value={lessonForm.schedule}
            onChangeText={(v) => setLessonForm({ ...lessonForm, schedule: v })}
            placeholder="شنبه: ۱۲-۱۳"
            icon="⏰"
          />
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setLessonModalVisible(false)} variant="outline" />
            <Button title={editingLesson ? 'بروزرسانی' : 'افزودن'} onPress={handleAddLesson} loading={lessonSubmitting} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* MODAL: تایید حذف کلاس */}
      <AnimatedModal visible={deleteClassConfirmVisible} onClose={cancelDeleteClass}>
        <View style={styles.deleteConfirmContainer}>
          <Icon name="warning" size={48} color={COLORS.error} />
          <Text style={styles.deleteConfirmTitle}>حذف کلاس</Text>
          <Text style={styles.deleteConfirmMessage}>
            آیا از حذف کلاس "{classToDelete?.name}" مطمئن هستید؟
          </Text>
          <Text style={styles.deleteConfirmWarning}>
            ⚠️ توجه: با حذف این کلاس، تمام درس‌های آن نیز حذف خواهند شد.
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <Button title="لغو" onPress={cancelDeleteClass} variant="outline" />
            <Button title="حذف" onPress={confirmDeleteClass} style={{ backgroundColor: COLORS.error }} />
          </View>
        </View>
      </AnimatedModal>

      {/* MODAL: تایید حذف درس */}
      <AnimatedModal visible={deleteLessonConfirmVisible} onClose={cancelDeleteLesson}>
        <View style={styles.deleteConfirmContainer}>
          <Icon name="warning" size={48} color={COLORS.error} />
          <Text style={styles.deleteConfirmTitle}>حذف درس</Text>
          <Text style={styles.deleteConfirmMessage}>
            آیا از حذف درس "{lessonToDelete?.name}" مطمئن هستید؟
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <Button title="لغو" onPress={cancelDeleteLesson} variant="outline" />
            <Button title="حذف" onPress={confirmDeleteLesson} style={{ backgroundColor: COLORS.error }} />
          </View>
        </View>
      </AnimatedModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    paddingTop: 48,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 12,
  },
  addButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  
  serverErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  serverErrorText: { fontSize: 13, color: '#EF4444', flex: 1 },
  
  listContent: { padding: 16, paddingBottom: 30 },
  
  classCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  classHeader: { flexDirection: 'row', marginBottom: 16 },
  classIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  classMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  classMetaText: { fontSize: 11, color: '#64748B' },
  metaDivider: { width: 1, height: 10, backgroundColor: '#E2E8F0', marginHorizontal: 4 },
  classActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: { padding: 6 },
  addLessonBtn: { 
    backgroundColor: COLORS.success, 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 10,
  },
  
  lessonsContainer: { 
    marginTop: 8, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E2E8F0',
  },
  lessonsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  lessonsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.primary, flex: 1 },
  lessonsCount: {
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  lessonsCountText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  
  lessonItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F8FAFC', 
    padding: 12, 
    borderRadius: 14, 
    marginBottom: 8,
  },
  lessonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonInfo: { flex: 1 },
  lessonName: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  lessonScheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  lessonSchedule: { fontSize: 11, color: '#64748B' },
  lessonActions: { flexDirection: 'row', gap: 12 },
  lessonActionBtn: { padding: 4 },
  
  noLessonsContainer: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  noLessons: { fontSize: 12, color: '#94A3B8', textAlign: 'center' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  emptyAddBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 14,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '600' },
  
  modalHeader: { alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  
  deleteConfirmContainer: { alignItems: 'center', padding: 16, gap: 12 },
  deleteConfirmTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.error, textAlign: 'center' },
  deleteConfirmMessage: { fontSize: 15, color: '#1E293B', textAlign: 'center' },
  deleteConfirmWarning: { fontSize: 12, color: '#F59E0B', textAlign: 'center' },
  deleteConfirmButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%', marginTop: 8 },
});

export default AdminClassesScreen;