import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Radar, LogOut, Search, Star, BarChart2, Newspaper, TrendingUp, TrendingDown, XCircle } from 'lucide-react';
import './App.css';

const translations = {
  en: {
    welcome: 'Welcome to RadarX', loginDesc: 'Your professional crypto radar',
    emailPlh: 'Email Address', passPlh: 'Password', loginBtn: 'Launch Radar',
    title: 'Market Radar', langBtn: 'العربية', search: 'Search coins...',
    market: 'Market', watchlist: 'Watchlist', news: 'News',
    emptyWatchlist: 'Your watchlist is empty.', noResults: 'No coins found.', readMore: 'Read More'
  },
  ar: {
    welcome: 'مرحباً بك في RadarX', loginDesc: 'رادارك الاحترافي لسوق الكريبتو',
    emailPlh: 'البريد الإلكتروني', passPlh: 'كلمة المرور', loginBtn: 'تشغيل الرادار',
    title: 'سوق الرادار', langBtn: 'English', search: 'ابحث عن عملة...',
    market: 'السوق', watchlist: 'المفضلة', news: 'الأخبار',
    emptyWatchlist: 'قائمة المفضلة فارغة.', noResults: 'لم يتم العثور على عملات.', readMore: 'اقرأ المزيد'
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const[loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [lang, setLang] = useState('ar');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState('market');
  const[watchlist, setWatchlist] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);

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
      setCoins(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchNews = async () => {
    try {
      const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
      const data = await res.json();
      if (data?.Data) setNews(data.Data.slice(0, 20));
    } catch (err) { console.error(err); }
  };

  const toggleWatchlist = (e, coinId) => {
    e.stopPropagation();
    let updated = watchlist.includes(coinId) ? watchlist.filter(id => id !== coinId) : [...watchlist, coinId];
    setWatchlist(updated);
    localStorage.setItem('radarx_watchlist', JSON.stringify(updated));
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container" style={{ direction: dir }}>
        <div className="login-card">
          <Radar size={64} color="#6366f1" style={{ marginBottom: 20 }} />
          <h1 style={{ margin: '0 0 10px 0', fontSize: 32 }}>RadarX</h1>
          <p style={{ color: '#94a3b8', marginBottom: 30 }}>{t.loginDesc}</p>
          <input className="input-field" placeholder={t.emailPlh} style={{ textAlign: isAr ? 'right' : 'left' }} />
          <input className="input-field" type="password" placeholder={t.passPlh} style={{ textAlign: isAr ? 'right' : 'left' }} />
          <button className="primary-btn" onClick={() => setIsLoggedIn(true)}>{t.loginBtn}</button>
          <button style={{ background: 'none', border: 'none', color: '#818cf8', marginTop: 20, cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setLang(isAr ? 'en' : 'ar')}>
            {t.langBtn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ direction: dir }}>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radar size={28} color="#6366f1" />
          <h2 style={{ margin: 0 }}>{t.title}</h2>
        </div>
        <LogOut size={24} color="#ef4444" style={{ cursor: 'pointer' }} onClick={() => setIsLoggedIn(false)} />
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>
          <BarChart2 size={20} /> {t.market}
        </div>
        <div className={`tab ${activeTab === 'watchlist' ? 'active' : ''}`} onClick={() => setActiveTab('watchlist')}>
          <Star size={20} /> {t.watchlist}
        </div>
        <div className={`tab ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}>
          <Newspaper size={20} /> {t.news}
        </div>
      </div>

      {/* Search */}
      {activeTab !== 'news' && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '0 15px' }}>
            <Search size={20} color="#64748b" />
            <input 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search}
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', padding: '15px 10px', outline: 'none', textAlign: isAr ? 'right' : 'left', fontFamily: 'Tajawal' }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="content-area">
        {loading ? (
          <div style={{ textAlign: 'center', color: '#6366f1', marginTop: 50 }}>جاري التحميل...</div>
        ) : activeTab === 'news' ? (
          news.map((n, i) => (
            <a key={i} href={n.url} target="_blank" rel="noreferrer" className="news-card">
              <img src={n.imageurl} alt="news" className="news-img" />
              <div className="news-content">
                <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>{n.title}</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>{n.source_info?.name}</p>
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

      {/* Chart Modal */}
      {selectedCoin && (
        <div className="modal-overlay" onClick={() => setSelectedCoin(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img src={selectedCoin.image} alt="coin" style={{ width: 40, height: 40, borderRadius: 20 }} />
                <h2 style={{ margin: 0 }}>{selectedCoin.name}</h2>
              </div>
              <XCircle size={30} color="#64748b" cursor="pointer" onClick={() => setSelectedCoin(null)} />
            </div>
            <h1 style={{ margin: '0 0 20px 0', fontSize: 36 }}>${selectedCoin.current_price.toLocaleString()}</h1>
            
            {selectedCoin.sparkline_in_7d && (
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedCoin.sparkline_in_7d.price.map((p, i) => ({ price: p }))}>
                    <YAxis domain={['auto', 'auto']} hide />
                    <Line type="monotone" dataKey="price" stroke={selectedCoin.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444'} strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
      }
