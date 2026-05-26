import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

const useStaggeredAnims = (count, delay = 120) => {
  const anims = useRef(Array.from({ length: count }, () => new Animated.Value(0))).current;
  const start = () => {
    Animated.stagger(
      delay,
      anims.map(a =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 60, friction: 9 }),
      ),
    ).start();
  };
  return { anims, start };
};

const LandingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const { anims: heroAnims, start: startHero } = useStaggeredAnims(4, 150);
  const { anims: cardAnims, start: startCards } = useStaggeredAnims(4, 100);
  const [cardsVisible, setCardsVisible] = useState(false);

  useEffect(() => {
    setTimeout(startHero, 700);
    setTimeout(() => {
      setCardsVisible(true);
      startCards();
    }, 1400);
  }, []);

  const heroItem = (anim, offsetY = 28) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) }],
  });

  const cardItem = anim => ({
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) }],
  });

  const features = [
    { icon: '👨‍🏫', color: '#6366F1', bg: '#EEF2FF', title: 'مدیریت معلمین', desc: 'اطلاعات کامل و تخصص‌ها' },
    { icon: '🧑‍🎓', color: '#10B981', bg: '#ECFDF5', title: 'مدیریت دانش‌آموزان', desc: 'پیشرفت تحصیلی لحظه‌ای' },
    { icon: '📚', color: '#F59E0B', bg: '#FFFBEB', title: 'مدیریت کلاس‌ها', desc: 'برنامه‌ریزی هوشمند' },
    { icon: '📊', color: '#EF4444', bg: '#FEF2F2', title: 'گزارشات پیشرفته', desc: 'نمودارهای تحلیلی' },
  ];

  const socialLinks = [
    { icon: '📧', name: 'Email', value: 'malekmlzz463@gmail.com', action: 'copy' },
    { icon: '📱', name: 'Telegram', value: '@malekmlz', action: 'link' },
    { icon: '💬', name: 'WhatsApp', value: '+9159578640', action: 'link' },
    { icon: '🐙', name: 'GitHub', value: 'github.com/malekmlzz', action: 'link' },
  ];

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('✅ کپی شد', `${text} با موفقیت کپی شد`);
  };

  const openLink = (url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('خطا', 'مشکل در باز کردن لینک');
    });
  };

  const handleSocialPress = (item) => {
    if (item.action === 'copy') {
      copyToClipboard(item.value);
    } else if (item.action === 'link') {
      let url = '';
      if (item.name === 'Telegram') url = `https://t.me/${item.value.replace('@', '')}`;
      if (item.name === 'WhatsApp') url = `https://wa.me/${item.value.replace('+', '')}`;
      if (item.name === 'GitHub') url = `https://${item.value}`;
      openLink(url);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.logoRow}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>م</Text>
          </View>
          <Text style={styles.logoText}>مدیریت آموزشی</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} onPress={() => {}}>
          <View style={styles.menuLine} />
          <View style={[styles.menuLine, { width: 16 }]} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces>
        {/* Hero Section */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <SafeAreaView style={styles.heroInner} edges={['bottom']}>
            <Animated.View style={[styles.heroTagRow, heroItem(heroAnims[0])]}>
              <View style={styles.heroPill}>
                <View style={styles.heroPillDot} />
                <Text style={styles.heroPillText}>ثبت‌نام مدرسه باز است</Text>
              </View>
            </Animated.View>

            <Animated.Text style={[styles.heroTitle, heroItem(heroAnims[1], 36)]}>
              آینده آموزش{'\n'}از اینجا شروع می‌شود
            </Animated.Text>

            <Animated.Text style={[styles.heroSub, heroItem(heroAnims[2])]}>
              به جمع هزاران مدرسه و معلم حرفه‌ای بپیوندید
            </Animated.Text>

            <Animated.View style={[styles.heroCTARow, heroItem(heroAnims[3])]}>
              <TouchableOpacity style={styles.ctaPrimary} onPress={() => navigation.navigate('SchoolRegister')} activeOpacity={0.85}>
                <LinearGradient colors={['#fff', '#f0f0f0']} style={StyleSheet.absoluteFill} />
                <Text style={styles.ctaPrimaryText}>ثبت نام مدرسه</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.ctaGlass} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
                <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.ctaGlassText}>ورود به سامانه</Text>
              </TouchableOpacity>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>۵۰۰+</Text>
            <Text style={styles.statLabel}>مدرسه فعال</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>۲۰۰۰+</Text>
            <Text style={styles.statLabel}>معلم حرفه‌ای</Text>
          </View>
          <View style={styles.statsSep} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>۵۰۰۰۰+</Text>
            <Text style={styles.statLabel}>دانش‌آموز</Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionLabel}>ویژگی‌ها</Text>
          </View>
          <Text style={styles.sectionTitle}>چرا مدیریت آموزشی؟</Text>
          <Text style={styles.sectionSub}>راهکاری جامع و هوشمند برای مدیران مدارس</Text>

          <View style={styles.cardsGrid}>
            {features.map((f, i) => (
              <Animated.View key={i} style={[styles.featureCard, cardsVisible ? cardItem(cardAnims[i]) : { opacity: 0 }]}>
                <View style={[styles.featureIconWrap, { backgroundColor: f.bg }]}>
                  <Text style={styles.featureIconEmoji}>{f.icon}</Text>
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* CTA Banner */}
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4F46E5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBanner}
        >
          <Text style={styles.ctaBannerTitle}>آماده شروع هستید؟</Text>
          <Text style={styles.ctaBannerSub}>امروز رایگان ثبت‌نام کنید</Text>
          <TouchableOpacity style={styles.ctaBannerBtn} onPress={() => navigation.navigate('SchoolRegister')} activeOpacity={0.85}>
            <Text style={styles.ctaBannerBtnText}>شروع رایگان ←</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Contact Section - طراحی زیبا */}
        <View style={styles.contactSection}>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactHeaderGradient}
          >
            <Text style={styles.contactHeaderIcon}>📬</Text>
            <Text style={styles.contactHeaderTitle}>ارتباط با ما</Text>
            <Text style={styles.contactHeaderSub}>ما همیشه در دسترس هستیم</Text>
          </LinearGradient>

          <View style={styles.contactContent}>
            {/* ایمیل اصلی */}
            <TouchableOpacity style={styles.contactMainCard} onPress={() => copyToClipboard('malekmlzz463@gmail.com')} activeOpacity={0.8}>
              <View style={styles.contactMainIcon}>
                <Text style={styles.contactMainIconText}>📧</Text>
              </View>
              <View style={styles.contactMainInfo}>
                <Text style={styles.contactMainLabel}>ایمیل پشتیبانی</Text>
                <Text style={styles.contactMainValue}>malekmlzz463@gmail.com</Text>
              </View>
              <View style={styles.contactMainCopy}>
                <Text style={styles.copyIconText}>📋</Text>
              </View>
            </TouchableOpacity>

            {/* شبکه‌های اجتماعی */}
            <Text style={styles.socialTitle}>راه‌های ارتباطی دیگر</Text>
            <View style={styles.socialGrid}>
              {socialLinks.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.socialCard}
                  onPress={() => handleSocialPress(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.socialIconWrap, { backgroundColor: `${PRIMARY}15` }]}>
                    <Text style={styles.socialIcon}>{item.icon}</Text>
                  </View>
                  <Text style={styles.socialName}>{item.name}</Text>
                  <Text style={styles.socialValue} numberOfLines={1}>
                    {item.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* پیام پایانی */}
            <View style={styles.contactFooter}>
              <Text style={styles.contactFooterText}>
                برای پشتیبانی، مشاوره و همکاری با ما در ارتباط باشید
              </Text>
              <View style={styles.contactFooterDots}>
                <View style={[styles.dot, { backgroundColor: PRIMARY }]} />
                <View style={[styles.dot, { backgroundColor: '#CBD5E1' }]} />
                <View style={[styles.dot, { backgroundColor: '#CBD5E1' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>مدیریت آموزشی</Text>
          <Text style={styles.footerMeta}>© ۱۴۰۴ · تمامی حقوق محفوظ است</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const PRIMARY = '#4F46E5';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0C0A1E' },
  scrollContent: { paddingBottom: 40 },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 34, height: 34, borderRadius: 10, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  logoMarkText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  logoText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  menuButton: { gap: 5, padding: 4 },
  menuLine: { height: 2, width: 22, backgroundColor: '#fff', borderRadius: 2 },

  heroGradient: {
    paddingTop: 80,
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  heroInner: { paddingHorizontal: 24 },
  heroTagRow: { marginBottom: 20 },
  heroPill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 30, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  heroPillDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34D399' },
  heroPillText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  heroTitle: { fontSize: 38, fontWeight: '800', color: '#fff', lineHeight: 50, marginBottom: 14, textAlign: 'center' },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.9)', lineHeight: 24, marginBottom: 32, textAlign: 'center' },
  heroCTARow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  ctaPrimary: { flex: 1, maxWidth: 180, height: 52, borderRadius: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#fff' },
  ctaPrimaryText: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
  ctaGlass: { flex: 1, maxWidth: 180, height: 52, borderRadius: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.1)' },
  ctaGlassText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -25,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: PRIMARY, marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888', fontWeight: '500' },
  statsSep: { width: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },

  section: { paddingHorizontal: 20, paddingTop: 44, paddingBottom: 8 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionAccent: { width: 30, height: 3, borderRadius: 2, backgroundColor: PRIMARY },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: PRIMARY, letterSpacing: 1 },
  sectionTitle: { fontSize: 26, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  sectionSub: { fontSize: 14, color: '#64748B', marginBottom: 28 },

  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  featureCard: { width: (width - 54) / 2, backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#F1F5F9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 4 },
  featureIconWrap: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  featureIconEmoji: { fontSize: 26 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 4, textAlign: 'center' },
  featureDesc: { fontSize: 12, color: '#64748B', lineHeight: 18, textAlign: 'center' },

  ctaBanner: { marginHorizontal: 20, marginTop: 30, borderRadius: 28, overflow: 'hidden', padding: 32, alignItems: 'center' },
  ctaBannerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  ctaBannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 24, textAlign: 'center' },
  ctaBannerBtn: { backgroundColor: '#fff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 },
  ctaBannerBtnText: { color: PRIMARY, fontSize: 15, fontWeight: '700' },

  // Contact Section Styles
  contactSection: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
  contactHeaderGradient: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  contactHeaderIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  contactHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  contactHeaderSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  contactContent: {
    padding: 20,
  },
  contactMainCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactMainIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  contactMainIconText: {
    fontSize: 24,
  },
  contactMainInfo: {
    flex: 1,
  },
  contactMainLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  contactMainValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  contactMainCopy: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyIconText: {
    fontSize: 16,
    color: '#64748B',
  },
  socialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  socialCard: {
    flex: 1,
    minWidth: (width - 80) / 2,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  socialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  socialIcon: {
    fontSize: 22,
  },
  socialName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  socialValue: {
    fontSize: 10,
    color: '#64748B',
  },
  contactFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  contactFooterText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 12,
  },
  contactFooterDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  footer: { paddingVertical: 28, alignItems: 'center', gap: 4 },
  footerBrand: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  footerMeta: { fontSize: 12, color: '#CBD5E1' },
});

export default LandingScreen;