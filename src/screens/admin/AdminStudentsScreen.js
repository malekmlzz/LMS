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
import { studentManagementService } from '../../services/api/studentManagementService';
import { classManagementService } from '../../services/api/classManagementService';
import { COLORS } from '../../constants/colors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import AnimatedModal from '../../components/ui/AnimatedModal';
import { Loading } from '../../components/feedback/Loading';

const AdminStudentsScreen = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    parentPhone: '',
    grade: '',
    username: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
    Alert.alert('موفق', message);
  };

  const showError = (message) => {
    setServerError(message);
    setTimeout(() => setServerError(''), 5000);
    Alert.alert('خطا', message);
  };

  const loadStudents = async () => {
    try {
      const data = await studentManagementService.getStudents();
      setStudents(data);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadClasses = async () => {
    try {
      const data = await classManagementService.getClasses();
      setClasses(data);
    } catch (error) {
      console.error('Load classes error:', error);
    }
  };

  useFocusEffect(useCallback(() => { 
    loadStudents(); 
    loadClasses();
  }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadStudents();
    loadClasses();
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
    
    if (!editingStudent && !formData.password.trim()) {
      errors.password = 'رمز عبور الزامی است';
    } else if (!editingStudent && formData.password.length < 6) {
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
      if (editingStudent) {
        await studentManagementService.updateStudent(editingStudent.id, {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          grade: formData.grade,
        });
        showSuccess('اطلاعات دانش‌آموز با موفقیت بروزرسانی شد');
      } else {
        const newStudent = await studentManagementService.addStudent({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          parentPhone: formData.parentPhone,
          grade: formData.grade,
          username: formData.username,
          password: formData.password,
          classId: selectedClassId,
        });
        showSuccess(`دانش‌آموز ${newStudent.full_name} با موفقیت اضافه شد`);
      }
      setModalVisible(false);
      resetForm();
      setSelectedClassId(null);
      loadStudents();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    try {
      await studentManagementService.changeStudentPassword(
        selectedStudent.id, 
        passwordData.newPassword
      );
      showSuccess('رمز عبور دانش‌آموز با موفقیت تغییر کرد');
      setPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDelete = (student) => {
    setStudentToDelete(student);
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      await studentManagementService.deleteStudent(studentToDelete.id);
      setStudents(prevStudents => prevStudents.filter(s => s.id !== studentToDelete.id));
      setDeleteConfirmVisible(false);
      setStudentToDelete(null);
      showSuccess('دانش‌آموز با موفقیت حذف شد');
    } catch (error) {
      showError(error.message);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmVisible(false);
    setStudentToDelete(null);
  };

  const resetForm = () => {
    setFormData({ fullName: '', email: '', phone: '', parentPhone: '', grade: '', username: '', password: '' });
    setFormErrors({});
    setEditingStudent(null);
    setSelectedClassId(null);
    setServerError('');
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.full_name,
      email: student.email || '',
      phone: student.phone || '',
      parentPhone: student.parent_phone || '',
      grade: student.grade || '',
      username: student.username,
      password: '',
    });
    setModalVisible(true);
  };

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setPasswordModalVisible(true);
  };

  const renderStudentCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.studentAvatar}>
          <Icon name="school" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.studentInfoContainer}>
          <Text style={styles.studentName}>{item.full_name}</Text>
          <Text style={styles.studentUsername}>
            <Icon name="person" size={12} color="#94A3B8" /> {item.username}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
            <Icon name="edit" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openPasswordModal(item)} style={styles.passwordBtn}>
            <Icon name="lock" size={20} color={COLORS.warning} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
            <Icon name="delete" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.studentDetails}>
        {item.email && (
          <View style={styles.detailRow}>
            <Icon name="email" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.parentPhone && (
          <View style={styles.detailRow}>
            <Icon name="people" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>والدین: {item.parentPhone}</Text>
          </View>
        )}
        {item.grade && (
          <View style={styles.detailRow}>
            <Icon name="menu-book" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>پایه: {item.grade}</Text>
          </View>
        )}
        {item.className && (
          <View style={styles.detailRow}>
            <Icon name="class" size={14} color="#94A3B8" />
            <Text style={styles.detailText}>کلاس: {item.className}</Text>
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="school" size={24} color="#fff" />
          <Text style={styles.headerTitle}>مدیریت دانش‌آموزان</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Icon name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>افزودن دانش‌آموز</Text>
        </TouchableOpacity>
      </View>

      {serverError ? (
        <View style={styles.errorBanner}>
          <Icon name="error" size={20} color="#fff" />
          <Text style={styles.errorBannerText}>{serverError}</Text>
        </View>
      ) : null}

      {successMessage ? (
        <View style={styles.successBanner}>
          <Icon name="check-circle" size={20} color="#fff" />
          <Text style={styles.successBannerText}>{successMessage}</Text>
        </View>
      ) : null}

      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderStudentCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyText}>هیچ دانش‌آموزی ثبت نشده است</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddModal}>
              <Text style={styles.emptyAddBtnText}>+ افزودن دانش‌آموز</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal افزودن/ویرایش دانش‌آموز */}
      <AnimatedModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Icon name={editingStudent ? "edit" : "person-add"} size={28} color={COLORS.primary} />
            <Text style={styles.modalTitle}>
              {editingStudent ? 'ویرایش دانش‌آموز' : 'افزودن دانش‌آموز جدید'}
            </Text>
          </View>
          
          <Input
            label="نام کامل"
            value={formData.fullName}
            onChangeText={(v) => setFormData({ ...formData, fullName: v })}
            placeholder="نام و نام خانوادگی"
            icon="👤"
            error={formErrors.fullName}
          />
          
          <Input
            label="ایمیل"
            value={formData.email}
            onChangeText={(v) => setFormData({ ...formData, email: v })}
            placeholder="example@student.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="📧"
            error={formErrors.email}
          />
          
          <Input
            label="تلفن دانش‌آموز"
            value={formData.phone}
            onChangeText={(v) => setFormData({ ...formData, phone: v })}
            placeholder="09123456789"
            keyboardType="phone-pad"
            icon="📞"
          />
          
          <Input
            label="تلفن والدین"
            value={formData.parentPhone}
            onChangeText={(v) => setFormData({ ...formData, parentPhone: v })}
            placeholder="09123456789"
            keyboardType="phone-pad"
            icon="👨‍👩‍👧"
          />
          
          <View style={styles.selectContainer}>
            <Text style={styles.selectLabel}>انتخاب کلاس</Text>
            <ScrollView style={styles.classesScrollView}>
              {classes.length === 0 ? (
                <Text style={styles.noClassesText}>هیچ کلاسی ثبت نشده است</Text>
              ) : (
                classes.map((cls) => (
                  <TouchableOpacity
                    key={cls.id}
                    style={[
                      styles.classOption,
                      selectedClassId === cls.id && styles.classOptionSelected
                    ]}
                    onPress={() => setSelectedClassId(cls.id)}
                  >
                    <Text style={[
                      styles.classOptionText,
                      selectedClassId === cls.id && styles.classOptionTextSelected
                    ]}>
                      {cls.name} ({cls.grade || 'بدون پایه'})
                    </Text>
                    {selectedClassId === cls.id && (
                      <Icon name="check" size={18} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
          
          <Input
            label="پایه تحصیلی"
            value={formData.grade}
            onChangeText={(v) => setFormData({ ...formData, grade: v })}
            placeholder="مثال: دهم، یازدهم"
            icon="📚"
          />
          
          <Input
            label="نام کاربری"
            value={formData.username}
            onChangeText={(v) => setFormData({ ...formData, username: v })}
            placeholder="نام کاربری"
            autoCapitalize="none"
            icon="🔑"
            error={formErrors.username}
          />
          
          {!editingStudent && (
            <Input
              label="رمز عبور"
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              placeholder="حداقل ۶ کاراکتر"
              secureTextEntry
              icon="🔒"
              error={formErrors.password}
            />
          )}
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setModalVisible(false)} variant="outline" />
            <Button title={editingStudent ? 'بروزرسانی' : 'افزودن'} onPress={handleSubmit} />
          </View>
        </ScrollView>
      </AnimatedModal>

      {/* Modal تغییر رمز عبور */}
      <AnimatedModal visible={passwordModalVisible} onClose={() => setPasswordModalVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.modalHeader}>
            <Icon name="lock-outline" size={28} color={COLORS.warning} />
            <Text style={styles.modalTitle}>تغییر رمز عبور</Text>
          </View>
          <Text style={styles.modalSubtitle}>
            در حال تغییر رمز عبور برای: {selectedStudent?.full_name}
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

      {/* Modal تایید حذف */}
      <AnimatedModal visible={deleteConfirmVisible} onClose={cancelDelete}>
        <View style={styles.deleteConfirmContainer}>
          <Icon name="warning" size={48} color={COLORS.error} />
          <Text style={styles.deleteConfirmTitle}>حذف دانش‌آموز</Text>
          <Text style={styles.deleteConfirmMessage}>
            آیا از حذف "{studentToDelete?.full_name}" مطمئن هستید؟
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
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  addButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    paddingHorizontal: 14, 
    paddingVertical: 8, 
    borderRadius: 10,
    gap: 6,
  },
  addButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, gap: 8 },
  errorBannerText: { flex: 1, fontSize: 13, color: '#DC2626' },
  successBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, gap: 8 },
  successBannerText: { flex: 1, fontSize: 13, color: '#059669' },
  
  listContent: { padding: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  studentAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  studentInfoContainer: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  studentUsername: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 12 },
  editBtn: { padding: 4 },
  passwordBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  
  studentDetails: { borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, color: '#64748B' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  emptyAddBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyAddBtnText: { color: '#fff', fontWeight: '600' },
  
  selectContainer: { marginBottom: 16 },
  selectLabel: { fontSize: 14, fontWeight: '500', color: '#1E293B', marginBottom: 8 },
  classesScrollView: { maxHeight: 150, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, backgroundColor: '#fff' },
  classOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  classOptionSelected: { backgroundColor: COLORS.primary + '10' },
  classOptionText: { fontSize: 14, color: '#1E293B', flex: 1 },
  classOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  noClassesText: { textAlign: 'center', color: '#94A3B8', paddingVertical: 20 },
  
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 16, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  
  deleteConfirmContainer: { padding: 16, alignItems: 'center', gap: 12 },
  deleteConfirmTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.error, textAlign: 'center' },
  deleteConfirmMessage: { fontSize: 16, color: '#1E293B', textAlign: 'center' },
  deleteConfirmButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, width: '100%' },
});

export default AdminStudentsScreen;