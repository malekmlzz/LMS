export const validators = {
  schoolName: (name) => name && name.trim().length >= 3 && name.trim().length <= 100,
  adminName: (name) => name && name.trim().length >= 3 && name.trim().length <= 100,
  email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  phone: (phone) => /^[0-9]{10,15}$/.test(phone),
  password: (password) => password && password.length >= 6,
  confirmPassword: (password, confirm) => password === confirm,
  username: (username) => username && username.length >= 3 && username.length <= 50,
};
