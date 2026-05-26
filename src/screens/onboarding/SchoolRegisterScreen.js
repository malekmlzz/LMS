import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/colors';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/feedback/Loading';
import { authService } from '../../services/api/authService';
import { storage } from '../../utils/storage';
import { validators } from '../../utils/validators';

const SchoolRegisterScreen = ({ navigation }) => {
  const scrollViewRef = useRef();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    adminName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setServerError('');
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.schoolName.trim() || formData.schoolName.length < 3) {
      newErrors.schoolName = 'نام مدرسه باید حداقل ۳ کاراکتر باشد';
    }
    if (!formData.adminName.trim() || formData.adminName.length < 3) {
      newErrors.adminName = 'نام مدیر باید حداقل ۳ کاراکتر باشد';
    }
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ایمیل معتبر وارد کنید';
    }
    if (formData.phone && !/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'شماره تلفن ۱۰ تا ۱۵ رقم باشد';
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      newErrors.username = 'نام کاربری حداقل ۳ کاراکتر باید باشد';
    }
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'رمز عبور حداقل ۶ کاراکتر باید باشد';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور و تأیید آن مطابقت ندارند';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showError = (message) => {
    Alert.alert('خطا', message);
  };

  const showSuccess = (message, onOk) => {
    Alert.alert('موفق', message, [{ text: 'باشه', onPress: onOk }]);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      showError('لطفاً اطلاعات را به درستی وارد کنید');
      return;
    }

    setLoading(true);
    setServerError('');
    
    try {
      const response = await authService.registerSchool({
        schoolName: formData.schoolName,
        adminName: formData.adminName,
        email: formData.email,
        phone: formData.phone || null,
        username: formData.username,
        password: formData.password,
      });

      console.log('Registration response:', response);
      
      if (response && response.success) {
        if (response.schoolCode) {
          await storage.setSchoolCode(response.schoolCode);
        }
        
        showSuccess(
          `✅ مدرسه "${formData.schoolName}" با موفقیت ثبت شد!\n\n👤 نام کاربری: ${formData.username}\n🏫 کد مدرسه: ${response.schoolCode || '----'}\n\nلطفاً وارد شوید.`,
          () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        );
      } else {
        throw new Error(response?.message || 'ثبت‌نام ناموفق بود');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'مشکل در ثبت‌نام، لطفاً دوباره تلاش کنید';
      setServerError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4F46E5', '#7C3AED', '#2563EB']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={['#fff', '#f0f0f0']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.icon}>🏫</Text>
                </LinearGradient>
              </View>
              <Text style={styles.title}>ثبت‌نام مدرسه جدید</Text>
              <Text style={styles.subtitle}>
                اطلاعات مدرسه و مدیر را وارد کنید
              </Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              <Input
                label="نام مدرسه"
                value={formData.schoolName}
                onChangeText={(v) => handleChange('schoolName', v)}
                placeholder="مثال: دبیرستان نمونه"
                icon="🏫"
                error={errors.schoolName}
              />

              <Input
                label="نام مدیر"
                value={formData.adminName}
                onChangeText={(v) => handleChange('adminName', v)}
                placeholder="نام و نام خانوادگی"
                icon="👤"
                error={errors.adminName}
              />

              <Input
                label="ایمیل"
                value={formData.email}
                onChangeText={(v) => handleChange('email', v)}
                placeholder="example@school.com"
                keyboardType="email-address"
                autoCapitalize="none"
                icon="📧"
                error={errors.email}
              />

              <Input
                label="شماره تماس (اختیاری)"
                value={formData.phone}
                onChangeText={(v) => handleChange('phone', v)}
                placeholder="09123456789"
                keyboardType="phone-pad"
                icon="📞"
                error={errors.phone}
              />

              <View style={styles.divider} />

              <Input
                label="نام کاربری مدیر"
                value={formData.username}
                onChangeText={(v) => handleChange('username', v)}
                placeholder="نام کاربری"
                autoCapitalize="none"
                icon="🔑"
                error={errors.username}
              />

              <Input
                label="رمز عبور"
                value={formData.password}
                onChangeText={(v) => handleChange('password', v)}
                placeholder="حداقل ۶ کاراکتر"
                secureTextEntry
                icon="🔒"
                error={errors.password}
              />

              <Input
                label="تأیید رمز عبور"
                value={formData.confirmPassword}
                onChangeText={(v) => handleChange('confirmPassword', v)}
                placeholder="تکرار رمز عبور"
                secureTextEntry
                icon="✓"
                error={errors.confirmPassword}
              />
            </View>

            {/* Server Error */}
            {serverError ? (
              <View style={styles.serverErrorContainer}>
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                title="ثبت‌نام مدرسه"
                onPress={handleRegister}
                loading={loading}
                fullWidth
              />
              <View style={styles.loginRow}>
                <Text style={styles.footerText}>قبلاً ثبت‌نام کرده‌اید؟</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.link}> وارد شوید</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
        {loading && <Loading fullScreen />}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 45,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  
  // Form Card
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  
  // Server Error
  serverErrorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  serverErrorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  link: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FDE047',
    textDecorationLine: 'underline',
  },
});

export default SchoolRegisterScreen;