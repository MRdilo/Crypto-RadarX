import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, ActivityIndicator,
  SafeAreaView, StatusBar, TouchableOpacity, RefreshControl,
  TextInput, Dimensions, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard, Modal, Linking
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const translations = {
  en: {
    welcome: 'Welcome to RadarX', loginDesc: 'Your professional crypto intelligence radar',
    emailPlh: 'Email Address', passPlh: 'Password', loginBtn: 'Launch Radar',
    title: 'Market Radar', price: 'Price', risk: 'Risk', loading: 'Scanning...',
    langBtn: 'العربية', logout: 'Exit', search: 'Search coins...', error: 'Radar Offline.',
    retry: 'Reconnect', noResults: 'No coins found.', 
    market: 'Market', watchlist: 'Watchlist', news: 'News',
    emptyWatchlist: 'Your watchlist is empty.', newsError: 'Failed to load news.', readMore: 'Read More'
  },
  ar: {
    welcome: 'مرحباً بك في RadarX', loginDesc: 'رادارك الاحترافي لتحليل سوق الكريبتو',
    emailPlh: 'البريد الإلكتروني', passPlh: 'كلمة المرور', loginBtn: 'تشغيل الرادار',
    title: 'سوق الرادار', price: 'السعر', risk: 'المخاطر', loading: 'جاري المسح...',
    langBtn: 'English', logout: 'خروج', search: 'ابحث عن عملة...', error: 'فقدان الاتصال.',
    retry: 'إعادة الاتصال', noResults: 'لم يتم العثور على عملات.',
    market: 'السوق', watchlist: 'المفضلة', news: 'الأخبار',
    emptyWatchlist: 'قائمة المفضلة فارغة.', newsError: 'تعذر جلب الأخبار.', readMore: 'اقرأ المزيد'
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lang, setLang] = useState('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const[error, setError] = useState(false);
  
  // States for New Features
  const [activeTab, setActiveTab] = useState('market'); // market, watchlist, news
  const [watchlist, setWatchlist] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const[modalVisible, setModalVisible] = useState(false);

  const [email, setEmail] = useState('');
  const[password, setPassword] = useState('');

  const t = translations[lang];
  const isAr = lang === 'ar';

  // Load Watchlist on mount
  useEffect(() => {
    loadWatchlist();
  },[]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchCoins();
      fetchNews();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let source = activeTab === 'watchlist' ? coins.filter(c => watchlist.includes(c.id)) : coins;
    if (searchQuery.trim() === '') {
      setFilteredCoins(source);
    } else {
      const lower = searchQuery.toLowerCase();
      setFilteredCoins(source.filter(c => c.name.toLowerCase().includes(lower) || c.symbol.toLowerCase().includes(lower)));
    }
  },[searchQuery, coins, activeTab, watchlist]);

  const loadWatchlist = async () => {
    try {
      const saved = await AsyncStorage.getItem('radarx_watchlist');
      if (saved) setWatchlist(JSON.parse(saved));
    } catch (e) { console.log('Error loading watchlist'); }
  };

  const toggleWatchlist = async (coinId) => {
    let updated =[...watchlist];
    if (updated.includes(coinId)) {
      updated = updated.filter(id => id !== coinId);
    } else {
      updated.push(coinId);
    }
    setWatchlist(updated);
    await AsyncStorage.setItem('radarx_watchlist', JSON.stringify(updated));
  };

  const fetchCoins = async () => {
    setLoading(true); setError(false);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true');
      if (!response.ok) throw new Error('Network Error');
      const data = await response.json();
      
      const enhancedData = data.map(item => ({
        ...item, riskScore: Math.min(99, Math.round(15 + (Math.abs(item.price_change_percentage_24h || 0) * 4.5)))
      }));
      setCoins(enhancedData);
    } catch (err) { setError(true); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchNews = async () => {
    try {
      // API للأخبار
      const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
      const data = await res.json();
      if (data && data.Data) setNews(data.Data.slice(0, 20));
    } catch (e) { console.log('News Error', e); }
  };

  const handleLogin = () => {
    if (email.trim() && password.length > 3) setIsLoggedIn(true);
    else alert(isAr ? 'بيانات غير صالحة' : 'Invalid credentials');
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const renderCoinItem = ({ item }) => {
    const isPositive = item.price_change_percentage_24h > 0;
    const isFav = watchlist.includes(item.id);

    return (
      <TouchableOpacity activeOpacity={0.7} style={[styles.coinCard, { flexDirection: isAr ? 'row-reverse' : 'row' }]} onPress={() => { setSelectedCoin(item); setModalVisible(true); }}>
        <Image source={{ uri: item.image }} style={styles.coinIcon} />
        <View style={[styles.coinInfo, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.coinName}>{item.name}</Text>
          <Text style={styles.coinSymbol}>{item.symbol.toUpperCase()}</Text>
        </View>
        <View style={[styles.coinPriceInfo, { alignItems: isAr ? 'flex-start' : 'flex-end' }]}>
          <Text style={styles.coinPrice}>${item.current_price.toLocaleString()}</Text>
          <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name={isPositive ? "trending-up" : "trending-down"} size={14} color={isPositive ? '#10b981' : '#ef4444'} />
            <Text style={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: 13, fontWeight: 'bold', marginHorizontal: 4 }}>
              {Math.abs(item.price_change_percentage_24h).toFixed(2)}%
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.favBtn} onPress={() => toggleWatchlist(item.id)}>
          <Ionicons name={isFav ? "star" : "star-outline"} size={22} color={isFav ? "#f59e0b" : "#64748b"} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity activeOpacity={0.8} style={styles.newsCard} onPress={() => openUrl(item.url)}>
      <Image source={{ uri: item.imageurl }} style={styles.newsImg} />
      <View style={[styles.newsContent, { alignItems: isAr ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.newsTitle, { textAlign: isAr ? 'right' : 'left' }]} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsSource}>{item.source_info?.name} • {new Date(item.published_on * 1000).toLocaleDateString()}</Text>
        <Text style={styles.readMore}>{t.readMore} <Ionicons name={isAr ? "arrow-back" : "arrow-forward"} size={12} /></Text>
      </View>
    </TouchableOpacity>
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginCard}>
          <MaterialCommunityIcons name="radar" size={65} color="#6366f1" style={{ marginBottom: 10 }} />
          <Text style={styles.brandName}>RadarX</Text>
          <Text style={styles.loginDesc}>{t.loginDesc}</Text>
          <TextInput style={[styles.input, { textAlign: isAr ? 'right' : 'left' }]} placeholder={t.emailPlh} placeholderTextColor="#64748b" onChangeText={setEmail} />
          <TextInput style={[styles.input, { textAlign: isAr ? 'right' : 'left' }]} placeholder={t.passPlh} placeholderTextColor="#64748b" secureTextEntry onChangeText={setPassword} />
          <TouchableOpacity style={styles.mainBtn} onPress={handleLogin}><Text style={styles.mainBtnText}>{t.loginBtn}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setLang(isAr ? 'en' : 'ar')} style={{ marginTop: 20 }}><Text style={{ color: '#818cf8', fontWeight: 'bold' }}>{t.langBtn}</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="radar" size={28} color="#6366f1" />
          <Text style={[styles.headerTitle, { marginHorizontal: 8 }]}>{t.title}</Text>
        </View>
        <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={styles.logoutBtn}>
          <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'market' && styles.activeTab]} onPress={() => setActiveTab('market')}>
          <Ionicons name="bar-chart" size={20} color={activeTab === 'market' ? "#6366f1" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === 'market' && styles.activeTabText]}>{t.market}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'watchlist' && styles.activeTab]} onPress={() => setActiveTab('watchlist')}>
          <Ionicons name="star" size={20} color={activeTab === 'watchlist' ? "#f59e0b" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === 'watchlist' && { color: '#f59e0b' }]}>{t.watchlist}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'news' && styles.activeTab]} onPress={() => setActiveTab('news')}>
          <Ionicons name="newspaper" size={20} color={activeTab === 'news' ? "#10b981" : "#64748b"} />
          <Text style={[styles.tabText, activeTab === 'news' && { color: '#10b981' }]}>{t.news}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab !== 'news' && (
        <View style={styles.searchWrapper}>
          <View style={[styles.searchContainer, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput style={[styles.searchInput, { textAlign: isAr ? 'right' : 'left' }]} placeholder={t.search} placeholderTextColor="#64748b" value={searchQuery} onChangeText={setSearchQuery} />
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : activeTab === 'news' ? (
        <FlatList data={news} keyExtractor={(item, index) => index.toString()} renderItem={renderNewsItem} contentContainerStyle={{ padding: 16 }} />
      ) : filteredCoins.length === 0 ? (
        <View style={styles.center}><Text style={{ color: '#64748b', fontSize: 16 }}>{activeTab === 'watchlist' ? t.emptyWatchlist : t.noResults}</Text></View>
      ) : (
        <FlatList data={filteredCoins} keyExtractor={(item) => item.id} renderItem={renderCoinItem} contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCoins(); fetchNews(); }} tintColor="#6366f1" />} />
      )}

      {/* Chart Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        {selectedCoin && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={[styles.modalHeader, { flexDirection: isAr ? 'row-reverse' : 'row' }]}>
                <View style={{ flexDirection: isAr ? 'row-reverse' : 'row', alignItems: 'center' }}>
                  <Image source={{ uri: selectedCoin.image }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#fff', marginHorizontal: 10 }}>{selectedCoin.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close-circle" size={30} color="#64748b" /></TouchableOpacity>
              </View>

              <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', textAlign: isAr ? 'right' : 'left', marginVertical: 10 }}>
                ${selectedCoin.current_price.toLocaleString()}
              </Text>

              {selectedCoin.sparkline_in_7d && (
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <LineChart
                    data={{ labels: [], datasets:[{ data: selectedCoin.sparkline_in_7d.price }] }}
                    width={width - 40} height={180} withDots={false} withInnerLines={false} withOuterLines={false}
                    chartConfig={{
                      backgroundColor: '#0f172a', backgroundGradientFrom: '#0f172a', backgroundGradientTo: '#0f172a',
                      color: () => selectedCoin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444',
                      strokeWidth: 3,
                    }}
                    bezier style={{ borderRadius: 16 }}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', maxWidth: 400, alignItems: 'center', padding: 30, borderRadius: 25, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b' },
  brandName: { fontSize: 32, fontWeight: '900', color: '#fff', marginBottom: 5 },
  loginDesc: { color: '#94a3b8', marginBottom: 25, textAlign: 'center' },
  input: { width: '100%', height: 50, backgroundColor: '#1e293b', borderRadius: 12, color: '#fff', paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  mainBtn: { width: '100%', height: 50, backgroundColor: '#6366f1', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  header: { padding: 20, justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { padding: 8, backgroundColor: '#ef444415', borderRadius: 10 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#0f172a', paddingHorizontal: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },
  activeTab: { backgroundColor: '#1e293b' },
  tabText: { color: '#64748b', fontWeight: 'bold', marginHorizontal: 6 },
  activeTabText: { color: '#6366f1' },
  searchWrapper: { padding: 16 },
  searchContainer: { height: 45, backgroundColor: '#0f172a', borderRadius: 12, alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: '#1e293b' },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, marginHorizontal: 10 },
  coinCard: { backgroundColor: '#0f172a', padding: 15, borderRadius: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  coinIcon: { width: 40, height: 40, borderRadius: 20 },
  coinInfo: { flex: 1, marginHorizontal: 12 },
  coinName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  coinSymbol: { color: '#64748b', fontSize: 13, marginTop: 4 },
  coinPriceInfo: { justifyContent: 'center', marginRight: 10 },
  coinPrice: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  favBtn: { padding: 5 },
  newsCard: { backgroundColor: '#0f172a', borderRadius: 16, marginBottom: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b' },
  newsImg: { width: '100%', height: 160, backgroundColor: '#1e293b' },newsContent: { padding: 15 },
  newsTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', lineHeight: 22 },
  newsSource: { color: '#64748b', fontSize: 12, marginTop: 8 },
  readMore: { color: '#6366f1', fontSize: 13, fontWeight: 'bold', marginTop: 10 },
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' },
  modalContent: { backgroundColor: '#0f172a', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: '60%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }
});
             
