import React, { useState, useEffect } from 'react';
import './App.css';

const dict = {
  ar: { market: 'الأسواق', news: 'أخبار الاستثمار', signals: 'توصيات RadarX', search: 'ابحث عن عملة...', logout: 'خروج', login: 'دخول', loading: 'جاري جلب البيانات...', buy: 'شراء قوي', sell: 'بيع بخسارة', hold: 'مراقبة', fng: 'مؤشر الجشع والخوف' },
  en: { market: 'Markets', news: 'Investing News', signals: 'RadarX Signals', search: 'Search coins...', logout: 'Logout', login: 'Login', loading: 'Fetching data...', buy: 'Strong Buy', sell: 'Sell', hold: 'Hold', fng: 'Fear & Greed Index' }
};

const MiniChart = ({ data, isUp }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data); const max = Math.max(...data);
  const width = 80; const height = 35; const color = isUp ? '#10b981' : '#ef4444';
  const points = data.map((price, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = max === min ? height / 2 : height - ((price - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(' ');
  return <svg width={width} height={height} style={{ margin: '0 10px' }}><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || `User_${Math.floor(Math.random() * 9000) + 1000}`);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');
  const [activeTab, setActiveTab] = useState('market');
  const [coins, setCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [fng, setFng] = useState({ value: 50, label: 'Neutral' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const t = dict[lang];
  const isAr = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('username', username);
    localStorage.setItem('lang', lang);
  }, [isLoggedIn, username, lang]);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      if (activeTab === 'market') {
        // جلب أفضل 100 عملة بدلاً من 20
        Promise.all([
          fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true').then(r => r.json()),
          fetch('https://api.alternative.me/fng/').then(r => r.json())
        ]).then(([coinData, fngData]) => {
          setCoins(coinData);
          setFng({ value: fngData.data[0].value, label: fngData.data[0].value_classification });
          setLoading(false);
        }).catch(() => setLoading(false));
      }

      if (activeTab === 'news') {
        // جلب الأخبار العالمية القوية
        fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN`)
          .then(res => res.json())
          .then(data => {
            setNews(data.Data.slice(0, 25));
            setLoading(false);
          });
      }
    }
  }, [isLoggedIn, activeTab]);

  if (!isLoggedIn) {
    return (
      <div className="app-body login-container" style={{fontFamily: isAr ? 'Cairo' : 'Poppins'}} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="logo-text">RADARX</div>
        <p style={{color:'#64748b', marginBottom: '30px'}}>Crypto Intelligence</p>
        <button className="login-btn" onClick={() => setIsLoggedIn(true)}>{t.login}</button>
      </div>
    );
  }

  return (
    <div className="app-body" style={{fontFamily: isAr ? 'Cairo' : 'Poppins'}} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="top-bar">
        <div className="profile-section">
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=1e293b`} className="avatar" alt="User" />
          <input className="username-input" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div style={{display:'flex', gap:'10px'}}>
          <button className="lang-btn" onClick={() => setLang(isAr ? 'en' : 'ar')}>{isAr ? 'EN' : 'عربي'}</button>
          <button onClick={() => setIsLoggedIn(false)} style={{background:'none', border:'none', color:'#ef4444', fontWeight:'bold'}}>{t.logout}</button>
        </div>
      </div>

      <div className="content-area">
        {activeTab === 'market' && (
          <>
            <div className="fng-card">
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span>{t.fng}</span><b style={{color: fng.value > 50 ? '#10b981' : '#ef4444'}}>{fng.label}</b></div>
              <div className="fng-bar-bg"><div className="fng-bar-fill" style={{width: `${fng.value}%`, backgroundColor: fng.value > 50 ? '#10b981' : '#ef4444'}}></div></div>
              <center style={{marginTop:'8px', fontSize:'14px'}}>{fng.value} / 100</center>
            </div>
            <div className="search-container"><input type="text" className="input-field" placeholder={t.search} onChange={e => setSearchQuery(e.target.value)} /></div>
            {loading ? <p style={{textAlign:'center', marginTop:'20px'}}>{t.loading}</p> : 
              coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(coin => (
              <div key={coin.id} className="coin-row">
                <div style={{display:'flex', alignItems:'center', width:'35%'}}><img src={coin.image} className="coin-icon" alt={coin.name} /><b>{coin.symbol.toUpperCase()}</b></div>
                <div style={{width:'30%', display:'flex', justifyContent:'center'}}><MiniChart data={coin.sparkline_in_7d?.price} isUp={coin.price_change_percentage_24h > 0} /></div>
                <div style={{textAlign: isAr ? 'left' : 'right', width:'35%'}}><b>${coin.current_price.toLocaleString()}</b><div className={coin.price_change_percentage_24h > 0 ? 'price-up' : 'price-down'}>{coin.price_change_percentage_24h?.toFixed(2)}%</div></div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'news' && (
          <div style={{padding: '10px'}}>
            <h3 style={{padding:'0 10px', fontSize:'16px', color:'#818cf8'}}>🔥 أهم أخبار الأسواق</h3>
            {loading ? <p style={{textAlign:'center'}}>{t.loading}</p> : news.map((item, i) => (
              <div key={i} className="coin-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'12px'}}>
                <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                   <img src={item.imageurl} style={{width:'65px', height:'65px', borderRadius:'10px', objectFit:'cover'}} alt="news" />
                   <div>
                      <h4 style={{margin:0, fontSize:'14px', lineHeight:'1.4'}}>{item.title.substring(0, 80)}...</h4>
                      <small style={{color:'#64748b'}}>{item.source_info.name} • {new Date(item.published_on * 1000).toLocaleDateString()}</small>
                   </div>
                </div>
                <a href={item.url} target="_blank" rel="noreferrer" style={{alignSelf:'flex-end', background:'#1e293b', color:'#818cf8', padding:'5px 12px', borderRadius:'5px', fontSize:'11px', textDecoration:'none'}}>اقرأ المزيد ↗️</a>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'signals' && (
          <div style={{padding: '10px'}}>
            <div className="coin-row" style={{borderLeft:'4px solid #10b981'}}>
              <div><b>BTC/USDT</b><br/><small style={{color:'#64748b'}}>RadarX Engine • 4H</small></div>
              <div style={{textAlign:'right'}}><span style={{color:'#10b981', fontWeight:'bold'}}>{t.buy}</span><br/><small>$67,100</small></div>
            </div>
            <div className="coin-row" style={{borderLeft:'4px solid #ef4444'}}>
              <div><b>SOL/USDT</b><br/><small style={{color:'#64748b'}}>RadarX Engine • 1H</small></div>
              <div style={{textAlign:'right'}}><span style={{color:'#ef4444', fontWeight:'bold'}}>{t.sell}</span><br/><small>$158.2</small></div>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab === 'signals' ? 'active' : ''}`} onClick={() => setActiveTab('signals')}>🎯 <div>{t.signals}</div></div>
        <div className={`nav-item ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}>📰 <div>{t.news}</div></div>
        <div className={`nav-item ${activeTab === 'market' ? 'active' : ''}`} onClick={() => setActiveTab('market')}>📈 <div>{t.market}</div></div>
      </div>
    </div>
  );
        }
