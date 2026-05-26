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
import { teacherManagementService } from '../../services/api/teacherManagementService';
import { classManagementService } from '../../services/api/classManagementService';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import AnimatedModal from '../../components/ui/AnimatedModal';
import { Loading } from '../../components/feedback/Loading';

const AdminTeachersScreen = () => {
  const [teachers, setTeachers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [assignClassModalVisible, setAssignClassModalVisible] = useState(false);
  const [addLessonModalVisible, setAddLessonModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classLessons, setClassLessons] = useState([]);
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteClassConfirmVisible, setDeleteClassConfirmVisible] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
    Alert.alert('موفق', message);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
    Alert.alert('خطا', message);
  };

  const loadTeachers = async () => {
    try {
      const data = await teacherManagementService.getTeachers();
      setTeachers(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadAvailableClasses = async () => {
    try {
      const data = await teacherManagementService.getAvailableClasses();
      setAvailableClasses(data);
    } catch (error) {
      console.error('Load classes error:', error);
    }
  };

  useFocusEffect(useCallback(() => { 
    loadTeachers(); 
    loadAvailableClasses();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadTeachers();
    loadAvailableClasses();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'نام کامل الزامی است';
    }
    
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = 'ایمیل نامعتبر است';
      }
    }
    
    if (!formData.username.trim()) {
      errors.username = 'نام کاربری الزامی است';
    } else if (formData.username.length < 3) {
      errors.username = 'نام کاربری حداقل ۳ کاراکتر باید باشد';
    }
    
    if (!editingTeacher && !formData.password.trim()) {
      errors.password = 'رمز عبور الزامی است';
    } else if (!editingTeacher && formData.password.length < 6) {
      errors.password = 'رمز عبور حداقل ۶ کاراکتر باید باشد';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'رمز عبور جدید الزامی است';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'رمز عبور حداقل ۶ کاراکتر باید باشد';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'تأیید رمز عبور الزامی است';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'رمز عبور و تأیید آن مطابقت ندارند';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingTeacher) {
        await teacherManagementService.updateTeacher(editingTeacher.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          username: formData.username,
        });
        showSuccess('اطلاعات معلم بروزرسانی شد');
      } else {
        const newTeacher = await teacherManagementService.addTeacher({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          username: formData.username,
          password: formData.password,
        });
        showSuccess(`معلم با موفقیت اضافه شد.\nنام کاربری: ${newTeacher.username}`);
      }
      setModalVisible(false);
      resetForm();
      loadTeachers();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      await teacherManagementService.changeTeacherPassword(
        selectedTeacher.id, 
        passwordData.newPassword
      );
      showSuccess('رمز عبور معلم با موفقیت تغییر کرد');
      setPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      showError(error.message);
    }
  };

  const handleAssignClass = async () => {
    if (!selectedClass) {
      showError('لطفاً یک کلاس انتخاب کنید');
      return;
    }
    
    setAssigning(true);
    try {
      await teacherManagementService.assignClassToTeacher(selectedTeacher.id, selectedClass.id);
      showSuccess(`کلاس با موفقیت به ${selectedTeacher.fullName} اختصاص یافت`);
      setAssignClassModalVisible(false);
      setSelectedClass(null);
      loadTeachers();
    } catch (error) {
      showError(error.message);
    } finally {
      setAssigning(false);
    }
  };

  const openAddLessonModal = async (teacher, classItem) => {
    setSelectedTeacher(teacher);
    setSelectedClass(classItem);
    
    try {
      const lessons = await classManagementService.getClassLessons(classItem.id);
      setClassLessons(lessons);
      const currentLessonIds = classItem.teacherLessons?.map(l => l.id) || [];
      setSelectedLessonIds(currentLessonIds);
      setAddLessonModalVisible(true);
    } catch (error) {
      showError('مشکل در دریافت درس‌ها');
    }
  };

  const handleToggleLesson = (lessonId) => {
    setSelectedLessonIds(prev => {
      if (prev.includes(lessonId)) {
        return prev.filter(id => id !== lessonId);
      } else {
        return [...prev, lessonId];
      }
    });
  };

  const handleSaveTeacherLessons = async () => {
    if (!selectedTeacher || !selectedClass) {
      showError('اطلاعات معلم یا کلاس نامعتبر است');
      return;
    }
    
    setAssigning(true);
    try {
      const currentLessonIds = selectedClass.teacherLessons?.map(l => l.id) || [];
      const lessonsToAdd = selectedLessonIds.filter(id => !currentLessonIds.includes(id));
      const lessonsToRemove = currentLessonIds.filter(id => !selectedLessonIds.includes(id));
      
      for (const lessonId of lessonsToAdd) {
        await teacherManagementService.addLessonToTeacher(selectedTeacher.id, selectedClass.id, lessonId);
      }
      
      for (const lessonId of lessonsToRemove) {
        await teacherManagementService.removeLessonFromTeacher(selectedTeacher.id, selectedClass.id, lessonId);
      }
      
      showSuccess('درس‌های معلم با موفقیت بروزرسانی شد');
      setAddLessonModalVisible(false);
      loadTeachers();
    } catch (error) {
      showError(error.message || 'مشکل در بروزرسانی درس‌ها');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveLessonFromClass = (teacherId, classId, lessonId, lessonName) => {
    Alert.alert(
      'حذف درس',
      `آیا از حذف درس "${lessonName}" از لیست تدریس معلم مطمئن هستید؟`,
      [
        { text: 'لغو', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await teacherManagementService.removeLessonFromTeacher(teacherId, classId, lessonId);
              showSuccess('درس با موفقیت حذف شد');
              loadTeachers();
            } catch (error) {
              showError(error.message);
            }
          },
        },
      ]
    );
  };

  const handleRemoveClassFromTeacher = (teacherId, classId, className, teacherName) => {
    setClassToDelete({ teacherId, classId, className, teacherName });
    setDeleteClassConfirmVisible(true);
  };

  const confirmDeleteClass = async () => {
    if (!classToDelete) return;
    
    try {
      await teacherManagementService.removeClassFromTeacher(classToDelete.teacherId, classToDelete.classId);
      showSuccess('کلاس با موفقیت از لیست تدریس معلم حذف شد');
      setDeleteClassConfirmVisible(false);
      setClassToDelete(null);
      loadTeachers();
    } catch (error) {
      showError(error.message || 'مشکل در حذف کلاس');
    }
  };

  const cancelDeleteClass = () => {
    setDeleteClassConfirmVisible(false);
    setClassToDelete(null);
  };

  const handleDelete = (teacher) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!teacherToDelete) return;
    try {
      await teacherManagementService.deleteTeacher(teacherToDelete.id);
      setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== teacherToDelete.id));
      setDeleteConfirmVisible(false);
      setTeacherToDelete(null);
      showSuccess('معلم با موفقیت حذف شد');
    } catch (error) {
      showError(error.message);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setTeacherToDelete(null);
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', phone: '', subject: '', username: '', password: '' });
    setFormErrors({});
    setEditingTeacher(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      fullName: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone || '',
      subject: teacher.subject || '',
      username: teacher.username,
      password: '',
    });
    setModalVisible(true);
  };

  const openPasswordModal = (teacher) => {
    setSelectedTeacher(teacher);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setPasswordModalVisible(true);
  };

  const openAssignClassModal = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClass(null);
    setAssignClassModalVisible(true);
  };

  const renderTeacherCard = ({ item: teacher }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.teacherInfoLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{teacher.full_name?.charAt(0) || 'م'}</Text>
          </View>
          <View>
            <Text style={styles.teacherName}>{teacher.full_name}</Text>
            <View style={styles.usernameRow}>
              <Icon name="person-outline" size={12} color="#94A3B8" />
              <Text style={styles.teacherUsername}>{teacher.username}</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditModal(teacher)} style={styles.actionBtn}>
            <Icon name="edit" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openPasswordModal(teacher)} style={styles.actionBtn}>
            <Icon name="vpn-key" size={20} color="#F59E0B" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openAssignClassModal(teacher)} style={styles.actionBtn}>
            <Icon name="class" size={20} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(teacher)} style={styles.actionBtn}>
            <Icon name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.teacherDetails}>
        {teacher.email && (
          <View style={styles.detailRow}>
            <Icon name="email" size={14} color="#64748B" />
            <Text style={styles.detailText}>{teacher.email}</Text>
          </View>
        )}
        {teacher.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color="#64748B" />
            <Text style={styles.detailText}>{teacher.phone}</Text>
          </View>
        )}
        {teacher.subject && (
          <View style={styles.detailRow}>
            <Icon name="school" size={14} color="#64748B" />
            <Text style={styles.detailText}>{teacher.subject}</Text>
          </View>
        )}
      </View>
      
      {teacher.classes && teacher.classes.length > 0 && (
        <View style={styles.classesContainer}>
          <Text style={styles.classesTitle}>
            <Icon name="menu-book" size={14} color={COLORS.primary} /> کلاس‌های تدریس:
          </Text>
          {teacher.classes.map(cls => (
            <View key={cls.id} style={styles.classItem}>
              <View style={styles.classItemHeader}>
                <View>
                  <Text style={styles.classItemName}>{cls.name}</Text>
                  <Text style={styles.classItemGrade}>پایه: {cls.grade || 'نامشخص'}</Text>
                </View>
                <View style={styles.classItemButtons}>
                  <TouchableOpacity 
                    style={styles.addLessonBtn}
                    onPress={() => openAddLessonModal(teacher, cls)}
                  >
                    <Icon name="add" size={16} color="#fff" />
                    <Text style={styles.addLessonBtnText}>درس</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeClassBtn}
                    onPress={() => handleRemoveClassFromTeacher(teacher.id, cls.id, cls.name, teacher.full_name)}
                  >
                    <Icon name="delete-outline" size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {cls.teacherLessons && cls.teacherLessons.length > 0 && (
                <View style={styles.teacherLessonsContainer}>
                  <Text style={styles.teacherLessonsTitle}>درس‌های تدریسی:</Text>
                  <View style={styles.teacherLessonsList}>
                    {cls.teacherLessons.map(lesson => (
                      <View key={lesson.id} style={styles.teacherLessonCard}>
                        <View style={styles.teacherLessonInfo}>
                          <Text style={styles.teacherLessonName}>{lesson.name}</Text>
                          {lesson.schedule && (
                            <Text style={styles.teacherLessonSchedule}>{lesson.schedule}</Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleRemoveLessonFromClass(teacher.id, cls.id, lesson.id, lesson.name)}
                        >
                          <Icon name="close" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
      
      {(!teacher.classes || teacher.classes.length === 0) && (
        <TouchableOpacity 
          style={styles.addClassBtn}
          onPress={() => openAssignClassModal(teacher)}
        >
          <Icon name="add-circle" size={18} color={COLORS.primary} />
          <Text style={styles.addClassBtnText}>اختصاص کلاس جدید</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="people" size={24} color="#fff" />
          <Text style={styles.headerTitle}>مدیریت معلمین</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Icon name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>افزودن معلم</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTeacherCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>هیچ معلمی ثبت نشده است</Text>
          </View>
        }
      />

      {/* Modal افزودن/ویرایش معلم */}
      <AnimatedModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>
            {editingTeacher ? 'ویرایش معلم' : 'افزودن معلم جدید'}
          </Text>
          
          <Input
            label="نام کامل"
            value={formData.fullName}
            onChangeText={(v) => setFormData({ ...formData, fullName: v })}
            placeholder="نام و نام خانوادگی"
            error={formErrors.fullName}
          />
          
          <Input
            label="ایمیل (اختیاری)"
            value={formData.email}
            onChangeText={(v) => setFormData({ ...formData, email: v })}
            placeholder="example@school.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={formErrors.email}
          />
          
          <Input
            label="تلفن"
            value={formData.phone}
            onChangeText={(v) => setFormData({ ...formData, phone: v })}
            placeholder="09123456789"
            keyboardType="phone-pad"
          />
          
          <Input
            label="تخصص (اختیاری)"
            value={formData.subject}
            onChangeText={(v) => setFormData({ ...formData, subject: v })}
            placeholder="مثال: ریاضی، فیزیک"
          />
          
          <Input
            label="نام کاربری"
            value={formData.username}
            onChangeText={(v) => setFormData({ ...formData, username: v })}
            placeholder="نام کاربری"
            autoCapitalize="none"
            error={formErrors.username}
          />
          
          {!editingTeacher && (
            <Input
              label="رمز عبور"
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              placeholder="رمز عبور"
              secureTextEntry
              error={formErrors.password}
            />
          )}
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setModalVisible(false)} variant="outline" />
            <Button title={editingTeacher ? 'بروزرسانی' : 'افزودن'} onPress={handleSubmit} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* Modal تغییر رمز عبور */}
      <AnimatedModal visible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>تغییر رمز عبور معلم</Text>
          <Text style={styles.modalSubtitle}>
            در حال تغییر رمز عبور برای: {selectedTeacher?.fullName}
          </Text>
          
          <Input
            label="رمز عبور جدید"
            value={passwordData.newPassword}
            onChangeText={(v) => setPasswordData({ ...passwordData, newPassword: v })}
            placeholder="حداقل ۶ کاراکتر"
            secureTextEntry
            error={passwordErrors.newPassword}
          />
          
          <Input
            label="تأیید رمز عبور"
            value={passwordData.confirmPassword}
            onChangeText={(v) => setPasswordData({ ...passwordData, confirmPassword: v })}
            placeholder="تکرار رمز عبور جدید"
            secureTextEntry
            error={passwordErrors.confirmPassword}
          />
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setPasswordModalVisible(false)} variant="outline" />
            <Button title="تغییر رمز عبور" onPress={handleChangePassword} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* Modal اختصاص کلاس به معلم */}
      <AnimatedModal visible={assignClassModalVisible} onClose={() => setAssignClassModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>اختصاص کلاس به معلم</Text>
          <Text style={styles.modalSubtitle}>
            معلم: {selectedTeacher?.fullName}
          </Text>
          
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>انتخاب کلاس</Text>
            <ScrollView style={styles.classesScrollView}>
              {availableClasses.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classOption,
                    selectedClass?.id === cls.id && styles.classOptionSelected
                  ]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[
                    styles.classOptionText,
                    selectedClass?.id === cls.id && styles.classOptionTextSelected
                  ]}>
                    {cls.name} ({cls.grade || 'بدون پایه'})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setAssignClassModalVisible(false)} variant="outline" />
            <Button title="اختصاص کلاس" onPress={handleAssignClass} loading={assigning} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* Modal افزودن درس به معلم */}
      <AnimatedModal visible={addLessonModalVisible} onClose={() => setAddLessonModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>مدیریت درس‌های معلم</Text>
          <Text style={styles.modalSubtitle}>معلم: {selectedTeacher?.full_name}</Text>
          <Text style={styles.modalSubtitle}>کلاس: {selectedClass?.name}</Text>
          
          <Text style={styles.sectionLabel}>📚 انتخاب درس‌ها:</Text>
          {classLessons.length === 0 ? (
            <Text style={styles.noLessonsText}>هیچ درسی برای این کلاس ثبت نشده است</Text>
          ) : (
            classLessons.map((lesson) => {
              const isSelected = selectedLessonIds.includes(lesson.id);
              return (
                <TouchableOpacity
                  key={lesson.id}
                  style={[
                    styles.lessonOption,
                    isSelected && styles.lessonOptionSelected
                  ]}
                  onPress={() => handleToggleLesson(lesson.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.lessonOptionLeft}>
                    <Text style={[
                      styles.lessonOptionText,
                      isSelected && styles.lessonOptionTextSelected
                    ]}>
                      {lesson.name}
                    </Text>
                    {lesson.schedule && (
                      <Text style={styles.lessonOptionSchedule}>⏰ {lesson.schedule}</Text>
                    )}
                  </View>
                  {isSelected ? (
                    <Icon name="check-circle" size={24} color={COLORS.success} />
                  ) : (
                    <Icon name="add-circle-outline" size={24} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              );
            })
          )}
          
          <View style={styles.modalButtons}>
            <Button 
              title="بستن" 
              onPress={() => setAddLessonModalVisible(false)} 
              variant="outline" 
            />
            <Button 
              title="ذخیره تغییرات" 
              onPress={handleSaveTeacherLessons} 
              loading={assigning}
            />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* Modal تایید حذف کلاس از معلم */}
      <AnimatedModal visible={deleteClassConfirmVisible} onClose={cancelDeleteClass}>
        <View style={styles.deleteConfirmContainer}>
          <Text style={styles.deleteConfirmTitle}>حذف کلاس</Text>
          <Text style={styles.deleteConfirmMessage}>
            آیا از حذف کلاس "{classToDelete?.className}" از لیست تدریس معلم مطمئن هستید؟
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <Button title="لغو" onPress={cancelDeleteClass} variant="outline" style={{ flex: 1 }} />
            <Button title="حذف" onPress={confirmDeleteClass} style={{ flex: 1, backgroundColor: COLORS.error }} />
          </View>
        </View>
      </AnimatedModal>

      {/* Modal تایید حذف معلم */}
      <AnimatedModal visible={deleteConfirmVisible} onClose={cancelDelete}>
        <View style={styles.deleteConfirmContainer}>
          <Text style={styles.deleteConfirmTitle}>حذف معلم</Text>
          <Text style={styles.deleteConfirmMessage}>
            آیا از حذف "{teacherToDelete?.fullName}" مطمئن هستید؟
          </Text>
          <View style={styles.deleteConfirmButtons}>
            <Button title="لغو" onPress={cancelDelete} variant="outline" />
            <Button title="حذف" onPress={confirmDelete} style={{ backgroundColor: COLORS.error }} />
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
    padding: 16, 
    backgroundColor: COLORS.primary,
    paddingTop: 48,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.white, 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  listContent: { padding: 16 },
  
  card: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
  },
  teacherInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  teacherName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  teacherUsername: { fontSize: 12, color: '#94A3B8' },
  cardActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 6 },
  
  teacherDetails: { marginBottom: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#64748B' },
  
  classesContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  classesTitle: { fontSize: 13, fontWeight: '600', color: COLORS.primary, marginBottom: 10 },
  
  classItem: { 
    backgroundColor: '#F8FAFC', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  classItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  classItemName: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  classItemGrade: { fontSize: 12, color: '#64748B', marginTop: 2 },
  classItemButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addLessonBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8,
    gap: 4,
  },
  addLessonBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '600' },
  removeClassBtn: { padding: 6 },
  
  teacherLessonsContainer: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  teacherLessonsTitle: { fontSize: 12, fontWeight: '600', color: COLORS.primary, marginBottom: 8 },
  teacherLessonsList: { gap: 8 },
  teacherLessonCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 10, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0' 
  },
  teacherLessonInfo: { flex: 1 },
  teacherLessonName: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  teacherLessonSchedule: { fontSize: 11, color: '#64748B', marginTop: 2 },
  
  addClassBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10, 
    paddingVertical: 10, 
    backgroundColor: COLORS.primary + '10', 
    borderRadius: 10, 
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    borderStyle: 'dashed',
  },
  addClassBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 12 },
  
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: COLORS.primary, marginBottom: 10 },
  
  selectContainer: { marginBottom: 16 },
  selectLabel: { fontSize: 14, fontWeight: '500', color: '#475569', marginBottom: 10 },
  
  classesScrollView: { maxHeight: 200, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#fff' },
  classOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  classOptionSelected: { backgroundColor: COLORS.primary + '10' },
  classOptionText: { fontSize: 14, color: '#1E293B' },
  classOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  
  lessonOption: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  lessonOptionSelected: { backgroundColor: COLORS.primary + '5' },
  lessonOptionLeft: { flex: 1 },
  lessonOptionText: { fontSize: 14, color: '#1E293B' },
  lessonOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  lessonOptionSchedule: { fontSize: 11, color: '#64748B', marginTop: 2 },
  noLessonsText: { textAlign: 'center', color: '#94A3B8', paddingVertical: 20 },
  
  deleteConfirmContainer: { padding: 16, alignItems: 'center' },
  deleteConfirmTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.error, marginBottom: 16, textAlign: 'center' },
  deleteConfirmMessage: { fontSize: 16, color: '#1E293B', textAlign: 'center', marginBottom: 24 },
  deleteConfirmButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' },
});

export default AdminTeachersScreen;