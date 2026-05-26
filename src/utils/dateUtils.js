// src/utils/dateUtils.js

// تبدیل تاریخ میلادی به شمسی برای نمایش
export const toJalali = (gregorianDate) => {
  const date = new Date(gregorianDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // الگوریتم ساده تبدیل تاریخ میلادی به شمسی
  const gregorianDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const jalaliDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  
  const isLeapGregorian = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  
  const daysSinceStart = (y, m, d) => {
    let days = 0;
    for (let i = 1; i < y; i++) days += isLeapGregorian(i) ? 366 : 365;
    for (let i = 1; i < m; i++) days += gregorianDaysInMonth[i - 1];
    if (m > 2 && isLeapGregorian(y)) days += 1;
    days += d;
    return days;
  };
  
  const days = daysSinceStart(year, month, day);
  
  const isLeapJalali = (y) => {
    const remains = y % 33;
    return remains === 1 || remains === 2 || remains === 3 || remains === 4 || remains === 5 ||
           remains === 6 || remains === 7 || remains === 8 || remains === 9 || remains === 10 ||
           remains === 11 || remains === 12 || remains === 13 || remains === 14 || remains === 15 ||
           remains === 16 || remains === 17 || remains === 18 || remains === 19 || remains === 20 ||
           remains === 21 || remains === 22 || remains === 23 || remains === 24 || remains === 25 ||
           remains === 26 || remains === 27 || remains === 28 || remains === 29 || remains === 30 ||
           remains === 31;
  };
  
  const jalaliYearStart = (y) => {
    let days = 0;
    for (let i = 1; i < y; i++) days += isLeapJalali(i) ? 366 : 365;
    return days;
  };
  
  let jy = 1;
  while (days > (jalaliYearStart(jy + 1) - jalaliYearStart(jy))) jy++;
  
  let remaining = days - jalaliYearStart(jy);
  let jm = 1;
  while (remaining > jalaliDaysInMonth[jm - 1]) {
    remaining -= jalaliDaysInMonth[jm - 1];
    jm++;
  }
  
  const jd = remaining;
  
  return {
    year: jy + 621,
    month: jm,
    day: jd,
    formatted: `${jy + 621}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`
  };
};

// تبدیل تاریخ شمسی به میلادی
export const toGregorian = (jalaliYear, jalaliMonth, jalaliDay) => {
  const jalaliDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  
  const isLeapJalali = (y) => {
    const remains = y % 33;
    return remains === 1 || remains === 2 || remains === 3 || remains === 4 || remains === 5 ||
           remains === 6 || remains === 7 || remains === 8 || remains === 9 || remains === 10 ||
           remains === 11 || remains === 12 || remains === 13 || remains === 14 || remains === 15 ||
           remains === 16 || remains === 17 || remains === 18 || remains === 19 || remains === 20 ||
           remains === 21 || remains === 22 || remains === 23 || remains === 24 || remains === 25 ||
           remains === 26 || remains === 27 || remains === 28 || remains === 29 || remains === 30 ||
           remains === 31;
  };
  
  const jalaliYearStart = (y) => {
    let days = 0;
    for (let i = 1; i < y; i++) days += isLeapJalali(i) ? 366 : 365;
    return days;
  };
  
  let days = jalaliYearStart(jalaliYear);
  for (let m = 1; m < jalaliMonth; m++) days += jalaliDaysInMonth[m - 1];
  days += jalaliDay;
  
  const isLeapGregorian = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  
  const gregorianYearStart = (y) => {
    let days = 0;
    for (let i = 1; i < y; i++) days += isLeapGregorian(i) ? 366 : 365;
    return days;
  };
  
  let gy = 1;
  while (days > (gregorianYearStart(gy + 1) - gregorianYearStart(gy))) gy++;
  
  const gregorianDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let remaining = days - gregorianYearStart(gy);
  let gm = 1;
  while (remaining > gregorianDaysInMonth[gm - 1]) {
    remaining -= gregorianDaysInMonth[gm - 1];
    if (gm === 2 && isLeapGregorian(gy)) remaining--;
    gm++;
  }
  const gd = remaining;
  
  return new Date(gy, gm - 1, gd);
};

// دریافت تاریخ جاری به شمسی
export const getCurrentJalali = () => {
  return toJalali(new Date());
};

// تبدیل رشته تاریخ شمسی به آبجکت
export const parseJalaliDate = (jalaliString) => {
  const parts = jalaliString.split('/');
  if (parts.length === 3) {
    return {
      year: parseInt(parts[0]),
      month: parseInt(parts[1]),
      day: parseInt(parts[2])
    };
  }
  return null;
};

// دریافت تاریخ میلادی به صورت فرمت شده برای API
export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// نام ماه‌های شمسی
export const getJalaliMonthName = (monthNumber) => {
  const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  return months[monthNumber - 1];
};

// نام روز هفته (برای نمایش)
export const getWeekdayName = (date) => {
  const weekdays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  return weekdays[date.getDay()];
};

// ========== توابعی که در کد شما استفاده شده ==========

// تابع getPersianDate - تاریخ شمسی کامل با جزئیات
export const getPersianDate = (gregorianDate = new Date()) => {
  const jalali = toJalali(gregorianDate);
  return {
    ...jalali,
    monthName: getJalaliMonthName(jalali.month),
    weekday: getWeekdayName(gregorianDate),
    full: `${jalali.formatted} - ${getWeekdayName(gregorianDate)}`,
    timestamp: gregorianDate.getTime()
  };
};

// تابع toJalaliForDisplay - برای نمایش ساده تاریخ شمسی
export const toJalaliForDisplay = (gregorianDate) => {
  const jalali = toJalali(gregorianDate);
  return jalali.formatted;
};