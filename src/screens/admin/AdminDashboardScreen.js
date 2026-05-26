import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { dashboardService } from '../../services/api/dashboardService';
import { authService } from '../../services/api/authService';
import { userService } from '../../services/api/userService';
import { storage } from '../../utils/storage';
import { COLORS } from '../../constants/colors';
import StatCard from '../../components/dashboard/StatCard';
import RecentItem from '../../components/dashboard/RecentItem';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    teachersCount: 0,
    studentsCount: 0,
    classesCount: 0,
    lessonsCount: 0,
    gradeStats: {},
    recentTeachers: [],
    recentStudents: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const loadDashboard = async () => {
    try {
      const data = await dashboardService.getStats();
      setStats(data);
      
      const user = await storage.getUser();
      setAdminUser(user);
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
      
      const savedImage = await storage.getProfileImage();
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadDashboard(); }, []));

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.full_name.trim()) {
      Alert.alert('خطا', 'نام کامل الزامی است');
      return;
    }
    
    try {
      const updatedUser = await userService.updateProfile({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
      });
      
      setAdminUser(updatedUser);
      Alert.alert('موفق', 'اطلاعات پروفایل با موفقیت بروزرسانی شد');
      setEditProfileVisible(false);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('خطا', error.message);
    }
  };

  const handleChangePassword = async () => {
    const errors = {};
    
    if (!passwordData.current_password) {
      errors.current_password = 'رمز عبور فعلی الزامی است';
    }
    if (!passwordData.new_password) {
      errors.new_password = 'رمز عبور جدید الزامی است';
    } else if (passwordData.new_password.length < 6) {
      errors.new_password = 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد';
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'رمز عبور و تأیید آن مطابقت ندارند';
    }
    
    setPasswordErrors(errors);
    
    if (Object.keys(errors).length > 0) return;
    
    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      
      Alert.alert('موفق', 'رمز عبور با موفقیت تغییر کرد');
      setChangePasswordVisible(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordErrors({});
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert('خطا', error.message);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('خطا', 'برای آپلود عکس به دسترسی گالری نیاز داریم');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setUploadingImage(true);
      try {
        const imageUri = result.assets[0].uri;
        await storage.setProfileImage(imageUri);
        setProfileImage(imageUri);
        Alert.alert('موفق', 'عکس پروفایل با موفقیت تغییر کرد');
      } catch (error) {
        Alert.alert('خطا', 'مشکل در آپلود عکس');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      await storage.removeProfileImage();
      setProfileImage(null);
      Alert.alert('موفق', 'عکس پروفایل با موفقیت حذف شد');
    } catch (error) {
      console.error('Error removing image:', error);
      Alert.alert('خطا', 'مشکل در حذف عکس');
    }
  };

  const gradeList = Object.entries(stats.gradeStats).map(([grade, count]) => ({ grade, count }));

  const getInitial = () => {
    if (adminUser?.full_name) {
      return adminUser.full_name.charAt(0);
    }
    return 'م';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header with Gradient Background */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>خوش آمدید 👋</Text>
            <Text style={styles.adminName}>{adminUser?.full_name || 'مدیر سیستم'}</Text>
            <View style={styles.schoolBadge}>
              <Icon name="school" size={14} color={COLORS.white} />
              <Text style={styles.schoolName}>مدرسه هوشمند دانش</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => setProfileModalVisible(true)}
          >
            <View style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{getInitial()}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="معلمین"
          value={stats.teachersCount}
          icon={<Icon name="chalkboard-teacher" size={28} color={COLORS.primary} />}
          color={COLORS.primary}
          onPress={() => navigation.navigate('Teachers')}
        />
        <StatCard
          title="دانش‌آموزان"
          value={stats.studentsCount}
          icon={<Icon name="account-group" size={28} color={COLORS.success} />}
          color={COLORS.success}
          onPress={() => navigation.navigate('Students')}
        />
        <StatCard
          title="کلاس‌ها"
          value={stats.classesCount}
          icon={<Icon name="google-classroom" size={28} color={COLORS.warning} />}
          color={COLORS.warning}
          onPress={() => navigation.navigate('Classes')}
        />
        <StatCard
          title="درس‌ها"
          value={stats.lessonsCount}
          icon={<Icon name="book-open-page-variant" size={28} color="#8b5cf6" />}
          color="#8b5cf6"
        />
      </View>

      {/* Grade Distribution Section */}
      {gradeList.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="chart-bar" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>توزیع پایه‌های تحصیلی</Text>
          </View>
          <View style={styles.gradeContainer}>
            {gradeList.map((item, index) => (
              <View key={index} style={styles.gradeItem}>
                <View style={styles.gradeHeader}>
                  <Text style={styles.gradeName}>{item.grade}</Text>
                  <Text style={styles.gradeCount}>{item.count} نفر</Text>
                </View>
                <View style={styles.gradeBarContainer}>
                  <View
                    style={[
                      styles.gradeBar,
                      {
                        width: `${(item.count / stats.studentsCount) * 100}%`,
                        backgroundColor: COLORS.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Recent Activities */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="history" size={22} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>فعالیت‌های اخیر</Text>
        </View>
        
        <View style={styles.recentCard}>
          <View style={styles.recentCardHeader}>
            <Icon name="chalkboard-teacher" size={20} color={COLORS.primary} />
            <Text style={styles.recentSubtitle}>معلمین جدید</Text>
          </View>
          {stats.recentTeachers.length > 0 ? (
            stats.recentTeachers.map((teacher) => (
              <RecentItem
                key={teacher.id}
                name={teacher.full_name}
                subtitle={teacher.subject || 'بدون تخصص'}
                date={teacher.created_at}
                icon={<Icon name="account-circle" size={20} color={COLORS.gray} />}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>هیچ معلم جدیدی ثبت نشده</Text>
          )}
        </View>

        <View style={styles.recentCard}>
          <View style={styles.recentCardHeader}>
            <Icon name="account-group" size={20} color={COLORS.success} />
            <Text style={styles.recentSubtitle}>دانش‌آموزان جدید</Text>
          </View>
          {stats.recentStudents.length > 0 ? (
            stats.recentStudents.map((student) => (
              <RecentItem
                key={student.id}
                name={student.full_name}
                subtitle={`پایه ${student.grade || 'نامشخص'}`}
                date={student.created_at}
                icon={<Icon name="school" size={20} color={COLORS.gray} />}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>هیچ دانش‌آموز جدیدی ثبت نشده</Text>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Icon name="flash" size={22} color={COLORS.warning} />
          <Text style={styles.sectionTitle}>اقدامات سریع</Text>
        </View>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.primary + '15' }]}
            onPress={() => navigation.navigate('Teachers')}
          >
            <Icon name="plus-circle" size={24} color={COLORS.primary} />
            <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>افزودن معلم</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.success + '15' }]}
            onPress={() => navigation.navigate('Students')}
          >
            <Icon name="plus-circle" size={24} color={COLORS.success} />
            <Text style={[styles.actionBtnText, { color: COLORS.success }]}>افزودن دانش‌آموز</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: COLORS.warning + '15' }]}
            onPress={() => navigation.navigate('Classes')}
          >
            <Icon name="plus-circle" size={24} color={COLORS.warning} />
            <Text style={[styles.actionBtnText, { color: COLORS.warning }]}>ایجاد کلاس</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Modal */}
      <Modal
        visible={profileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handlePickImage} style={styles.modalAvatarTouch}>
                {uploadingImage ? (
                  <ActivityIndicator size="large" color={COLORS.primary} />
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.modalAvatarImage} />
                ) : (
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{getInitial()}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <Icon name="camera" size={16} color={COLORS.white} />
                </View>
              </TouchableOpacity>
              {profileImage && (
                <TouchableOpacity onPress={handleRemoveImage} style={styles.removePhotoBtn}>
                  <Icon name="delete" size={14} color={COLORS.error} />
                  <Text style={styles.removePhotoText}>حذف عکس</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.modalName}>{adminUser?.full_name}</Text>
              <Text style={styles.modalRole}>مدیر مدرسه</Text>
            </View>

            <View style={styles.modalInfo}>
              <View style={styles.infoRow}>
                <Icon name="email" size={20} color={COLORS.gray} />
                <Text style={styles.infoText}>{adminUser?.email}</Text>
              </View>
              {adminUser?.phone && (
                <View style={styles.infoRow}>
                  <Icon name="phone" size={20} color={COLORS.gray} />
                  <Text style={styles.infoText}>{adminUser.phone}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Icon name="account" size={20} color={COLORS.gray} />
                <Text style={styles.infoText}>{adminUser?.username}</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="ویرایش پروفایل"
                onPress={() => {
                  setProfileModalVisible(false);
                  setEditProfileVisible(true);
                }}
                fullWidth
              />
              <Button
                title="تغییر رمز عبور"
                onPress={() => {
                  setProfileModalVisible(false);
                  setChangePasswordVisible(true);
                }}
                variant="outline"
                fullWidth
              />
              <Button
                title="خروج از حساب"
                onPress={handleLogout}
                variant="outline"
                fullWidth
                style={{ borderColor: COLORS.error }}
                textStyle={{ color: COLORS.error }}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <Icon name="account-edit" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>ویرایش پروفایل</Text>
              <TouchableOpacity onPress={() => setEditProfileVisible(false)}>
                <Icon name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <Input
              label="نام کامل"
              value={formData.full_name}
              onChangeText={(v) => setFormData({ ...formData, full_name: v })}
              placeholder="نام و نام خانوادگی"
            />
            
            <Input
              label="ایمیل"
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              placeholder="example@school.com"
              keyboardType="email-address"
            />
            
            <Input
              label="تلفن"
              value={formData.phone}
              onChangeText={(v) => setFormData({ ...formData, phone: v })}
              placeholder="09123456789"
              keyboardType="phone-pad"
            />
            
            <View style={styles.modalButtonGroup}>
              <Button title="لغو" onPress={() => setEditProfileVisible(false)} variant="outline" />
              <Button title="ذخیره تغییرات" onPress={handleUpdateProfile} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderBar}>
              <Icon name="lock-reset" size={24} color={COLORS.primary} />
              <Text style={styles.modalTitle}>تغییر رمز عبور</Text>
              <TouchableOpacity onPress={() => setChangePasswordVisible(false)}>
                <Icon name="close" size={24} color={COLORS.gray} />
              </TouchableOpacity>
            </View>
            
            <Input
              label="رمز عبور فعلی"
              value={passwordData.current_password}
              onChangeText={(v) => setPasswordData({ ...passwordData, current_password: v })}
              placeholder="رمز عبور فعلی را وارد کنید"
              secureTextEntry
              error={passwordErrors.current_password}
            />
            
            <Input
              label="رمز عبور جدید"
              value={passwordData.new_password}
              onChangeText={(v) => setPasswordData({ ...passwordData, new_password: v })}
              placeholder="حداقل ۶ کاراکتر"
              secureTextEntry
              error={passwordErrors.new_password}
            />
            
            <Input
              label="تأیید رمز عبور جدید"
              value={passwordData.confirm_password}
              onChangeText={(v) => setPasswordData({ ...passwordData, confirm_password: v })}
              placeholder="تکرار رمز عبور جدید"
              secureTextEntry
              error={passwordErrors.confirm_password}
            />
            
            <View style={styles.modalButtonGroup}>
              <Button title="لغو" onPress={() => setChangePasswordVisible(false)} variant="outline" />
              <Button title="تغییر رمز عبور" onPress={handleChangePassword} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  
  // Header
  header: { 
    backgroundColor: COLORS.primary, 
    paddingHorizontal: 24, 
    paddingTop: 48,
    paddingBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeText: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.85,
    marginBottom: 4,
  },
  adminName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  schoolName: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  profileButton: {
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    paddingHorizontal: 12, 
    marginTop: -20,
    marginBottom: 16,
  },
  
  section: { 
    marginHorizontal: 16, 
    marginVertical: 12 
  },
  lastSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  
  gradeContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  gradeItem: { 
    marginBottom: 16 
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gradeName: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#1A1A2E' 
  },
  gradeBarContainer: { 
    height: 8, 
    backgroundColor: '#E8ECF0', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  gradeBar: { 
    height: '100%', 
    borderRadius: 4 
  },
  gradeCount: { 
    fontSize: 12, 
    color: COLORS.gray, 
    fontWeight: '500',
  },
  
  recentCard: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: 16, 
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  recentSubtitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#1A1A2E' 
  },
  emptyText: { 
    textAlign: 'center', 
    color: COLORS.gray, 
    paddingVertical: 20,
    fontSize: 13,
  },
  
  quickActions: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  actionBtn: { 
    flex: 1, 
    minWidth: '30%', 
    paddingVertical: 14, 
    borderRadius: 16, 
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: { 
    fontWeight: '600', 
    fontSize: 13,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalAvatarTouch: {
    position: 'relative',
    marginBottom: 12,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: COLORS.error + '10',
    borderRadius: 20,
  },
  removePhotoText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '500',
  },
  modalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginTop: 8,
  },
  modalRole: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  modalInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1A1A2E',
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default AdminDashboardScreen;