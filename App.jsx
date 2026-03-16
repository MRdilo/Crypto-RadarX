import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Radar, LogOut, Search, Star, BarChart2, Newspaper, TrendingUp, TrendingDown, XCircle, Bot, Target, ShieldAlert, Crosshair } from 'lucide-react';
import './App.css';

const translations = {
  en: {
    welcome: 'Welcome to RadarX', loginDesc: 'Your AI-Powered Crypto Radar',
    loginBtn: 'Launch RadarX 🚀', title: 'Market Radar', langBtn: 'العربية', search: 'Search coins...',
    market: 'Market', watchlist: 'Watchlist', news: 'News',
    emptyWatchlist: 'Your watchlist is empty.', noResults: 'No coins found.', readMore: 'Read Article',
    aiAnalysis: 'AI Trading Signals', signal: 'Signal', entry: 'Entry Point', target: 'Take Profit', stop: 'Stop Loss'
  },
  ar: {
    welcome: 'مرحباً بك في RadarX', loginDesc: 'رادارك المدعوم بالذكاء الاصطناعي',
    loginBtn: '🚀 تشغيل الرادار', title: 'سوق الرادار', langBtn: 'English', search: 'ابحث عن عملة...',
    market: 'السوق', watchlist: 'المفضلة', news: 'الأخبار',
    emptyWatchlist: 'قائمة المفضلة فارغة.', noResults: 'لم يتم العثور على عملات.', readMore: 'قراءة المقال',
    aiAnalysis: 'توصيات الذكاء الاصطناعي', signal: 'الإشارة', entry: 'نقطة الدخول', target: 'جني الأرباح', stop: 'وقف الخسارة'
  }
};

// مكتبة أخبار احتياطية موسعة بصور مضمونة
const fallbackNews =[
  { title: "البيتكوين يكسر حواجز جديدة وسط تفاؤل المستثمرين بصناديق ETF", source_info: { name: "CryptoArab" }, url: "https://cointelegraph.com", imageurl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=600&q=80" },
  { title: "Ethereum Foundation announces new scaling upgrades", source_info: { name: "Global Crypto" }, url: "https://coindesk.com", imageurl: "https://images.unsplash.com/photo-1622630998477-20b41cd74c15?auto=format&fit=crop&w=600&q=80" },
  { title: "الذكاء الاصطناعي يقتحم عالم التداول الرقمي بقوة هذا العام", source_info: { name: "AI Tech Daily" }, url: "https://decrypt.co", imageurl: "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&w=600&q=80" },
  { title: "Solana network reaches all-time high in daily active users", source_info: { name: "Web3 Times" }, url: "https://blockworks.co", imageurl: "https://images.unsplash.com/photo-1641580529558-a96d473b6f00?auto=format&fit=crop&w=600&q=80" },
  { title: "هل نشهد نهاية السوق الهابط قريباً؟ محللون يجيبون", source_info: { name: "Trading MENA" }, url: "https://ar.cointelegraph.com/", imageurl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=600&q=80" },
  { title: "Binance continues to expand despite regulatory challenges", source_info: { name: "Crypto News" }, url: "https://binance.com", imageurl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80" }
];

// صورة احتياطية في حال كانت صورة الخبر مكسورة
const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80";

export default function App() {
  // استخدام localStorage لحفظ حالة تسجيل الدخول
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('radarx_logged_in') === 'true';
  });
  
  const[loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const[filteredCoins, setFilteredCoins] = useState([]);
  const [news, setNews] = useState([]);
  const[lang, setLang] = useState('ar');
  const [searchQuery, setSearchQuery] = useState('');
  
  const[activeTab, setActiveTab] = useState('market');
  const [watchlist, setWatchlist] = useState([]);
  const[selectedCoin, setSelectedCoin] = useState(null);

  const t = translations[lang];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  useEffect(() => {
    const saved = localStorage.getItem('radarx_watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
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

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true');
      const data = await res.json();
      if(data && data.length > 0) setCoins(data);
    } catch (err) { console.error("CoinGecko Error:", err); }
    setLoading(false);
  };

  const fetchNews = async () => {
    try {
      const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
      const data = await res.json();
      if (data?.Data && data.Data.length > 0) {
        setNews(data.Data.slice(0, 20));
      } else {
        setNews(fallbackNews);
      }
    } catch (err) { 
      console.error("News API Blocked:", err); 
      setNews(fallbackNews);
    }
  };

  const toggleWatchlist = (e, coinId) => {
    e.stopPropagation();
    let updated = watchlist.includes(coinId) ? watchlist.filter(id => id !== coinId) : [...watchlist, coinId];
    setWatchlist(updated);
    localStorage.setItem('radarx_watchlist', JSON.stringify(updated));
  };

  // دوال تسجيل الدخول والخروج مع الحفظ في المتصفح
  const handleLogin = () => {
    localStorage.setItem('radarx_logged_in', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('radarx_logged_in');
    setIsLoggedIn(false);
  };// حساب توصيات الذكاء الاصطناعي
  const getAISignals = (coin) => {
    if(!coin) return null;
    const isBullish = coin.price_change_percentage_24h > 0;
    const volatility = Math.abs(coin.price_change_percentage_24h || 2);
    const price = coin.current_price;
    const tp = isBullish ? price * (1 + (volatility * 1.5 / 100)) : price * (1 - (volatility * 1.5 / 100));
    const sl = isBullish ? price * (1 - (volatility * 0.8 / 100)) : price * (1 + (volatility * 0.8 / 100));
    return { isBullish, entry: price, tp, sl };
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container" style={{ direction: dir, background: '#020617' }}>
        <div className="login-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Radar size={100} color="#39FF14" style={{ filter: 'drop-shadow(0 0 20px rgba(57, 255, 20, 0.6))', marginBottom: 20 }} />
          </div>
          <h1 style={{ margin: '0 0 10px 0', fontSize: 42, fontWeight: '900', letterSpacing: 2 }}>RadarX</h1>
          <p style={{ color: '#94a3b8', marginBottom: 50, fontSize: 18 }}>{t.loginDesc}</p>
          
          <button 
            onClick={handleLogin}
            style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#39FF14', color: '#000', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(57, 255, 20, 0.3)', transition: 'transform 0.2s', fontFamily: 'Tajawal' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {t.loginBtn}
          </button>
          
          <button style={{ background: 'none', border: 'none', color: '#64748b', marginTop: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, fontFamily: 'Tajawal' }} onClick={() => setLang(isAr ? 'en' : 'ar')}>
            {t.langBtn} 🌐
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ direction: dir }}>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radar size={28} color="#39FF14" />
          <h2 style={{ margin: 0, fontWeight: 900 }}>{t.title}</h2>
        </div>
        <LogOut size={24} color="#ef4444" style={{ cursor: 'pointer' }} onClick={handleLogout} />
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}><BarChart2 size={20} /> {t.market}</div>
        <div className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}><Star size={20} /> {t.watchlist}</div>
        <div className={`tab ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}><Newspaper size={20} /> {t.news}</div>
      </div>

      {activeTab !== 'news' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '0 15px' }}>
            <Search size={20} color="#64748b" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.search} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '15px 10px', outline: 'none', textAlign: isAr ? 'right' : 'left', fontFamily: 'Tajawal' }} />
          </div>
        </div>
      )}

      <div className="content-area">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#39FF14', marginTop: 50, fontWeight: 'bold' }}>جاري المسح بالرادار...</div>
        ) : activeTab === 'news' ? (
          news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-card">
              {/* الميزة السحرية: إذا فشلت الصورة تضع صورة احتياطية بدلاً من كسر التصميم */}
              <img 
                src={n.imageurl || DEFAULT_NEWS_IMAGE} 
                alt="news" 
                className="news-img"
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_NEWS_IMAGE; }} 
              />
              <div className="news-content">
                <h3 style={{ margin: '0 0 10px 0', fontSize: 16, lineHeight: 1.5 }}>{n.title}</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: 0, color: '#64748b', fontSize: 13, fontWeight: 'bold' }}>{n.source_info?.name}</p>
                  <span style={{ color: '#39FF14', fontSize: 12, fontWeight: 'bold' }}>{t.readMore} &rarr;</span>
                </div>
              </div>
            </a>
          ))
        ) : filteredCoins.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', marginTop: 50 }}>{activeTab === 'watchlist' ? t.emptyWatchlist : t.noResults}</div>
        ) : (
          filteredCoins.map(coin => {
            const isFav = watchlist.includes(coin.id);
            const isPos = coin.price_change_percentage_24h > 0;
            return (
              <div key={coin.id} className="coin-card" onClick={() => setSelectedCoin(coin)}>
                <img src={coin.image} alt={coin.name} className="coin-img" />
                <div style={{ flex: 1, margin: '0 15px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>{coin.name}</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>{coin.symbol.toUpperCase()}</div>
                </div>
                <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>${coin.current_price.toLocaleString()}</div>
                  <div style={{ color: isPos ? '#10b981' : '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                    {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </div>
                </div>
                <div style={{ padding: '0 10px', cursor: 'pointer' }} onClick={(e) => toggleWatchlist(e, coin.id)}>
                  <Star size={24} fill={isFav ? "#f59e0b" : "none"} color={isFav ? "#f59e0b" : "#64748b"} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCoin && (
        <div className="modal-overlay" onClick={() => setSelectedCoin(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={selectedCoin.image} alt="coin" style={{ width: 40, height: 40, borderRadius: 20 }} />
                <h2 style={{ margin: 0 }}>{selectedCoin.name}</h2>
              </div>
              <XCircle size={30} color="#64748b" cursor="pointer" onClick={() => setSelectedCoin(null)} />
            </div>
            <h1 style={{ margin: '0 0 20px 0', fontSize: 36 }}>${selectedCoin.current_price.toLocaleString()}</h1>
            
            {selectedCoin.sparkline_in_7d && (
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedCoin.sparkline_in_7d.price.map((p) => ({ price: p }))}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="price" stroke={selectedCoin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444'} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ background: 'rgba(57, 255, 20, 0.05)', border: '1px solid rgba(57, 255, 20, 0.2)', padding: 20, borderRadius: 16, marginTop: 25 }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#39FF14', display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
                <Bot size={22} /> {t.aiAnalysis}
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><Crosshair size={16}/> {t.signal}:</span>
                <strong style={{ color: getAISignals(selectedCoin).isBullish ? '#10b981' : '#ef4444' }}>
                  {getAISignals(selectedCoin).isBullish ? 'LONG (شراء) 🟢' : 'SHORT (بيع) 🔴'}
                </strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#94a3b8' }}>{t.entry}:</span>
                <strong style={{ color: '#fff' }}>${getAISignals(selectedCoin).entry.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><Target size={16}/> {t.target}:</span>
                <strong style={{ color: '#10b981' }}>${getAISignals(selectedCoin).tp.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><ShieldAlert size={16}/> {t.stop}:</span>
                <strong style={{ color: '#ef4444' }}>${getAISignals(selectedCoin).sl.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
      }
