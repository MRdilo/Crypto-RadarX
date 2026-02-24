import React, { useState, useEffect } from 'react';
import './App.css';

const dict = {
  ar: { market: 'الأسواق', news: 'الأخبار', signals: 'توصيات AI', settings: 'الإعدادات', search: 'ابحث عن عملة...', logout: 'خروج', login: 'دخول', loading: 'جاري التحليل...', buy: 'شراء', sell: 'بيع', entry: 'الدخول:', target: 'الهدف:', stop: 'وقف:', portfolio: 'المحفظة المالية', converter: 'محول العملات', change_name: 'تغيير الاسم', lang: 'اللغة', balance: 'الرصيد:', wealth: 'الثروة:', fng: 'مؤشر الخوف' },
  en: { market: 'Markets', news: 'News', signals: 'AI Signals', settings: 'Settings', search: 'Search...', logout: 'Logout', login: 'Login', loading: 'Analyzing...', buy: 'Buy', sell: 'Sell', entry: 'Entry:', target: 'Target:', stop: 'Stop:', portfolio: 'Demo Portfolio', converter: 'Currency Converter', change_name: 'Edit Name', lang: 'Language', balance: 'Balance:', wealth: 'Wealth:', fng: 'Fear & Greed' }
};

const FearGreedGauge = ({ value, label, lang }) => {
  const isAr = lang === 'ar';
  const angle = (value / 100) * 180 - 180;
  const color = value > 70 ? '#10b981' : value < 30 ? '#ef4444' : '#f59e0b';
  return (
    <div className="fng-card-mini">
      <div className="gauge-container">
        <div className="gauge-bg"></div>
        <div className="gauge-fill" style={{borderColor: color, transform: `rotate(${angle}deg)`}}></div>
        <div className="gauge-value" style={{color: color}}>{value}</div>
      </div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

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
  const [trending, setTrending] = useState([]);
  const [fng, setFng] = useState({ value: 50, label: 'Neutral' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem('radarx_balance')) || 10000);
  const [portfolio, setPortfolio] = useState(() => JSON.parse(localStorage.getItem('radarx_portfolio')) || []);
  const [convAmt, setConvAmt] = useState(1);
  const [fromCoin, setFromCoin] = useState('bitcoin');
  const [toFiat, setToFiat] = useState('usd');

  const t = dict[lang];
  const isAr = lang === 'ar';

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('username', username);
    localStorage.setItem('lang', lang);
    localStorage.setItem('radarx_balance', balance);
    localStorage.setItem('radarx_portfolio', JSON.stringify(portfolio));
  }, [isLoggedIn, username, lang, balance, portfolio]);

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      Promise.all([
        fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true').then(r => r.json()),
        fetch('https://api.alternative.me/fng/').then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()),
        fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN').then(r => r.json())
      ]).then(([cData, fData, tData, nData]) => {
        setCoins(cData);
        if(fData.data) setFng({ value: parseInt(fData.data[0].value), label: fData.data[0].value_classification });
        if(tData.coins) setTrending(tData.coins.map(c => c.item));
        if(nData.Data) setNews(nData.Data.slice(0, 15));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isLoggedIn]);

  const handleBuy = (coin) => {
    const cost = coin.current_price * 0.1;
    if (balance >= cost) {
      setBalance(b => b - cost);
      setPortfolio(p => {
        const exist = p.find(i => i.id === coin.id);
        if (exist) return p.map(i => i.id === coin.id ? {...i, amount: i.amount + 0.1, cost: i.cost + cost} : i);
        return [...p, {id: coin.id, symbol: coin.symbol, amount: 0.1, cost: cost, image: coin.image}];
      });
      alert(isAr ? 'تم الشراء!' : 'Bought!');
    }
  };

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
            <div className="header-row">
               <h2 style={{margin:0}}>RadarX</h2>
               <FearGreedGauge value={fng.value} label={fng.label} lang={lang} />
            </div>
            <div className="search-container"><input className="input-field" placeholder={t.search} onChange={e=>setSearchQuery(e.target.value)} /></div>
            {coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
              <div key={c.id} className="coin-row">
                <div style={{display:'flex', alignItems:'center', gap:'10px', width:'35%'}}>
                   <img src={c.image} style={{width:'24px'}} alt=""/>
                   <b>{c.symbol.toUpperCase()}</b>
                </div>
                <MiniChart data={c.sparkline_in_7d?.price} isUp={c.price_change_percentage_24h > 0} />
                <div style={{textAlign:isAr?'left':'right', width:'35%'}}>
                  <b>${c.current_price.toLocaleString()}</b>
                  <button className="mini-buy-btn" onClick={()=>handleBuy(c)}>+</button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'signals' && (
          <div className="padding-box">
             <div className="trending-bar">
               {trending.map(tCoin => <img key={tCoin.id} src={tCoin.small} className="trend-img" alt=""/>)}
             </div>
             {coins.filter(c => Math.abs(c.price_change_percentage_24h) > 4).slice(0, 6).map(coin => {
                const isBuy = coin.price_change_percentage_24h < 0;
                return (
                  <div key={coin.id} className="signal-card" style={{borderLeft: `4px solid ${isBuy?'#10b981':'#ef4444'}`}}>
                    <div className="signal-header">
                      <b>{coin.symbol.toUpperCase()}/USDT</b>
                      <span className="signal-badge" style={{background: isBuy?'#10b981':'#ef4444'}}>{isBuy?t.buy:t.sell}</span>
                    </div>
                    <div className="signal-grid">
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
          <div className="padding-box">
            {news.map((n, i) => (
              <div key={i} className="news-card">
                <img src={n.imageurl} alt=""/>
                <div>
                   <h4>{n.title.substring(0, 60)}...</h4>
                   <a href={n.url} target="_blank" rel="noreferrer">اقرأ الخبر ↗️</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="padding-box">
            <div className="profile-card">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}`} className="profile-img" alt=""/>
              <input className="edit-name" value={username} onChange={e=>setUsername(e.target.value)} />
              <button className="lang-toggle" onClick={()=>setLang(isAr?'en':'ar')}>{isAr?'Switch to English':'تحويل للعربية'}</button>
            </div>

            <h3 className="section-title">{t.portfolio} 💰</h3>
            <div className="portfolio-summary">
               <div><small>{t.wealth}</small><br/><b>${(balance + portfolio.reduce((acc, i) => acc + (i.amount * (coins.find(c=>c.id===i.id)?.current_price || 0)), 0)).toLocaleString()}</b></div>
               <div><small>{t.balance}</small><br/><b>${balance.toLocaleString()}</b></div>
            </div>

            <h3 className="section-title">{t.converter} 🔄</h3>
            <div className="converter-box">
               <input type="number" className="input-field" value={convAmt} onChange={e=>setConvAmt(e.target.value)} />
               <select className="input-field" value={fromCoin} onChange={e=>setFromCoin(e.target.value)}>
                 {coins.slice(0, 20).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <select className="input-field" value={toFiat} onChange={e=>setToFiat(e.target.value)}>
                 <option value="usd">USD ($)</option>
                 <option value="dzd">DZD (DA)</option>
               </select>
               <div className="conv-res">{getConv()} {toFiat.toUpperCase()}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}>⚙️</div>
        <div className={`nav-item ${activeTab==='news'?'active':''}`} onClick={()=>setActiveTab('news')}>📰</div>
        <div className={`nav-item ${activeTab==='signals'?'active':''}`} onClick={()=>setActiveTab('signals')}>🤖</div>
        <div className={`nav-item ${activeTab==='market'?'active':''}`} onClick={()=>setActiveTab('market')}>📈</div>
      </div>
    </div>
  );
        }
