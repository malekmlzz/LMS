import axios from 'axios';
import { storage } from '../../utils/storage';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// اینترسپتور درخواست با لاگ کامل
apiClient.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    const schoolCode = await storage.getSchoolCode();
    
    console.log('========== API REQUEST ==========');
    console.log('URL:', config.method?.toUpperCase(), config.url);
    console.log('Has Token:', !!token);
    console.log('Has SchoolCode:', !!schoolCode);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization Header:', `Bearer ${token.substring(0, 20)}...`);
    }
    
    if (schoolCode) {
      config.headers['X-School-Code'] = schoolCode;
      console.log('School Code Header:', schoolCode);
    }
    
    console.log('Request Data:', config.data);
    console.log('=================================');
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// اینترسپتور پاسخ با لاگ کامل
apiClient.interceptors.response.use(
  (response) => {
    console.log('========== API RESPONSE ==========');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('==================================');
    return response;
  },
  (error) => {
    console.error('========== API ERROR ==========');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response Data:', error.response?.data);
    console.error('================================');
    return Promise.reject(error);
  }
);

export default apiClient;