import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@LMS:token',
  TOKEN_EXPIRY: '@LMS:token_expiry',
  USER: '@LMS:user',
  SCHOOL_CODE: '@LMS:school_code',
  PROFILE_IMAGE: '@LMS:profile_image',
};

export const storage = {
  setToken: async (token) => {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN, token);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.TOKEN);
    } catch (error) {
      return null;
    }
  },
  
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.TOKEN);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  setTokenExpiry: async (expiry) => {
    try {
      await AsyncStorage.setItem(KEYS.TOKEN_EXPIRY, expiry.toString());
      return true;
    } catch (error) {
      return false;
    }
  },
  
  getTokenExpiry: async () => {
    try {
      const expiry = await AsyncStorage.getItem(KEYS.TOKEN_EXPIRY);
      return expiry ? parseInt(expiry) : null;
    } catch (error) {
      return null;
    }
  },
  
  setUser: async (user) => {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
      return true;
    } catch (error) {
      return false;
    }
  },
  
  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem(KEYS.USER);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },
  
  removeUser: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  setSchoolCode: async (code) => {
    try {
      await AsyncStorage.setItem(KEYS.SCHOOL_CODE, code);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  getSchoolCode: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.SCHOOL_CODE);
    } catch (error) {
      return null;
    }
  },
  
  setProfileImage: async (uri) => {
    try {
      await AsyncStorage.setItem(KEYS.PROFILE_IMAGE, uri);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  getProfileImage: async () => {
    try {
      return await AsyncStorage.getItem(KEYS.PROFILE_IMAGE);
    } catch (error) {
      return null;
    }
  },
  
  removeProfileImage: async () => {
    try {
      await AsyncStorage.removeItem(KEYS.PROFILE_IMAGE);
      return true;
    } catch (error) {
      return false;
    }
  },
  
  clearAll: async () => {
    try {
      const keys = [KEYS.TOKEN, KEYS.TOKEN_EXPIRY, KEYS.USER, KEYS.SCHOOL_CODE, KEYS.PROFILE_IMAGE];
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      return false;
    }
  },
};