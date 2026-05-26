import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { authService } from './src/services/api/authService';
import { storage } from './src/utils/storage';
import { COLORS } from './src/constants/colors';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Landing');  // ← پیش‌فرض Landing

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      const user = await storage.getUser();
      
      if (token && user) {
        const isValid = await authService.checkAuth();
        if (isValid) {
          if (user.role === 'admin') {
            setInitialRoute('AdminTabs');
          } else if (user.role === 'teacher') {
            setInitialRoute('TeacherTabs');
          } else if (user.role === 'student') {
            setInitialRoute('StudentTabs');
          } else {
            setInitialRoute('Landing');
          }
        } else {
          await storage.clearAll();
          setInitialRoute('Landing');
        }
      } else {
        setInitialRoute('Landing');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setInitialRoute('Landing');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <AppNavigator initialRoute={initialRoute} />;
}