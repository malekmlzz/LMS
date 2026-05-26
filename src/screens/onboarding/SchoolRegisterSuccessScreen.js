import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  ImageBackground,
} from 'react-native';
import { COLORS } from '../../constants/colors';

const SchoolRegisterSuccessScreen = ({ route, navigation }) => {
  const { schoolCode, schoolName } = route.params;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🏫 مدرسه ${schoolName}\n\nکد مدرسه: ${schoolCode}\n\nاین کد را در اختیار معلمین و دانش‌آموزان قرار دهید.\n\nمدیریت آموزشی`,
      });
    } catch (error) {
      Alert.alert('خطا', 'مشکل در اشتراک‌گذاری');
    }
  };

  const handleCopy = () => {
    Alert.alert('کپی شد', `کد ${schoolCode} در حافظه کپی شد`);
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070' }}
      style={styles.background}
      blurRadius={5}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.title}>ثبت‌نام با موفقیت انجام شد!</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>کد مدرسه شما</Text>
            <Text style={styles.codeValue}>{schoolCode}</Text>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <Text style={styles.copyButtonText}>📋 کپی کد</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>📤 اشتراک‌گذاری</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.note}>
            این کد را در اختیار معلمین و دانش‌آموزان قرار دهید.
            آنها برای ورود به سامانه به این کد نیاز دارند.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginButtonText}>ورود به پنل مدیریت</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 32,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  codeContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  codeLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 4,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  copyButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SchoolRegisterSuccessScreen;
