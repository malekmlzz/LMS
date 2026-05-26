import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/feedback/Loading';
import { COLORS } from '../../constants/colors';
import { storage } from '../../utils/storage';
import { authService } from '../../services/api/authService';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!username.trim()) {
      newErrors.username = 'نام کاربری را وارد کنید';
    }
    if (!password.trim()) {
      newErrors.password = 'رمز عبور را وارد کنید';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setServerError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login(username.trim(), password);
      
      console.log('Login response:', response);
      
      if (response && response.success) {
        if (response.user.role === 'admin') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'AdminTabs' }],
          });
        } else if (response.user.role === 'teacher') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'TeacherTabs' }],
          });
        } else if (response.user.role === 'student') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'StudentTabs' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } else {
        throw new Error(response?.message || 'ورود ناموفق بود');
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'نام کاربری یا رمز عبور اشتباه است';
      setServerError(errorMessage);
      Alert.alert('خطا', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (serverError) {
      setServerError('');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>📚</Text>
            </View>
            <Text style={styles.title}>مدیریت آموزشی</Text>
            <Text style={styles.subtitle}>به سامانه خوش آمدید</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="نام کاربری"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                clearFieldError('username');
              }}
              placeholder="نام کاربری خود را وارد کنید"
              icon="👤"
              autoCapitalize="none"
              error={errors.username}
            />
            
            <Input
              label="رمز عبور"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              placeholder="رمز عبور خود را وارد کنید"
              secureTextEntry
              icon="🔒"
              error={errors.password}
            />
          </View>

          {/* Server Error */}
          {serverError ? (
            <View style={styles.serverErrorContainer}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {/* Login Button */}
          <Button 
            title="ورود به سامانه" 
            onPress={handleLogin} 
            loading={loading} 
            fullWidth 
          />

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>ثبت‌نام مدرسه جدید؟</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SchoolRegister')}>
              <Text style={styles.registerLink}> ثبت‌نام کنید</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      {loading && <Loading fullScreen />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
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
  
  // Register
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FDE047',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;