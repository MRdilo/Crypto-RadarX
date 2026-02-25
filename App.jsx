import React, { useState, useEffect } from 'react';
import './App.css';

// قاموس اللغات الاحترافي
const dict = {
  ar: { market: 'الأسواق', news: 'الأخبار', signals: 'توصيات AI', settings: 'الإعدادات', search: 'ابحث عن عملة...', logout: 'خروج', login: 'دخول', loading: 'جاري التحميل...', buy: 'شراء', sell: 'بيع', entry: 'دخول:', target: 'هدف:', stop: 'وقف:', portfolio: 'محفظتي', converter: 'المحول المالي', change_name: 'تغيير الاسم', lang: 'اللغة', wealth: 'إجمالي الثروة', balance: 'الكاش المتوفر', empty: 'لا توجد عملات في محفظتك' },
  en: { market: 'Markets', news: 'News', signals: 'AI Signals', settings: 'Settings', search: 'Search coins...', logout: 'Logout', login: 'Login', loading: 'Loading...', buy: 'Buy', sell: 'Sell', entry: 'Entry:', target: 'Target:', stop: 'Stop:', portfolio: 'Portfolio', converter: 'Converter', change_name: 'Edit Name', lang: 'Language', wealth: 'Total Wealth', balance: 'Available Cash', empty: 'Portfolio is empty' }
};

// مؤشر الخوف والطمع الصغير والنظيف
const FearGreedGauge = ({ value, label, lang }) => {
  const angle = (value / 100) * 180 - 180;
  const color = value > 70 ? '#10b981' : value < 30 ? '#ef4444' : '#f59e0b';
  return (
    <div className="gauge-container">
      <div className="gauge-visual">
        <div className="gauge-bg"></div>
        <div className="gauge-fill" style={{borderColor: color, transform: `rotate(${angle}deg)`}}></div>
        <div className="gauge-value" style={{color: color}}>{value}</div>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

// الرسم البياني المصغر والمستقر
const MiniChart = ({ data, isUp }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data); const max = Math.max(...data);
  const width = 80; const height = 30;
  const points = data.map((p, i) => `${(i/(data.length-1))*width},${max===min?height/2:height-((p-min)/(max-min))*height}`).join(' ');
  return <svg width={width} height={height}><polyline points={points} fill="none" stroke={isUp?'#10b981':'#ef4444'} strokeWidth="2" strokeLinecap="round" /></svg>;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || 'Walid');
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');
  const [activeTab, setActiveTab] = useState('market');
  
  const [coins, setCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [fng, setFng] = useState({ value: 50, label: 'Neutral' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [balance] = useState(10000); // رصيد افتراضي للعرض
  const [portfolio] = useState([]); // محفظة تجريبية
  const [convAmt, setConvAmt] = useState(1);
  const [fromCoin, setFromCoin] = useState('bitcoin');
  const [toFiat, setToFiat] = useState('usd');

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
      Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true').then(r => r.json()),
        fetch('https://api.alternative.me/fng/').then(r => r.json()),
        fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN').then(r => r.json())
      ]).then(([cData, fData, nData]) => {
        setCoins(cData);
        if(fData.data) setFng({ value: parseInt(fData.data[0].value), label: fData.data[0].value_classification });
        if(nData.Data) setNews(nData.Data.slice(0, 15));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isLoggedIn]);

  const getConv = () => {
    const c = coins.find(i => i.id === fromCoin);
    if (!c) return 0;
    let r = c.current_price;
    if (toFiat === 'dzd') r *= 134.5;
    return (convAmt * r).toLocaleString(undefined, {maximumFractionDigits: 2});
  };

  if (!isLoggedIn) {
    return (
      <div className="app-body login-container" dir={isAr?'rtl':'ltr'}>
        <div className="logo-text">RADARX</div>
        <button className="login-btn" onClick={() => setIsLoggedIn(true)}>{t.login}</button>
      </div>
    );
  }

  return (
    <div className="app-body" style={{fontFamily: isAr?'Cairo':'Poppins'}} dir={isAr?'rtl':'ltr'}>
      <div className="main-viewport">
        
        {/* صفحة الأسواق - منظمة بـ 3 أعمدة ثابتة */}
        {activeTab === 'market' && (
          <>
            <div className="market-header">
               <h2 className="radar-title">RadarX</h2>
               <FearGreedGauge value={fng.value} label={fng.label} lang={lang} />
            </div>
            <div className="search-box-container">
               <input className="search-input" placeholder={t.search} onChange={e=>setSearchQuery(e.target.value)} />
            </div>
            <div className="market-list">
              {coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                <div key={c.id} className="coin-row">
                  <div className="col-symbol">
                     <img src={c.image} alt=""/>
                     <b>{c.symbol.toUpperCase()}</b>
                  </div>
                  <div className="col-chart">
                     <MiniChart data={c.sparkline_in_7d?.price} isUp={c.price_change_percentage_24h > 0} />
                  </div>
                  <div className="col-price">
                    <span className="current-p">${c.current_price.toLocaleString()}</span>
                    <span className={`perc-p ${c.price_change_percentage_24h > 0 ? 'up':'down'}`}>{c.price_change_percentage_24h?.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* صفحة التوصيات - AI Signals */}
        {activeTab === 'signals' && (
          <div className="padding-container">
             <h3 className="section-title">{t.signals} 🤖</h3>
             {coins.filter(c => Math.abs(c.price_change_percentage_24h) > 4).slice(0, 8).map(coin => {
                const isBuy = coin.price_change_percentage_24h < 0;
                return (
                  <div key={coin.id} className="signal-card" style={{borderRight: isAr && `4px solid ${isBuy?'#10b981':'#ef4444'}`, borderLeft: !isAr && `4px solid ${isBuy?'#10b981':'#ef4444'}`}}>
                    <div className="signal-header">
                      <b>{coin.symbol.toUpperCase()}/USDT</b>
                      <span className="signal-label" style={{background: isBuy?'#10b981':'#ef4444'}}>{isBuy?t.buy:t.sell}</span>
                    </div>
                    <div className="signal-data">
                      <div><small>{t.entry}</small><br/><b>${coin.current_price.toFixed(2)}</b></div>
                      <div><small>{t.target}</small><br/><b style={{color:'#10b981'}}>${(coin.current_price*(isBuy?1.08:0.92)).toFixed(2)}</b></div>
                      <div><small>{t.stop}</small><br/><b style={{color:'#ef4444'}}>${(coin.current_price*(isBuy?0.95:1.05)).toFixed(2)}</b></div>
                    </div>
                  </div>
                );
             })}
          </div>
        )}

        {/* صفحة الأخبار */}
        {activeTab === 'news' && (
          <div className="padding-container">
            <h3 className="section-title">{t.news} 📰</h3>
            {news.map((n, i) => (
              <div key={i} className="news-item-card">
                <img src={n.imageurl} alt=""/>
                <div className="news-content">
                   <h4>{n.title.substring(0, 70)}...</h4>
                   <a href={n.url} target="_blank" rel="noreferrer">Open Info ↗️</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* صفحة الإعدادات والمحفظة والمحول */}
        {activeTab === 'settings' && (
          <div className="padding-container">
            <div className="profile-hub">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} alt=""/>
              <input className="username-edit" value={username} onChange={e=>setUsername(e.target.value)} />
              <button className="lang-switcher" onClick={()=>setLang(isAr?'en':'ar')}>{isAr?'Switch to English':'تحويل للعربية'}</button>
            </div>

            <div className="settings-card">
               <h4 className="card-title">{t.portfolio} 💰</h4>
               <div className="port-stats">
                  <div><small>{t.wealth}</small><br/><b>${balance.toLocaleString()}</b></div>
                  <div><small>{t.balance}</small><br/><b>${balance.toLocaleString()}</b></div>
               </div>
               <p style={{fontSize:'12px', color:'#64748b', textAlign:'center', marginTop:'15px'}}>{t.empty}</p>
            </div>

            <div className="settings-card">
               <h4 className="card-title">{t.converter} 🔄</h4>
               <input type="number" className="styled-input" value={convAmt} onChange={e=>setConvAmt(e.target.value)} />
               <select className="styled-input" value={fromCoin} onChange={e=>setFromCoin(e.target.value)}>
                 {coins.slice(0, 15).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <select className="styled-input" value={toFiat} onChange={e=>setToFiat(e.target.value)}>
                 <option value="usd">USD ($)</option>
                 <option value="dzd">DZD (DA)</option>
               </select>
               <div className="result-display">{getConv()} {toFiat.toUpperCase()}</div>
            </div>
            
            <button onClick={()=>setIsLoggedIn(false)} className="logout-btn">{t.logout}</button>
          </div>
        )}
      </div>

      {/* شريط التنقل السفلي */}
      <nav className="bottom-navbar">
        <div className={`nav-link ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}>⚙️</div>
        <div className={`nav-link ${activeTab==='news'?'active':''}`} onClick={()=>setActiveTab('news')}>📰</div>
        <div className={`nav-item-center ${activeTab==='signals'?'active':''}`} onClick={()=>setActiveTab('signals')}>🤖</div>
        <div className={`nav-link ${activeTab==='market'?'active':''}`} onClick={()=>setActiveTab('market')}>📈</div>
      </nav>
    </div>
  );
}
