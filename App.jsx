import React, { useState, useEffect } from 'react';
import './App.css';

const dict = {
  ar: { market: 'الأسواق', news: 'الأخبار', signals: 'توصيات AI', convert: 'المحول', search: 'ابحث عن عملة...', logout: 'خروج', login: 'دخول', loading: 'جاري التحميل...', buy: 'شراء', sell: 'بيع', entry: 'الدخول:', target: 'الهدف:', stop: 'وقف الخسارة:', trending: '🔥 عملات تريند (جديدة)', ai_signals: '🎯 صفقات AI مقترحة', fng: 'مؤشر الخوف والطمع', advice: 'نصيحة الرادار:' },
  en: { market: 'Markets', news: 'News', signals: 'AI Signals', convert: 'Convert', search: 'Search coins...', logout: 'Logout', login: 'Login', loading: 'Analyzing Market...', buy: 'Buy', sell: 'Sell', entry: 'Entry:', target: 'Target:', stop: 'Stop Loss:', trending: '🔥 Trending Coins', ai_signals: '🎯 AI Trade Setups', fng: 'Fear & Greed Index', advice: 'Radar Advice:' }
};

// مكون العداد الدائري الجديد
const FearGreedGauge = ({ value, label, lang }) => {
  const isAr = lang === 'ar';
  const angle = (value / 100) * 180 - 180;
  const color = value > 70 ? '#10b981' : value < 30 ? '#ef4444' : '#f59e0b';
  
  const getAdvice = (v) => {
    if (v < 25) return isAr ? "خوف شديد! تاريخياً هذه منطقة تجميع ممتازة." : "Extreme Fear! Historical accumulation zone.";
    if (v < 45) return isAr ? "السوق خائف، راقب العملات القوية." : "Market is fearful, watch strong coins.";
    if (v < 60) return isAr ? "منطقة محايدة، لا تتسرع في الدخول." : "Neutral zone, stay patient.";
    if (v < 80) return isAr ? "طمع واضح، ابدأ بتأمين أرباحك." : "Greed is high, secure some profits.";
    return isAr ? "طمع شديد! احذر من تصحيح مفاجئ." : "Extreme Greed! Watch out for a correction.";
  };

  return (
    <div className="fng-card" style={{textAlign:'center', padding:'25px 15px'}}>
      <div style={{position:'relative', width:'160px', height:'80px', margin:'0 auto', overflow:'hidden'}}>
        <div style={{width:'160px', height:'160px', borderRadius:'50%', border:'12px solid #1e293b', position:'absolute', top:0, left:0, boxSizing:'border-box'}}></div>
        <div style={{width:'160px', height:'160px', borderRadius:'50%', border:'12px solid transparent', borderTopColor:color, borderRightColor:color, position:'absolute', top:0, left:0, boxSizing:'border-box', transform:`rotate(${angle}deg)`, transition:'1.5s ease-out'}}></div>
        <div style={{position:'absolute', bottom:'0', width:'100%', textAlign:'center'}}>
          <span style={{fontSize:'24px', fontWeight:'bold', color:color}}>{value}</span>
        </div>
      </div>
      <h4 style={{margin:'10px 0 5px', color:color}}>{label}</h4>
      <p style={{fontSize:'12px', color:'#64748b', margin:0, lineHeight:'1.4'}}>
        <b>{isAr ? '💡 نصيحة:' : '💡 Tip:'}</b> {getAdvice(value)}
      </p>
    </div>
  );
};

// مكون الرسم البياني المصغر
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
        fetch('https://api.coingecko.com/api/v3/search/trending').then(r => r.json()),
        fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN').then(r => r.json())
      ]).then(([cData, fData, tData, nData]) => {
        setCoins(cData);
        if(fData.data) setFng({ value: parseInt(fData.data[0].value), label: fData.data[0].value_classification });
        if(tData.coins) setTrending(tData.coins.map(c => c.item));
        if(nData.Data) setNews(nData.Data.slice(0, 20));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [isLoggedIn]);

  const getConvertedValue = () => {
    const coin = coins.find(c => c.id === fromCoin);
    if (!coin) return 0;
    let rate = coin.current_price;
    if (toFiat === 'dzd') rate *= 134.5;
    if (toFiat === 'eur') rate *= 0.92;
    return (convAmt * rate).toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const generateAISignals = () => {
    const signals = coins.filter(c => Math.abs(c.price_change_percentage_24h) > 4).slice(0, 6);
    return signals.map(coin => {
      const isBuy = coin.price_change_percentage_24h < 0;
      const current = coin.current_price;
      const target = isBuy ? current * 1.08 : current * 0.92;
      const stop = isBuy ? current * 0.95 : current * 1.05;
      return (
        <div key={coin.id} className="coin-row" style={{borderLeft: `4px solid ${isBuy ? '#10b981' : '#ef4444'}`, flexDirection: 'column', alignItems: 'stretch', gap: '10px'}}>
          <div style={{display:'flex', justifyContent:'space-between'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}><img src={coin.image} style={{width:'25px'}} alt={coin.symbol} /><b>{coin.symbol.toUpperCase()}/USDT</b></div>
            <span style={{color: isBuy ? '#10b981' : '#ef4444', fontWeight:'bold', padding:'3px 10px', background:'#1e293b', borderRadius:'5px'}}>{isBuy ? t.buy : t.sell}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', background:'#020617', padding:'10px', borderRadius:'8px'}}>
            <div><span style={{color:'#64748b'}}>{t.entry}</span><br/><b>${current.toLocaleString(undefined, {maximumSignificantDigits: 4})}</b></div>
            <div style={{textAlign:'center'}}><span style={{color:'#10b981'}}>{t.target}</span><br/><b>${target.toLocaleString(undefined, {maximumSignificantDigits: 4})}</b></div>
            <div style={{textAlign:isAr?'left':'right'}}><span style={{color:'#ef4444'}}>{t.stop}</span><br/><b>${stop.toLocaleString(undefined, {maximumSignificantDigits: 4})}</b></div>
          </div>
        </div>
      );
    });
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
            <FearGreedGauge value={fng.value} label={fng.label} lang={lang} />
            <div className="search-container"><input className="input-field" placeholder={t.search} onChange={e=>setSearchQuery(e.target.value)} /></div>
            {loading ? <p style={{textAlign:'center'}}>{t.loading}</p> : 
              coins.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
              <div key={c.id} className="coin-row">
                <div style={{display:'flex', alignItems:'center', width:'35%'}}><img src={c.image} className="coin-icon" alt={c.name} /><b>{c.symbol.toUpperCase()}</b></div>
                <MiniChart data={c.sparkline_in_7d?.price} isUp={c.price_change_percentage_24h > 0} />
                <div style={{textAlign:isAr?'left':'right', width:'35%'}}>
                  <b>${c.current_price.toLocaleString()}</b>
                  <div style={{color: c.price_change_percentage_24h > 0 ? '#10b981' : '#ef4444', fontSize:'12px'}}>{c.price_change_percentage_24h?.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'convert' && (
          <div style={{padding:'20px'}}>
            <h3 style={{color:'#818cf8', textAlign:'center', marginBottom:'20px'}}>{t.convert}</h3>
            <div className="fng-card" style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <div><label style={{color:'#64748b', fontSize:'12px'}}>المبلغ:</label><input type="number" className="input-field" value={convAmt} onChange={e=>setConvAmt(e.target.value)} /></div>
              <div><label style={{color:'#64748b', fontSize:'12px'}}>من:</label><select className="input-field" value={fromCoin} onChange={e=>setFromCoin(e.target.value)}>{coins.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label style={{color:'#64748b', fontSize:'12px'}}>إلى:</label><select className="input-field" value={toFiat} onChange={e=>setToFiat(e.target.value)}><option value="usd">USD</option><option value="dzd">DZD</option><option value="eur">EUR</option></select></div>
              <div style={{textAlign:'center', marginTop:'15px', padding:'15px', background:'#020617', borderRadius:'10px'}}>
                 <small style={{color:'#64748b'}}>{convAmt} {fromCoin.toUpperCase()} =</small>
                 <h2 style={{color:'#10b981', margin:'5px 0'}}>{getConvertedValue()} {toFiat.toUpperCase()}</h2>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'signals' && (
          <div style={{padding:'10px'}}>
            <h3 style={{color:'#818cf8', fontSize:'16px', padding:'0 10px'}}>{t.trending}</h3>
            <div style={{display:'flex', gap:'10px', overflowX:'auto', padding:'10px', scrollbarWidth:'none'}}>
              {trending.slice(0, 8).map(tCoin => (
                <div key={tCoin.id} style={{background:'#0f172a', padding:'10px', borderRadius:'10px', border:'1px solid #1e293b', minWidth:'100px', textAlign:'center'}}>
                  <img src={tCoin.small} style={{width:'30px', borderRadius:'50%'}} alt={tCoin.symbol} />
                  <div style={{fontWeight:'bold', marginTop:'5px', fontSize:'12px'}}>{tCoin.symbol.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <h3 style={{color:'#818cf8', fontSize:'16px', padding:'15px 10px 5px'}}>{t.ai_signals}</h3>
            {generateAISignals()}
          </div>
        )}

        {activeTab === 'news' && (
          <div style={{padding:'10px'}}>
            {news.map((n, i) => (
              <div key={i} className="coin-row" style={{flexDirection:'column', alignItems:'flex-start', gap:'12px'}}>
                <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                   <img src={n.imageurl} style={{width:'65px', height:'65px', borderRadius:'10px', objectFit:'cover'}} alt="news" />
                   <div><h4 style={{margin:0, fontSize:'14px', lineHeight:'1.4'}}>{n.title.substring(0, 80)}...</h4><small style={{color:'#64748b'}}>{n.source_info.name}</small></div>
                </div>
                <a href={n.url} target="_blank" rel="noreferrer" style={{alignSelf:'flex-end', background:'#1e293b', color:'#818cf8', padding:'5px 12px', borderRadius:'5px', fontSize:'11px', textDecoration:'none'}}>اقرأ المزيد ↗️</a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className={`nav-item ${activeTab==='convert'?'active':''}`} onClick={()=>setActiveTab('convert')}>🔄 <div style={{marginTop:'3px'}}>{t.convert}</div></div>
        <div className={`nav-item ${activeTab==='signals'?'active':''}`} onClick={()=>setActiveTab('signals')}>🤖 <div style={{marginTop:'3px'}}>{t.signals}</div></div>
        <div className={`nav-item ${activeTab==='news'?'active':''}`} onClick={()=>setActiveTab('news')}>📰 <div style={{marginTop:'3px'}}>{t.news}</div></div>
        <div className={`nav-item ${activeTab==='market'?'active':''}`} onClick={()=>setActiveTab('market')}>📈 <div style={{marginTop:'3px'}}>{t.market}</div></div>
      </div>
    </div>
  );
              }
                
