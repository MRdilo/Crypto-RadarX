import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Radar, LogOut, Search, Star, BarChart2, Newspaper, TrendingUp, TrendingDown, XCircle, Bot, Target, ShieldAlert, Crosshair, Bell, BellRing } from 'lucide-react';
import './App.css';

const translations = {
  en: {
    welcome: 'Welcome to RadarX', loginDesc: 'Your AI-Powered Crypto Radar', loginBtn: 'Launch RadarX 🚀', 
    title: 'Market Radar', langBtn: 'العربية', search: 'Search coins...', market: 'Market', watchlist: 'Watchlist', news: 'News',
    emptyWatchlist: 'Your watchlist is empty.', noResults: 'No coins found.', readMore: 'Read Article',
    aiAnalysis: 'AI Trading Signals', signal: 'Signal', entry: 'Entry Point', target: 'Take Profit', stop: 'Stop Loss',
    notifications: 'Notifications', noNotifs: 'No new alerts.', markRead: 'Mark all as read'
  },
  ar: {
    welcome: 'مرحباً بك في RadarX', loginDesc: 'رادارك المدعوم بالذكاء الاصطناعي', loginBtn: '🚀 تشغيل الرادار', 
    title: 'سوق الرادار', langBtn: 'English', search: 'ابحث عن عملة...', market: 'السوق', watchlist: 'المفضلة', news: 'الأخبار',
    emptyWatchlist: 'قائمة المفضلة فارغة.', noResults: 'لم يتم العثور على عملات.', readMore: 'قراءة المقال',
    aiAnalysis: 'توصيات الذكاء الاصطناعي', signal: 'الإشارة', entry: 'نقطة الدخول', target: 'جني الأرباح', stop: 'وقف الخسارة',
    notifications: 'الإشعارات التنبيهية', noNotifs: 'لا توجد تنبيهات جديدة.', markRead: 'تحديد كـ مقروء'
  }
};

// 6 أخبار احتياطية بصور مختلفة في حال تعطل النت تماماً
const fallbackNews =[
  { id: 'f1', title: "البيتكوين يكسر حواجز جديدة وسط تفاؤل المستثمرين بصناديق ETF", source_info: { name: "CryptoArab" }, url: "https://cointelegraph.com", imageurl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=600&q=80" },
  { id: 'f2', title: "Ethereum Foundation announces new scaling upgrades", source_info: { name: "Global Crypto" }, url: "https://coindesk.com", imageurl: "https://images.unsplash.com/photo-1622630998477-20b41cd74c15?auto=format&fit=crop&w=600&q=80" },
  { id: 'f3', title: "الذكاء الاصطناعي يقتحم عالم التداول الرقمي بقوة هذا العام", source_info: { name: "AI Tech Daily" }, url: "https://decrypt.co", imageurl: "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&w=600&q=80" },
  { id: 'f4', title: "Solana network reaches all-time high in daily active users", source_info: { name: "Web3 Times" }, url: "https://blockworks.co", imageurl: "https://images.unsplash.com/photo-1641580529558-a96d473b6f00?auto=format&fit=crop&w=600&q=80" },
  { id: 'f5', title: "حيتان السوق يتحركون: نقل ملايين الدولارات من منصات التداول", source_info: { name: "Trading MENA" }, url: "https://ar.cointelegraph.com/", imageurl: "https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=600&q=80" },
  { id: 'f6', title: "Binance continues to expand despite regulatory challenges", source_info: { name: "Crypto News" }, url: "https://binance.com", imageurl: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80" }
];
const DEFAULT_NEWS_IMAGE = "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=600&q=80";

export default function App() {
  const[isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('radarx_logged_in') === 'true');
  const [loading, setLoading] = useState(false);
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [lang, setLang] = useState('ar');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('market');
  const[watchlist, setWatchlist] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState(null);
  
  const [showNotifs, setShowNotifs] = useState(false);
  const[alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);

  const t = translations[lang];
  const isAr = lang === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';

  useEffect(() => {
    const saved = localStorage.getItem('radarx_watchlist');
    if (saved) setWatchlist(JSON.parse(saved));
  },[]);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  },[isLoggedIn]);

  useEffect(() => {
    let source = activeTab === 'watchlist' ? coins.filter(c => watchlist.includes(c.id)) : coins;
    if (searchQuery.trim() === '') setFilteredCoins(source);
    else {
      const lower = searchQuery.toLowerCase();
      setFilteredCoins(source.filter(c => c.name.toLowerCase().includes(lower) || c.symbol.toLowerCase().includes(lower)));
    }
  },[searchQuery, coins, activeTab, watchlist]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resCoins = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true');
      const dataCoins = await resCoins.json();
      
      let dataNews = fallbackNews;
      try {
        const resNews = await fetch('https://api.coingecko.com/api/v3/news');
        const parsedNews = await resNews.json();
        if (parsedNews?.data?.length > 0) {
          dataNews = parsedNews.data.slice(0, 30).map((n, i) => ({
            id: `cg_${i}`, title: n.title, url: n.url, imageurl: n.thumb_2x, source_info: { name: n.news_site }
          }));
        } else { throw new Error("Empty CG API"); }
      } catch (e1) { 
         try {
           const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
           const resNews2 = await fetch(proxyUrl);
           const parsedNews2 = await resNews2.json();
           if (parsedNews2?.Data?.length > 0) {
             dataNews = parsedNews2.Data.slice(0, 30).map(n => ({
               id: n.id, title: n.title, url: n.url, imageurl: n.imageurl, source_info: { name: n.source_info.name }
             }));
           }
         } catch (e2) {
             console.error("All News APIs blocked by browser", e2);
         }
      }

      if(dataCoins?.length > 0) {
        setCoins(dataCoins);
        setNews(dataNews);
        generateSmartAlerts(dataCoins, dataNews);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const generateSmartAlerts = (cData, nData) => {
    const readAlerts = JSON.parse(localStorage.getItem('radarx_read_alerts') || '[]');
    let newAlerts =[];
    
    const favs = cData.filter(c => watchlist.includes(c.id));
    favs.forEach(c => {
      const change = c.price_change_percentage_24h;
      if(change > 5) {
        newAlerts.push({ id: `up_${c.id}_${change.toFixed(1)}`, type: 'bull', title: `${c.name} يطير عالياً! 🚀`, desc: `ارتفعت بنسبة ${change.toLocaleString('en-US', {maximumFractionDigits:2})}% اليوم.`, time: 'تحديث السوق' });
      } else if(change < -5) {
        newAlerts.push({ id: `down_${c.id}_${change.toFixed(1)}`, type: 'bear', title: `${c.name} في هبوط 📉`, desc: `انخفضت بنسبة ${Math.abs(change).toLocaleString('en-US', {maximumFractionDigits:2})}% راقب الدعم.`, time: 'تحديث السوق' });
      }
    });

    if(nData.length > 0) {
      newAlerts.push({ id: `news_${nData[0].id}`, type: 'news', title: '📰 خبر عاجل للتو', desc: nData[0].title, time: 'الآن' });
    }

    const unreadAlerts = newAlerts.filter(alert => !readAlerts.includes(alert.id));
    setAlerts(unreadAlerts); 
    setUnread(unreadAlerts.length);
  };

  const markAllAsRead = () => {
    const readAlerts = JSON.parse(localStorage.getItem('radarx_read_alerts') || '[]');
    const currentAlertIds = alerts.map(a => a.id);
    const updatedReadAlerts =[...readAlerts, ...currentAlertIds];
    localStorage.setItem('radarx_read_alerts', JSON.stringify(updatedReadAlerts));
    setAlerts([]);
    setUnread(0);
    setShowNotifs(false);
  };

  const toggleWatchlist = (e, coinId) => {
    e.stopPropagation();
    let updated = watchlist.includes(coinId) ? watchlist.filter(id => id !== coinId) :[...watchlist, coinId];
    setWatchlist(updated);
    localStorage.setItem('radarx_watchlist', JSON.stringify(updated));
  };const getAISignals = (coin) => {
    if(!coin) return null;
    const isBullish = coin.price_change_percentage_24h > 0;
    const volatility = Math.abs(coin.price_change_percentage_24h || 2);
    const tp = isBullish ? coin.current_price * (1 + (volatility * 1.5 / 100)) : coin.current_price * (1 - (volatility * 1.5 / 100));
    const sl = isBullish ? coin.current_price * (1 - (volatility * 0.8 / 100)) : coin.current_price * (1 + (volatility * 0.8 / 100));
    return { isBullish, entry: coin.current_price, tp, sl };
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
            onClick={() => { localStorage.setItem('radarx_logged_in', 'true'); setIsLoggedIn(true); }}
            style={{ width: '100%', padding: '18px', borderRadius: '50px', background: '#39FF14', color: '#000', fontSize: '18px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(57, 255, 20, 0.3)' }}
          >{t.loginBtn}</button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', marginTop: 30, cursor: 'pointer', fontWeight: 'bold', fontSize: 16 }} onClick={() => setLang(isAr ? 'en' : 'ar')}>{t.langBtn} 🌐</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ direction: dir }}>
      <div className="header" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radar size={28} color="#39FF14" />
          <h2 style={{ margin: 0, fontWeight: 900 }}>{t.title}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="bell-container" onClick={() => setShowNotifs(!showNotifs)}>
            {unread > 0 ? <BellRing size={24} color="#39FF14" style={{animation: 'pulse 2s infinite'}} /> : <Bell size={24} color="#f8fafc" />}
            {unread > 0 && <div className="badge">{unread.toLocaleString('en-US')}</div>}
          </div>
          <LogOut size={24} color="#ef4444" cursor="pointer" onClick={() => { localStorage.removeItem('radarx_logged_in'); setIsLoggedIn(false); }} />
        </div>

        {showNotifs && (
          <div className="notification-panel" style={{ textAlign: isAr ? 'right' : 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>{t.notifications}</h3>
              {alerts.length > 0 && <span style={{ color: '#39FF14', fontSize: 12, cursor: 'pointer' }} onClick={markAllAsRead}>{t.markRead}</span>}
            </div>
            {alerts.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', fontSize: 14 }}>{t.noNotifs}</p>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className="notif-item">
                  <div className="notif-icon">
                    {alert.type === 'bull' ? <TrendingUp size={18} color="#10b981"/> : alert.type === 'bear' ? <TrendingDown size={18} color="#ef4444"/> : <Newspaper size={18} color="#6366f1"/>}
                  </div>
                  <div>
                    <p className="notif-title">{alert.title}</p>
                    <p className="notif-desc">{alert.desc}</p>
                    <span className="notif-time">{alert.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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
            <a key={n.id || i} href={n.url} target="_blank" rel="noreferrer" className="news-card">
              <img src={n.imageurl || DEFAULT_NEWS_IMAGE} alt="news" className="news-img" onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_NEWS_IMAGE; }} />
              <div className="news-content">
                <h3 style={{ margin: '0 0 10px 0', fontSize: 16 }}>{n.title}</h3>
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
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>${coin.current_price.toLocaleString('en-US')}</div>
                  <div style={{ color: isPos ? '#10b981' : '#ef4444', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                    {isPos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(coin.price_change_percentage_24h).toLocaleString('en-US', {maximumFractionDigits:2})}%
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
            <h1 style={{ margin: '0 0 20px 0', fontSize: 36 }}>${selectedCoin.current_price.toLocaleString('en-US')}</h1>
            
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
              <h3 style={{ margin: '0 0 15px 0', color: '#39FF14', display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}><Bot size={22} /> {t.aiAnalysis}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #1e293b' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><Crosshair size={16}/> {t.signal}:</span>
                <strong style={{ color: getAISignals(selectedCoin).isBullish ? '#10b981' : '#ef4444' }}>{getAISignals(selectedCoin).isBullish ? 'LONG (شراء) 🟢' : 'SHORT (بيع) 🔴'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#94a3b8' }}>{t.entry}:</span>
                <strong style={{ color: '#fff' }}>${getAISignals(selectedCoin).entry.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><Target size={16}/> {t.target}:</span>
                <strong style={{ color: '#10b981' }}>${getAISignals(selectedCoin).tp.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', display: 'flex', alignItems:'center', gap:6 }}><ShieldAlert size={16}/> {t.stop}:</span>
                <strong style={{ color: '#ef4444' }}>${getAISignals(selectedCoin).sl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 6})}</strong>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
  }
