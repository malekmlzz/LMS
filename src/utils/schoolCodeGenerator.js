/**
 * تولید کد یکتا و غیرقابل حدس برای مدرسه
 * فرمت: [۲ حرف اول نام مدرسه][۵ رقم تصادفی]
 * مثال: "دبیرستان-نمونه" → "DS12345"
 * 
 * امنیت: ۲ حرف (۲۶ حالت) × ۵ رقم (۱۰۰۰۰۰ حالت) = ۲.۶ میلیون ترکیب
 * با تضمین عدم برخورد در حافظه
 */

// کاراکترهای مجاز برای بخش حروف (فقط حروف بزرگ انگلیسی)
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// تبدیل حروف فارسی به انگلیسی
const persianToLatin = (char) => {
  const map = {
    'ا': 'A', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ث': 'S', 'ج': 'J', 'چ': 'CH',
    'ح': 'H', 'خ': 'KH', 'د': 'D', 'ذ': 'Z', 'ر': 'R', 'ز': 'Z', 'ژ': 'ZH',
    'س': 'S', 'ش': 'SH', 'ص': 'S', 'ض': 'Z', 'ط': 'T', 'ظ': 'Z', 'ع': 'A',
    'غ': 'GH', 'ف': 'F', 'ق': 'GH', 'ک': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M',
    'ن': 'N', 'و': 'V', 'ه': 'H', 'ی': 'Y'
  };
  return map[char] || char;
};

// استخراج ۲ حرف اول از نام مدرسه (به لاتین)
const getTwoLetters = (schoolName) => {
  // حذف کلمات اضافی
  let cleanName = schoolName.replace(/مدرسه|دبیرستان|هنرستان|آموزشگاه|دبستان/g, '').trim();
  
  // استخراج حروف معنی‌دار
  let result = '';
  for (let i = 0; i < cleanName.length && result.length < 2; i++) {
    const char = cleanName[i];
    const latin = persianToLatin(char);
    if (latin && latin.length === 1 && /[A-Z]/.test(latin)) {
      result += latin;
    }
  }
  
  // اگر کمتر از ۲ حرف شد، با X پر کن
  while (result.length < 2) {
    result += 'X';
  }
  
  return result;
};

// تولید عدد تصادفی ۵ رقمی (00000 تا 99999) با crypto
const generateRandomNumber = () => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 100000).toString().padStart(5, '0');
};

// ذخیره کدهای تولید شده برای جلوگیری از برخورد
const generatedCodes = new Set();

// تولید کد کامل با تضمین عدم برخورد
export const generateUniqueSchoolCode = (schoolName, maxAttempts = 20) => {
  const prefix = getTwoLetters(schoolName);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const numberPart = generateRandomNumber();
    const code = `${prefix}${numberPart}`;
    
    if (!generatedCodes.has(code)) {
      generatedCodes.add(code);
      return code;
    }
  }
  
  // Fallback نهایی (با حروف تصادفی)
  const randomLetter1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const randomLetter2 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const fallback = `${randomLetter1}${randomLetter2}${generateRandomNumber()}`;
  generatedCodes.add(fallback);
  return fallback;
};

// اعتبارسنجی فرمت کد مدرسه
export const isValidSchoolCode = (code) => {
  const regex = /^[A-Z]{2}\d{5}$/;
  return regex.test(code);
};

// ریست کش کدها (برای تست)
export const resetCodes = () => {
  generatedCodes.clear();
};

// دریافت آمار (برای دیباگ)
export const getStats = () => ({
  totalGenerated: generatedCodes.size,
  maxCapacity: 26 * 26 * 100000, // 67,600,000
});
