import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants/colors';

// Onboarding Screens
import LandingScreen from '../screens/LandingScreen';
import SchoolRegisterScreen from '../screens/onboarding/SchoolRegisterScreen';
import SchoolRegisterSuccessScreen from '../screens/onboarding/SchoolRegisterSuccessScreen';
import LoginScreen from '../screens/auth/LoginScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminTeachersScreen from '../screens/admin/AdminTeachersScreen';
import AdminStudentsScreen from '../screens/admin/AdminStudentsScreen';
import AdminClassesScreen from '../screens/admin/AdminClassesScreen';

// Teacher Screens
import TeacherDashboardScreen from '../screens/teacher/TeacherDashboardScreen';
import TeacherClassDetailScreen from '../screens/teacher/TeacherClassDetailScreen';
import TeacherProfileScreen from '../screens/teacher/TeacherProfileScreen';

// Student Screens
import StudentDashboardScreen from '../screens/student/StudentDashboardScreen';
import StudentLessonDetailScreen from '../screens/student/StudentLessonDetailScreen';
import StudentReportCardScreen from '../screens/student/StudentReportCardScreen';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ========== تنظیمات مشترک نوار پایین ==========
const tabBarOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: '#fff',
    height: 65,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: '#94A3B8',
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
};

// ========== طراحی حرفه‌ای ادمین ==========
const AdminTabs = () => {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen 
        name="Dashboard" 
        component={AdminDashboardScreen} 
        options={{
          tabBarLabel: 'داشبورد',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="dashboard" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Teachers" 
        component={AdminTeachersScreen} 
        options={{
          tabBarLabel: 'معلمین',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="people" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Students" 
        component={AdminStudentsScreen} 
        options={{
          tabBarLabel: 'دانش‌آموزان',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="school" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Classes" 
        component={AdminClassesScreen} 
        options={{
          tabBarLabel: 'کلاس‌ها',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="class" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ========== معلم ==========
const TeacherStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
      <Stack.Screen name="TeacherClassDetail" component={TeacherClassDetailScreen} />
      <Stack.Screen name="TeacherProfile" component={TeacherProfileScreen} />
    </Stack.Navigator>
  );
};

const TeacherTabs = () => {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen 
        name="MyClasses" 
        component={TeacherStack} 
        options={{
          tabBarLabel: 'کلاس‌های من',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="book" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ========== دانش‌آموز ==========
const StudentStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
      <Stack.Screen name="StudentLessonDetail" component={StudentLessonDetailScreen} />
      <Stack.Screen name="StudentReportCard" component={StudentReportCardScreen} />
      <Stack.Screen name="StudentProfile" component={StudentProfileScreen} />
    </Stack.Navigator>
  );
};

const StudentTabs = () => {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen 
        name="MyLessons" 
        component={StudentStack} 
        options={{
          tabBarLabel: 'درس‌های من',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="menu-book" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ReportCard" 
        component={StudentReportCardScreen} 
        options={{
          tabBarLabel: 'کارنامه',
          tabBarIcon: ({ focused, color }) => (
            <Icon name="assessment" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ========== استک اصلی ==========
const AppNavigator = ({ initialRoute = 'Landing' }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="SchoolRegister" component={SchoolRegisterScreen} />
        <Stack.Screen name="SchoolRegisterSuccess" component={SchoolRegisterSuccessScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminTabs" component={AdminTabs} />
        <Stack.Screen name="TeacherTabs" component={TeacherTabs} />
        <Stack.Screen name="StudentTabs" component={StudentTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;