import React, { useState, useEffect } from 'react';
import './App.css';

const dict = {
  ar: { market: 'الأسواق', news: 'الأخبار', signals: 'توصيات AI', convert: 'المحول', portfolio: 'المحفظة', search: 'ابحث...', logout: 'خروج', login: 'دخول', loading: 'جاري التحميل...', buy_btn: 'شراء', balance: 'الرصيد المتاح:', wealth: 'إجمالي الثروة:', profit: 'الربح/الخسارة:', empty_p: 'محفظتك فارغة، ابدأ الشراء من الأسواق!', fng: 'مؤشر الخوف' },
  en: { market: 'Markets', news: 'News', signals: 'AI Signals', convert: 'Convert', portfolio: 'Portfolio', search: 'Search...', logout: 'Logout', login: 'Login', loading: 'Loading...', buy_btn: 'Buy', balance: 'Available Balance:', wealth: 'Total Wealth:', profit: 'Profit/Loss:', empty_p: 'Portfolio empty, start buying from Markets!', fng: 'Fear & Greed' }
};

const MiniChart = ({ data, isUp }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data); const max = Math.max(...data);
  const width = 80; const height = 35; const color = isUp ? '#10b981' : '#ef4444';
  const points = data.map((p, i) => `${(i/(data.length-1))*width},${max===min?height/2:height-((p-min)/(max-min))*height}`).join(' ');
  return <svg width={width} height={height} style={{margin:'0 10px'}}><polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  const [username, setUsername] = useState(() => localStorage.getItem('username') || `User_${Math.floor(Math.random()*9000)+1000}`);
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'ar');
  const [activeTab, setActiveTab] = useState('market');
  
  const [coins, setCoins] = useState([]);
  const [news, setNews] = useState([]);
  const [trending, setTrending] = useState([]);
  const [fng, setFng] = useState({ value: 50, label: 'Neutral' });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Portfolio States
  const [balance, setBalance] = useState(() => parseFloat(localStorage.getItem('radarx_balance')) || 10000);
  const [portfolio, setPortfolio] = useState(() => JSON.parse(localStorage.getItem('radarx_portfolio')) || []);

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
        if(fData.data) setFng({ value: fData.data[0].value, label: fData.data[0].value_classification });
        if(tData.coins) setTrending(tData.coins.map(c => c.item));
        if(nData.Data) setNews(nData.Data.slice(0, 20));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isLoggedIn]);

  // دالة الشراء
  const handleBuy = (coin) => {
    const amountToBuy = 0.1; // كمية افتراضية للشراء السريع
    const cost = coin.current_price * amountToBuy;
    
    if (balance >= cost) {
      setBalance(prev => prev - cost);
      setPortfolio(prev => {
        const existing = prev.find(item => item.id === coin.id);
        if (existing) {
          return prev.map(item => item.id === coin.id 
            ? { ...item, amount: item.amount + amountToBuy, totalCost: item.totalCost + cost }
            : item
          );
        }
        return [...prev, { id: coin.id, symbol: coin.symbol, name: coin.name, amount: amountToBuy, totalCost: cost, image: coin.image }];
      });
      alert(isAr ? `تم شراء ${amountToBuy} من ${coin.symbol.toUpperCase()}` : `Bought ${amountToBuy} ${coin.symbol.toUpperCase()}`);
    } else {
      alert(isAr ? "الرصيد غير كافٍ!" : "Insufficient balance!");
    }
  };

  // حساب القيمة الإجمالية للمحفظة
  const calculateTotalWealth = () => {
    let holdingsValue = 0;
    portfolio.forEach(item => {
      const liveData = coins.find(c => c.id === item.id);
      if (liveData) holdingsValue += item.amount * liveData.current_price;
    });
    return holdingsValue + balance;
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
      <div className="top-bar">
        <div className="profile-section">
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${username}&backgroundColor=1e293b`} className="avatar" alt="User" />
          <input className="username-input" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <button className="lang-btn" onClick={() => setLang(isAr?'en':'ar')}>{isAr?'EN':'عربي'}</button>
      </div>

      <div className="content-area">
        {activeTab === 'market' && (
          <>
            <div className="fng-card">
               <span>{t.fng}: <b>{fng.label}</b> ({fng.value})</span>
               <div className="fng-bar-bg"><div className="fng-bar-fill" style={{width:`${fng.value}%`, background: fng.value>50?'#10b981':'#ef4444'}}></div></div>
            </div>
            <div className="search-container"><input className="input-field" placeholder={t.search} onChange={e=>setSearchQuery(e.target.value)} /></div>
            {loading ? <p style={{textAlign:'center'}}>{t.loading}</p> : 
              coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
              <div key={c.id} className="coin-row">
                <div style={{display:'flex', alignItems:'center', width:'30%'}}><img src={c.image} className="coin-icon" alt={c.name} /><b>{c.symbol.toUpperCase()}</b></div>
                <MiniChart data={c.sparkline_in_7d?.price} isUp={c.price_change_percentage_24h > 0} />
                <div style={{textAlign:isAr?'left':'right', width:'30%'}}>
                  <b>${c.current_price.toLocaleString()}</b>
                  <button onClick={() => handleBuy(c)} style={{background:'#10b981', color:'white', border:'none', borderRadius:'5px', padding:'2px 8px', fontSize:'10px', display:'block', marginTop:'5px', cursor:'pointer'}}>{t.buy_btn} +</button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'portfolio' && (
          <div style={{padding:'15px'}}>
            <div className="fng-card" style={{background: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)', textAlign:'center'}}>
               <small style={{color:'#64748b'}}>{t.wealth}</small>
               <h1 style={{margin:'5px 0', color:'#818cf8'}}>${calculateTotalWealth().toLocaleString(undefined, {maximumFractionDigits: 2})}</h1>
               <div style={{display:'flex', justifyContent:'space-around', marginTop:'15px', borderTop:'1px solid #1e293b', paddingTop:'10px'}}>
                  <div><small style={{color:'#64748b'}}>{t.balance}</small><br/><b>${balance.toLocaleString(undefined, {maximumFractionDigits: 2})}</b></div>
               </div>
            </div>

            {portfolio.length === 0 ? <p style={{textAlign:'center', color:'#64748b', marginTop:'40px'}}>{t.empty_p}</p> : 
              portfolio.map(item => {
                const live = coins.find(c => c.id === item.id);
                const currentVal = live ? item.amount * live.current_price : 0;
                const profit = currentVal - item.totalCost;
                const profitPerc = (profit / item.totalCost) * 100;
                return (
                  <div key={item.id} className="coin-row">
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                       <img src={item.image} style={{width:'30px'}} alt={item.name} />
                       <div><b>{item.symbol.toUpperCase()}</b><br/><small style={{color:'#64748b'}}>{item.amount.toFixed(4)}</small></div>
                    </div>
                    <div style={{textAlign:isAr?'left':'right'}}>
                       <b>${currentVal.toLocaleString(undefined, {maximumFractionDigits: 2})}</b>
                       <div style={{color: profit >= 0 ? '#10b981' : '#ef4444', fontSize:'12px'}}>
                         {profit >= 0 ? '▲' : '▼'} {Math.abs(profitPerc).toFixed(2)}%
                       </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {activeTab === 'signals' && (
           <div style={{padding:'10px'}}>
             <h3 style={{color:'#818cf8', fontSize:'16px', padding:'0 10px'}}>🎯 AI Trade Setups</h3>
             {coins.filter(c => Math.abs(c.price_change_percentage_24h) > 5).slice(0, 5).map(coin => (
                <div key={coin.id} className="coin-row" style={{borderLeft: `4px solid ${coin.price_change_percentage_24h < 0 ? '#10b981' : '#ef4444'}`}}>
                   <b>{coin.symbol.toUpperCase()}/USDT</b>
                   <span style={{color: coin.price_change_percentage_24h < 0 ? '#10b981' : '#ef4444'}}>
                     {coin.price_change_percentage_24h < 0 ? 'STRONG BUY' : 'SELL'}
                   </span>
                </div>
             ))}
           </div>
        )}

        {activeTab === 'news' && (
          <div style={{padding:'10px'}}>
            {news.map((n, i) => (
              <div key={i} className="coin-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'10px'}}>
                <h4 style={{margin:0, fontSize:'14px'}}>{n.title.substring(0, 80)}...</h4>
                <a href={n.url} target="_blank" style={{color:'#818cf8', fontSize:'12px', textDecoration:'none'}}>Read More ↗️</a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab==='portfolio'?'active':''}`} onClick={()=>setActiveTab('portfolio')}>💰 <div>{t.portfolio}</div></div>
        <div className={`nav-item ${activeTab==='signals'?'active':''}`} onClick={()=>setActiveTab('signals')}>🤖 <div>{t.signals}</div></div>
        <div className={`nav-item ${activeTab==='news'?'active':''}`} onClick={()=>setActiveTab('news')}>📰 <div>{t.news}</div></div>
        <div className={`nav-item ${activeTab==='market'?'active':''}`} onClick={()=>setActiveTab('market')}>📈 <div>{t.market}</div></div>
      </div>
    </div>
  );
}
  
