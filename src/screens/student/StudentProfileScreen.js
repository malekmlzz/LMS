import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/api/authService';
import { userService } from '../../services/api/userService';
import { storage } from '../../utils/storage';
import { Loading } from '../../components/feedback/Loading';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import AnimatedModal from '../../components/ui/AnimatedModal';

const StudentProfileScreen = ({ navigation }) => {
  const [studentUser, setStudentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  
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

  const loadData = async () => {
    try {
      const user = await storage.getUser();
      setStudentUser(user);
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const getInitial = () => {
    if (studentUser?.full_name) {
      return studentUser.full_name.charAt(0);
    }
    return 'د';
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
      
      await storage.setUser(updatedUser);
      setStudentUser(updatedUser);
      
      Alert.alert('موفق', 'اطلاعات پروفایل با موفقیت بروزرسانی شد');
      setEditProfileVisible(false);
    } catch (error) {
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
      Alert.alert('خطا', error.message);
    }
  };

  const handleLogout = () => {
    setLogoutConfirmVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await authService.logout();
      setLogoutConfirmVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
      setLogoutConfirmVisible(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const cancelLogout = () => {
    setLogoutConfirmVisible(false);
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← بازگشت</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>پروفایل من</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.profileImageContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitial()}</Text>
        </View>
        <Text style={styles.userName}>{studentUser?.full_name}</Text>
        <Text style={styles.userRole}>دانش‌آموز</Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📧</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>ایمیل</Text>
            <Text style={styles.infoValue}>{studentUser?.email || 'ثبت نشده'}</Text>
          </View>
        </View>
        
        {studentUser?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📞</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>تلفن</Text>
              <Text style={styles.infoValue}>{studentUser.phone}</Text>
            </View>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>نام کاربری</Text>
            <Text style={styles.infoValue}>{studentUser?.username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="ویرایش پروفایل"
          onPress={() => setEditProfileVisible(true)}
          fullWidth
        />
        <Button
          title="تغییر رمز عبور"
          onPress={() => setChangePasswordVisible(true)}
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

      <AnimatedModal visible={editProfileVisible} onClose={() => setEditProfileVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>ویرایش پروفایل</Text>
          
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
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setEditProfileVisible(false)} variant="outline" />
            <Button title="ذخیره تغییرات" onPress={handleUpdateProfile} />
          </View>
        </ScrollView>
      </AnimatedModal>

      <AnimatedModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.modalTitle}>تغییر رمز عبور</Text>
          
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
          
          <View style={styles.modalButtons}>
            <Button title="لغو" onPress={() => setChangePasswordVisible(false)} variant="outline" />
            <Button title="تغییر رمز عبور" onPress={handleChangePassword} />
          </View>
        </ScrollView>
      </AnimatedModal>

      <Modal
        visible={logoutConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.confirmTitle}>خروج از حساب</Text>
            <Text style={styles.confirmMessage}>
              آیا از خروج خود مطمئن هستید؟
            </Text>
            <View style={styles.confirmButtons}>
              <Button 
                title="لغو" 
                onPress={cancelLogout} 
                variant="outline" 
                style={{ flex: 1 }}
              />
              <Button 
                title="خروج" 
                onPress={confirmLogout} 
                style={{ flex: 1, backgroundColor: COLORS.error }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.primary,
    paddingTop: 48,
  },
  backButton: { padding: 4 },
  backButtonText: { fontSize: 14, color: COLORS.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  placeholder: { width: 40 },
  
  profileImageContainer: { alignItems: 'center', marginTop: 20, marginBottom: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 40, fontWeight: 'bold', color: COLORS.white },
  userName: { fontSize: 20, fontWeight: 'bold', color: COLORS.black, marginTop: 12 },
  userRole: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  
  infoCard: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, padding: 16, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoIcon: { fontSize: 22, width: 40 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: COLORS.gray },
  infoValue: { fontSize: 14, color: COLORS.black, fontWeight: '500', marginTop: 2 },
  
  actionsContainer: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 16 },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmMessage: {
    fontSize: 16,
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
});

export default StudentProfileScreen;