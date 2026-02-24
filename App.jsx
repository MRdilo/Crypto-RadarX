import React, { useState, useEffect } from 'react';
import './App.css';

const dict = {
  ar: { market: 'الأسواق', news: 'الأخبار', signals: 'توصيات AI', settings: 'الإعدادات', search: 'ابحث عن عملة...', logout: 'خروج', login: 'دخول', loading: 'جاري التحميل...', entry: 'الدخول:', target: 'الهدف:', stop: 'وقف:', portfolio: 'محفظتي الاستثمارية', converter: 'محول العملات', change_name: 'تغيير الاسم', lang: 'اللغة', wealth: 'إجمالي الثروة:', balance: 'الكاش المتوفر:', empty: 'محفظتك فارغة حالياً' },
  en: { market: 'Markets', news: 'News', signals: 'AI Signals', settings: 'Settings', search: 'Search...', logout: 'Logout', login: 'Login', loading: 'Loading...', entry: 'Entry:', target: 'Target:', stop: 'Stop:', portfolio: 'My Portfolio', converter: 'Converter', change_name: 'Edit Name', lang: 'Language', wealth: 'Total Wealth:', balance: 'Available Cash:', empty: 'Portfolio is empty' }
};

const FearGreedGauge = ({ value, label, lang }) => {
  const isAr = lang === 'ar';
  const angle = (value / 100) * 180 - 180;
  const color = value > 70 ? '#10b981' : value < 30 ? '#ef4444' : '#f59e0b';
  return (
    <div className="gauge-box">
      <div className="gauge-wrap">
        <div className="gauge-bg"></div>
        <div className="gauge-fill" style={{borderColor: color, transform: `rotate(${angle}deg)`}}></div>
        <div className="gauge-val" style={{color: color}}>{value}</div>
      </div>
      <div className="gauge-txt">{label}</div>
    </div>
  );
};

const MiniChart = ({ data, isUp }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data); const max = Math.max(...data);
  const width = 70; const height = 25;
  const points = data.map((p, i) => `${(i/(data.length-1))*width},${max===min?height/2:height-((p-min)/(max-min))*height}`).join(' ');
  return <svg width={width} height={height}><polyline points={points} fill="none" stroke={isUp?'#10b981':'#ef4444'} strokeWidth="1.5" strokeLinecap="round" /></svg>;
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
  
  const [balance] = useState(10000); // رصيد وهمي ثابت للعرض
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
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true').then(r => r.json()),
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
      <div className="main-content">
        {activeTab === 'market' && (
          <>
            <div className="clean-header">
               <h2 className="brand-name">RadarX</h2>
               <FearGreedGauge value={fng.value} label={fng.label} lang={lang} />
            </div>
            <div className="search-wrap"><input className="clean-input" placeholder={t.search} onChange={e=>setSearchQuery(e.target.value)} /></div>
            <div className="coin-list">
              {coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                <div key={c.id} className="coin-item">
                  <div className="coin-info">
                     <img src={c.image} alt=""/>
                     <div><b>{c.symbol.toUpperCase()}</b></div>
                  </div>
                  <MiniChart data={c.sparkline_in_7d?.price} isUp={c.price_change_percentage_24h > 0} />
                  <div className="coin-price">
                    <b>${c.current_price.toLocaleString()}</b>
                    <span className={c.price_change_percentage_24h > 0 ? 'up':'down'}>{c.price_change_percentage_24h?.toFixed(2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'signals' && (
          <div className="padding-20">
             <h3 className="tab-title">{t.signals} 🤖</h3>
             {coins.filter(c => Math.abs(c.price_change_percentage_24h) > 4).slice(0, 6).map(coin => {
                const isBuy = coin.price_change_percentage_24h < 0;
                return (
                  <div key={coin.id} className="signal-card" style={{borderLeft: `4px solid ${isBuy?'#10b981':'#ef4444'}`}}>
                    <div className="sig-head">
                      <b>{coin.symbol.toUpperCase()}/USDT</b>
                      <span className="sig-tag" style={{background: isBuy?'#10b981':'#ef4444'}}>{isBuy?'BUY':'SELL'}</span>
                    </div>
                    <div className="sig-body">
                      <div><small>{t.entry}</small><br/><b>${coin.current_price.toFixed(2)}</b></div>
                      <div><small>{t.target}</small><br/><b style={{color:'#10b981'}}>${(coin.current_price*(isBuy?1.08:0.92)).toFixed(2)}</b></div>
                      <div><small>{t.stop}</small><br/><b style={{color:'#ef4444'}}>${(coin.current_price*(isBuy?0.95:1.05)).toFixed(2)}</b></div>
                    </div>
                  </div>
                );
             })}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="padding-20">
            <h3 className="tab-title">{t.news} 📰</h3>
            {news.map((n, i) => (
              <div key={i} className="news-item">
                <img src={n.imageurl} alt=""/>
                <div className="news-txt">
                   <h4>{n.title.substring(0, 65)}...</h4>
                   <a href={n.url} target="_blank" rel="noreferrer">Open Story ↗️</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="padding-20">
            <div className="user-box">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} alt=""/>
              <input className="input-name" value={username} onChange={e=>setUsername(e.target.value)} />
              <button className="btn-lang" onClick={()=>setLang(isAr?'en':'ar')}>{isAr?'Switch Language':'تغيير اللغة'}</button>
            </div>

            <h3 className="section-head">{t.portfolio} 💰</h3>
            <div className="port-card">
               <div className="port-stat"><small>{t.wealth}</small><b>${balance.toLocaleString()}</b></div>
               <div className="port-stat"><small>{t.balance}</small><b>${balance.toLocaleString()}</b></div>
               <p style={{fontSize:'12px', color:'#64748b', marginTop:'15px'}}>{t.empty}</p>
            </div>

            <h3 className="section-head">{t.converter} 🔄</h3>
            <div className="conv-card">
               <input type="number" className="clean-input" value={convAmt} onChange={e=>setConvAmt(e.target.value)} />
               <select className="clean-input" value={fromCoin} onChange={e=>setFromCoin(e.target.value)}>
                 {coins.slice(0, 15).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <select className="clean-input" value={toFiat} onChange={e=>setToFiat(e.target.value)}>
                 <option value="usd">USD ($)</option>
                 <option value="dzd">DZD (DA)</option>
               </select>
               <div className="conv-val">{getConv()} {toFiat.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>

      <nav className="nav-bar">
        <div className={`nav-link ${activeTab==='settings'?'on':''}`} onClick={()=>setActiveTab('settings')}>⚙️</div>
        <div className={`nav-link ${activeTab==='news'?'on':''}`} onClick={()=>setActiveTab('news')}>📰</div>
        <div className={`nav-link ${activeTab==='signals'?'on':''}`} onClick={()=>setActiveTab('signals')}>🤖</div>
        <div className={`nav-link ${activeTab==='market'?'on':''}`} onClick={()=>setActiveTab('market')}>📈</div>
      </nav>
    </div>
  );
            }
