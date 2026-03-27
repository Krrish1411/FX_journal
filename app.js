// ═══════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════
const S={
  get:(k,d)=>{try{const v=localStorage.getItem('fxj_'+k)||localStorage.getItem('kj2_'+k)||localStorage.getItem('kj_'+k);return v?JSON.parse(v):d}catch{return d}},
  set:(k,v)=>{try{localStorage.setItem('fxj_'+k,JSON.stringify(v))}catch(e){console.warn('LS fail',k,e)}}
};

const DEFAULT_SETUPS=['CHOCH (Bullish)','CHOCH (Bearish)','ISS (Internal Structure Shift)','TJL (Trend Joining Level)','2CR (2 Candle Retracement)','SBR (Support → Resistance)','RBS (Resistance → Support)','QML (Quasimodo Level)','DT (Double Top)','DB (Double Bottom)','Engulfing','5 Waves CHOCH','A+ Setup'];

let DB={
  accounts:S.get('accounts',[]),
  trades:S.get('trades',[]),
  rules:S.get('rules',[]),
  sessions:S.get('sessions',[
    {id:'s1',name:'London',start:'08:00',end:'17:00',color:'#3b82f6'},
    {id:'s2',name:'New York',start:'13:00',end:'22:00',color:'#22c55e'},
    {id:'s3',name:'Asian',start:'00:00',end:'09:00',color:'#f59e0b'},
    {id:'s4',name:'Sydney',start:'22:00',end:'07:00',color:'#a78bfa'},
  ]),
  checklist:S.get('checklist',['Structure confirmed on H4/Daily','Clear directional bias identified','Level (SBR/RBS/POI) identified','Entry criteria met','Trading session active','NOT entering on retracement','R:R minimum 1:2']),
  pairs:S.get('pairs',['XAUUSD','EURUSD','GBPUSD','USDJPY','GBPJPY','EURJPY','BTCUSD','ETHUSD','XAGUSD','AUDUSD','USDCAD']),
  setups:S.get('setups',DEFAULT_SETUPS),
  settings:S.get('settings',{name:'Krish Patel',strategy:'Price Action + Market Structure',tz:'Asia/Kolkata',currency:'USD',theme:'amoled',beAsWin:true}),
  violations:S.get('violations',[]),
};

let st={
  activeAcctId:S.get('activeAcct',null),
  editTradeId:null,editAcctId:null,editRuleId:null,editSessId:null,
  tradeSS:[],tradeTags:[],tradeGrade:'',tradeEmos:[],tradeFR:null,tradeBuySell:'Buy',tradeStruct:'Bullish',tradeResult:null,
  acctColor:'#3b82f6',
  calY:new Date().getFullYear(),calM:new Date().getMonth(),
  anCalY:new Date().getFullYear(),anCalM:new Date().getMonth(),
  anTab:'ov',eqRange:'all',
  perfFilter:'all',perfTypeFilter:'all',
  charts:{},
  depwList:[],
  sortField:'date',sortDir:'desc',
};

if(!DB.accounts.length){
  const _defAcct={id:uid(),name:'Main Account',type:'Live',balance:0,curBalance:null,freshDate:null,currency:'USD',broker:'',color:'#3b82f6',pfRules:{},depw:[]};
  DB.accounts=[_defAcct];save('accounts');st.activeAcctId=_defAcct.id;S.set('activeAcct',_defAcct.id);
}
if(!st.activeAcctId||!DB.accounts.find(a=>a.id===st.activeAcctId)){st.activeAcctId=DB.accounts[0].id;S.set('activeAcct',st.activeAcctId);}
if(!DB.rules.length){
  DB.rules=[{id:uid(),type:'daily_loss',val:100,acctId:''},{id:uid(),type:'max_trades',val:3,acctId:''},{id:uid(),type:'min_rr',val:2,acctId:''}];
  save('rules');
}

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,5)}
function save(k){S.set(k,DB[k]);markUnsaved()}
function saveAll(){['accounts','trades','rules','sessions','checklist','pairs','setups','settings','violations'].forEach(k=>S.set(k,DB[k]))}
function acct(id){return DB.accounts.find(a=>a.id===(id||st.activeAcctId))}
function activeTrades(id){
  const aid=id||st.activeAcctId;
  return DB.trades.filter(t=>!aid||t.acctId===aid);
}
function todayStr(){return new Date().toISOString().slice(0,10)}

let _unsaved=false,_saveTimer=null;
function markUnsaved(){
  _unsaved=true;
  const el=document.getElementById('save-ind');
  const dot=document.getElementById('save-dot');
  const txt=document.getElementById('save-txt');
  if(el){el.className='save-ind unsaved';dot.style.background='var(--gold)';txt.textContent='Unsaved'}
  clearTimeout(_saveTimer);
  _saveTimer=setTimeout(()=>{if(el){el.className='save-ind saved';dot.style.background='var(--green)';txt.textContent='Save'}},2000);
}
function markSaved(){
  _unsaved=false;
  const el=document.getElementById('save-ind');
  const dot=document.getElementById('save-dot');
  const txt=document.getElementById('save-txt');
  if(el){el.className='save-ind saved';dot.style.background='var(--green)';txt.textContent='Save'}
}

// ═══════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════
function O(id){document.getElementById(id)?.classList.add('open')}
function C(id){document.getElementById(id)?.classList.remove('open')}
document.querySelectorAll('.overlay').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')}));
window.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.overlay.open').forEach(m=>m.classList.remove('open'))},true);

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function toast(title,msg,type='info'){
  const ic={info:'ℹ️',success:'✅',warn:'⚠️',error:'🔴'};
  const el=document.createElement('div');el.className='toast';
  el.innerHTML=`<div class="toast-ic">${ic[type]||'ℹ️'}</div><div><div class="toast-tl">${title}</div>${msg?`<div class="toast-msg">${msg}</div>`:''}</div>`;
  document.getElementById('toasts').appendChild(el);
  setTimeout(()=>el.style.opacity='0',3200);setTimeout(()=>el.remove(),3500);
}
function confirmAction(title,msg,cb){
  document.getElementById('confirm-title').textContent=title;
  document.getElementById('confirm-msg').innerHTML=msg;
  document.getElementById('confirm-btn').onclick=()=>{C('modal-confirm');cb()};
  O('modal-confirm');
}

// ═══════════════════════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════════════════════
const TITLES={dash:'Dashboard',trades:'Trades',journal:'Journal',analytics:'Performance Analytics',accounts:'Accounts',rules:'Rules & Config',settings:'Settings'};
function nav(p){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector(`[data-p="${p}"]`)?.classList.add('active');
  document.querySelectorAll('.page,.page-fill').forEach(pg=>pg.classList.remove('active'));
  document.getElementById('page-'+p)?.classList.add('active');
  document.getElementById('page-title').textContent=TITLES[p]||p;
  if(p==='dash')renderDash();
  else if(p==='trades')renderTrades();
  else if(p==='journal')renderJournal();
  else if(p==='analytics')renderAnalytics(st.anTab);
  else if(p==='accounts')renderAccounts();
  else if(p==='rules')renderRules();
  else if(p==='settings')loadSettings();
  else if(p==='report')loadAISettings();
}
document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',()=>nav(n.dataset.p)));

// ═══════════════════════════════════════════════════════════
// CLOCK & SESSIONS
// ═══════════════════════════════════════════════════════════
function updateClock(){
  const tz=DB.settings.tz||'Asia/Kolkata';
  try{
    const t=new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:tz});
    document.getElementById('live-clock').textContent=t;
    const tzLabels={'Asia/Kolkata':'IST','America/New_York':'EST','Europe/London':'GMT','UTC':'UTC','Asia/Dubai':'GST','Asia/Singapore':'SGT','Australia/Sydney':'AEST'};
    document.getElementById('live-tz').textContent=tzLabels[tz]||tz.split('/').pop();
  }catch{document.getElementById('live-clock').textContent=new Date().toTimeString().slice(0,8)}
  updateSessionBadge();
}
function getGMTHHMM(){const n=new Date();return n.getUTCHours()*100+n.getUTCMinutes()}
function timeToNum(hm){const[h,m]=hm.split(':').map(Number);return h*100+m}
function inSession(s){const n=getGMTHHMM(),st2=timeToNum(s.start),en=timeToNum(s.end);return st2<en?n>=st2&&n<en:n>=st2||n<en}
function getActiveSessions(){return DB.sessions.filter(s=>inSession(s))}
function updateSessionBadge(){
  const act=getActiveSessions();
  const dot=document.getElementById('sess-dot');const nm=document.getElementById('sess-name');
  if(act.length){nm.textContent=act.map(s=>s.name).join('+');dot.style.background=act[0].color;}
  else{nm.textContent='Off Session';dot.style.background='var(--t3)'}
}
setInterval(updateClock,1000);updateClock();

// ═══════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════
function updateSidebar(){
  const a=acct();if(!a)return;
  const dot=document.getElementById('sb-dot');
  dot.style.cssText=`background:${a.color};box-shadow:0 0 6px ${a.color}88;`;
  document.getElementById('sb-name').textContent=a.name;
  document.getElementById('sb-type').textContent=a.type;
  document.getElementById('sb-av').textContent=DB.settings.name?.[0]?.toUpperCase()||'K';
  document.getElementById('sb-username').textContent=DB.settings.name||'Trader';
  document.getElementById('sb-userrole').textContent=DB.settings.strategy||'Trader';
}
document.getElementById('acct-pill-btn').onclick=()=>{
  const body=document.getElementById('acct-switch-body');
  body.innerHTML=DB.accounts.map(a=>`
    <div onclick="switchAcct('${a.id}')" style="display:flex;align-items:center;gap:10px;padding:11px;border:1px solid ${a.id===st.activeAcctId?a.color:'var(--border)'};border-radius:var(--rs);margin-bottom:5px;cursor:pointer;background:${a.id===st.activeAcctId?a.color+'15':'var(--bg2)'};transition:all .12s">
      <div style="width:9px;height:9px;border-radius:50%;background:${a.color}"></div>
      <div style="flex:1"><div style="font-weight:600;font-size:13px;color:var(--t0)">${a.name}</div><div style="font-size:12px;color:var(--t2)">${a.type} · ${a.currency}</div></div>
      ${a.id===st.activeAcctId?'<span style="color:var(--green2);font-size:12px">✓</span>':''}
    </div>`).join('');
  O('modal-acct-switch');
};
function switchAcct(id){
  st.activeAcctId=id;S.set('activeAcct',id);
  C('modal-acct-switch');updateSidebar();renderDash();checkRules();
  toast('Account',acct(id)?.name,'success');
}

// ═══════════════════════════════════════════════════════════
// RULE CHECK — FIX: > not >= for max_trades
// ═══════════════════════════════════════════════════════════
function checkRules(){
  const today=todayStr();
  const todayT=DB.trades.filter(t=>t.acctId===st.activeAcctId&&t.date===today);
  const todayPnL=todayT.reduce((s,t)=>s+netPnL(t),0);
  const lossToday=Math.abs(Math.min(0,todayPnL));
  const a=acct();let viols=[];
  DB.rules.filter(r=>!r.acctId||r.acctId===st.activeAcctId).forEach(r=>{
    if(r.type==='daily_loss'&&r.val>0&&lossToday>=r.val)viols.push(`Daily loss $${lossToday.toFixed(2)} ≥ $${r.val}`);
    if(r.type==='daily_loss_pct'&&r.val>0&&a?.balance>0){const lim=a.balance*r.val/100;if(lossToday>=lim)viols.push(`Daily loss ${(lossToday/a.balance*100).toFixed(1)}% ≥ ${r.val}%`)}
    // FIX: > r.val (breach AFTER max, not AT max)
    if(r.type==='max_trades'&&r.val>0&&todayT.length>r.val)viols.push(`Traded ${todayT.length} times (max ${r.val})`);
  });
  if(a?.type==='Prop Firm'&&a.pfRules){
    const pf=a.pfRules;const base=getAcctBase(a)||1;
    if(pf.dailyDD&&lossToday/base*100>=pf.dailyDD)viols.push(`PF daily DD ${(lossToday/base*100).toFixed(1)}% ≥ ${pf.dailyDD}%`);
    const totalPnL2=DB.trades.filter(t=>t.acctId===st.activeAcctId).reduce((s,t)=>s+netPnL(t),0);
    const totalLoss=Math.abs(Math.min(0,totalPnL2));
    if(pf.maxDD&&totalLoss/base*100>=pf.maxDD)viols.push(`PF max DD ${(totalLoss/base*100).toFixed(1)}% ≥ ${pf.maxDD}%`);
  }
  const bar=document.getElementById('alert-bar');const bdg=document.getElementById('rules-badge');
  if(viols.length){
    bar.textContent=`⛔ STOP — ${viols[0]}. Click to dismiss.`;bar.style.display='block';bdg.style.display='inline-block';
    if(!DB.violations.find(v=>v.msg===viols[0]&&v.date===today)){
      DB.violations.unshift({date:today,msg:viols[0],ts:new Date().toISOString()});
      if(DB.violations.length>50)DB.violations.pop();S.set('violations',DB.violations);
    }
  }else{bar.style.display='none';bdg.style.display='none'}
}

// ═══════════════════════════════════════════════════════════
// CHART HELPER
// ═══════════════════════════════════════════════════════════
function makeChart(id,cfg){
  const canvas=document.getElementById(id);if(!canvas)return null;
  if(st.charts[id]){try{st.charts[id].destroy()}catch(e){}delete st.charts[id]}
  const chart=new Chart(canvas.getContext('2d'),cfg);st.charts[id]=chart;return chart;
}
function gc(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim()}
const CL=()=>({grid:gc('--border'),text:gc('--t3'),t0:gc('--t0'),t1:gc('--t1'),tooltip:{bg:gc('--bg2'),border:gc('--border-s'),title:gc('--t0'),body:gc('--t2')}});
function chartTooltip(){const c=CL();return{backgroundColor:c.tooltip.bg,borderColor:c.tooltip.border,borderWidth:1,titleColor:c.tooltip.title,bodyColor:c.tooltip.body,padding:8}}

// ═══════════════════════════════════════════════════════════
// DATE PARSING
// ═══════════════════════════════════════════════════════════
function parseAnyDate(d){
  if(!d)return'';
  d=String(d).trim().replace(/^"+|"+$/g,'');
  const pad=n=>(parseInt(n)<10?'0':'')+parseInt(n);
  let m=d.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if(m){let y=parseInt(m[1]),p2=parseInt(m[2]),p3=parseInt(m[3]);return p2>12&&p3<=12?`${y}-${pad(p3)}-${pad(p2)}`:`${y}-${pad(p2)}-${pad(p3)}`}
  m=d.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/);
  if(m){let p1=parseInt(m[1]),p2=parseInt(m[2]),p3=parseInt(m[3]);let y=p3<100?p3+2000:p3;let mo=p2,day=p1;if(p1>12){mo=p1;day=p2}return`${y}-${pad(mo)}-${pad(day)}`}
  const f=new Date(d);if(!isNaN(f))return f.toISOString().slice(0,10);
  return d;
}
function normDates(trades){return trades.map(t=>({...t,date:t.date?parseAnyDate(t.date):t.date}))}

// ═══════════════════════════════════════════════════════════
// P&L CALCULATION FROM ACTUAL EXIT
// ═══════════════════════════════════════════════════════════
function calcAll(){
  const entry=parseFloat(document.getElementById('t-entry').value);
  const sl=parseFloat(document.getElementById('t-sl').value);
  const tp=parseFloat(document.getElementById('t-tp').value);
  const exit=parseFloat(document.getElementById('t-exit').value);
  const lots=parseFloat(document.getElementById('t-lots').value)||0;
  const comm=parseFloat(document.getElementById('t-comm').value)||0;
  const dir=st.tradeBuySell;
  const inst=document.getElementById('t-inst').value;
  const sym=(document.getElementById('t-symbol').value||'').toUpperCase();
  const risk=entry&&sl?Math.abs(entry-sl):0;

  // Planned R:R
  const planEl=document.getElementById('t-rr-plan');
  if(entry&&sl&&tp&&risk>0){
    const rew=Math.abs(tp-entry);planEl.textContent='1:'+(rew/risk).toFixed(2);planEl.style.color='var(--gold2)';
  }else{planEl.textContent='—';planEl.style.color='var(--t3)'}

  // Actual R:R from exit
  const actEl=document.getElementById('t-rr-actual');
  if(entry&&sl&&exit&&risk>0){
    const priceDiff=dir==='Buy'?exit-entry:entry-exit;
    const rr=(priceDiff/risk).toFixed(2);
    actEl.textContent=(priceDiff>=0?'+':'')+rr+':1';
    actEl.style.color=priceDiff>=0?'var(--green2)':'var(--red2)';
  }else{actEl.textContent='—';actEl.style.color='var(--t3)'}

  // Auto P&L
  const pnlCalcEl=document.getElementById('t-pnl-calc');
  const pnlNetEl=document.getElementById('t-pnl-net');
  const manualPnL=document.getElementById('t-pnl').value;
  let calcPnL=null;
  if(exit&&entry&&lots>0&&inst!=='manual'){
    const priceDiff=dir==='Buy'?exit-entry:entry-exit;
    let cs=100000;
    if(sym==='XAUUSD'||sym.includes('GOLD'))cs=100;
    else if(sym==='XAGUSD')cs=5000;
    else if(inst==='gold')cs=100;
    else if(inst==='crypto')cs=1;
    else if(inst==='indices')cs=1;
    calcPnL=priceDiff*lots*cs;
    pnlCalcEl.textContent=(calcPnL>=0?'+$':'-$')+Math.abs(calcPnL).toFixed(2);
    pnlCalcEl.style.color=calcPnL>=0?'var(--green2)':'var(--red2)';
    const net=calcPnL-comm;
    pnlNetEl.textContent=(net>=0?'+$':'-$')+Math.abs(net).toFixed(2);
    pnlNetEl.style.color=net>=0?'var(--green2)':'var(--red2)';
    // Store calculated value for saveTrade to use (no auto-fill to avoid override conflict)
    st._calcPnL=calcPnL;
  }else if(manualPnL){
    const v=parseFloat(manualPnL)||0;
    pnlCalcEl.textContent=(v>=0?'+$':'-$')+Math.abs(v).toFixed(2);
    pnlCalcEl.style.color=v>=0?'var(--green2)':'var(--red2)';
    const net=v-comm;
    pnlNetEl.textContent=(net>=0?'+$':'-$')+Math.abs(net).toFixed(2);
    pnlNetEl.style.color=net>=0?'var(--green2)':'var(--red2)';
  }else{
    pnlCalcEl.textContent='—';pnlCalcEl.style.color='var(--t3)';
    pnlNetEl.textContent='—';pnlNetEl.style.color='var(--t3)';
  }
}

// ═══════════════════════════════════════════════════════════
// ADD TRADE MODAL
// ═══════════════════════════════════════════════════════════
function openAddTrade(id=null){
  id=typeof id==='string'?id:null;
  st.editTradeId=id;st.tradeSS=[];st.tradeTags=[];st.tradeGrade='';st.tradeEmos=[];st.tradeFR=null;st._calcPnL=null;st.tradeResult=null;
  document.getElementById('trade-modal-title').textContent=id?'Edit Trade':'Add Trade';
  const now=new Date();
  document.getElementById('t-date').value=now.toISOString().slice(0,10);
  document.getElementById('t-close-date').value=now.toISOString().slice(0,10);
  document.getElementById('t-open-time').value=now.toTimeString().slice(0,5);
  document.getElementById('t-close-time').value=now.toTimeString().slice(0,5);
  ['t-entry','t-sl','t-tp','t-exit','t-lots','t-pnl','t-comm','t-notes','t-tv-link'].forEach(x=>{const e=document.getElementById(x);if(e)e.value=''});
  ['t-rr-plan','t-rr-actual','t-pnl-calc','t-pnl-net'].forEach(id=>{const e=document.getElementById(id);if(e){e.textContent='—';e.style.color='var(--t2)'}});
  document.getElementById('ss-preview').innerHTML='';
  selTF('H4');
  document.querySelectorAll('.grade-c').forEach(c=>c.classList.remove('sel'));
  document.querySelectorAll('#emo-chips .chip').forEach(c=>c.classList.remove('sel'));
  document.getElementById('rules-yes').className='btn btn-s';
  document.getElementById('rules-no').className='btn btn-s';
  // Default Buy
  setBuySell('Buy');
  // Populate setups
  const setupSel=document.getElementById('t-setup');
  setupSel.innerHTML=DB.setups.map(s=>`<option>${s}</option>`).join('');
  // Populate pairs
  const symSel=document.getElementById('t-symbol');
  symSel.innerHTML=DB.pairs.map(p=>`<option>${p}</option>`).join('');
  symSel.onchange=()=>autoDetectInstrument(symSel.value);
  // Auto-detect session based on current time
  const activeSess=getActiveSessions();
  const autoSessName=activeSess.length?activeSess[0].name:'No Session';
  setTimeout(()=>renderSessChips(autoSessName),0);
  // Re-detect when open time changes
  setTimeout(()=>{
    const otEl=document.getElementById('t-open-time');
    if(otEl) otEl.onchange=function(){
      const val=this.value;if(!val)return;
      const [h,m]=val.split(':').map(Number);
      const off=new Date().getTimezoneOffset();
      const gmtMins=(h*60+m+off+1440)%1440;
      const gmtHHMM=Math.floor(gmtMins/60)*100+(gmtMins%60);
      const matched=DB.sessions.find(s=>{
        const s2=timeToNum(s.start),e=timeToNum(s.end);
        return s2<e?gmtHHMM>=s2&&gmtHHMM<e:gmtHHMM>=s2||gmtHHMM<e;
      });
      renderSessChips(matched?matched.name:'No Session');
    };
  },0);
  // Tags
  st.tradeTags=[];renderTradeTags();
  // Checklist
  renderModalChecklist();
  if(id){
    const t=DB.trades.find(x=>x.id===id);
    if(t){
      setBuySell(t.direction||'Buy');
      selStruct(t.structure||'Bullish');
      document.getElementById('t-date').value=t.date;
      document.getElementById('t-close-date').value=t.closeDate||t.date;
      document.getElementById('t-open-time').value=t.openTime||'';
      document.getElementById('t-close-time').value=t.closeTime||'';
      document.getElementById('t-symbol').value=t.symbol;
      autoDetectInstrument(t.symbol);
      renderSessChips(t.session||'No Session');
      document.getElementById('t-setup').value=t.setup;
      selTF(t.tf||'H4');
      document.getElementById('t-inst').value=t.inst||'forex';
      document.getElementById('t-entry').value=t.entry||'';
      document.getElementById('t-sl').value=t.sl||'';
      document.getElementById('t-tp').value=t.tp||'';
      document.getElementById('t-exit').value=t.exitPrice||'';
      document.getElementById('t-lots').value=t.lots||'';
      document.getElementById('t-pnl').value=t.pnl||'';
      document.getElementById('t-comm').value=t.commission||'';
      document.getElementById('t-notes').value=t.notes||'';
      if(t.tvLink)document.getElementById('t-tv-link').value=t.tvLink;
      st.tradeGrade=t.grade||'';st.tradeResult=t.tradeResult||null;st.tradeFR=t.followedRules;
      // Restore result chips
      const rfEl=document.getElementById('tr-rf');
      if(rfEl)rfEl.classList.toggle('sel',st.tradeResult==='rf');
      st.tradeSS=t.screenshots||[];st.tradeTags=t.tags||[];
      st.tradeEmos=t.emotion?t.emotion.split(', ').filter(Boolean):[];
      document.querySelectorAll('.grade-c').forEach(c=>{if(c.dataset.g===t.grade)c.classList.add('sel')});
      document.querySelectorAll('#emo-chips .chip').forEach(c=>{if(st.tradeEmos.includes(c.dataset.emo))c.classList.add('sel')});
      if(t.followedRules===true)document.getElementById('rules-yes').className='btn btn-ok';
      if(t.followedRules===false)document.getElementById('rules-no').className='btn btn-d';
      renderTradeTags();renderSSPreviews();calcAll();
    }
  }
  O('modal-trade');
}

function setBuySell(dir){
  st.tradeBuySell=dir;
  document.getElementById('bs-buy').classList.toggle('sel',dir==='Buy');
  document.getElementById('bs-sell').classList.toggle('sel',dir==='Sell');
  // Auto-set structure
  if(dir==='Buy')selStruct('Bullish');
  else if(dir==='Sell')selStruct('Bearish');
}
function selStruct(s){
  st.tradeStruct=s;
  ['Bullish','Bearish','Ranging'].forEach(x=>{
    const el=document.getElementById('sc-'+x.toLowerCase());
    if(!el)return;
    el.className='chip'+(x===s?' sel-'+(s==='Bullish'?'g':'Ranging'?'':'r')+' sel':'');
  });
}
function renderModalChecklist(){
  const outer=document.getElementById('modal-chk-outer');
  const list=document.getElementById('modal-chk-list');
  if(!outer||!list)return;
  if(!DB.checklist.length){outer.style.display='none';return}
  outer.style.display='block';
  list.innerHTML=DB.checklist.map((item,i)=>`<div class="chk-item" id="mchk-${i}" onclick="this.classList.toggle('done')"><div class="chk-box">✓</div><span style="font-size:12.5px;color:var(--t1)">${item}</span></div>`).join('');
}
function selGrade(g){
  st.tradeGrade=g;
  document.querySelectorAll('.grade-c').forEach(c=>c.classList.remove('sel'));
  document.querySelector(`.grade-c[data-g="${g}"]`)?.classList.add('sel');
}
function toggleEmo(el){
  const emo=el.dataset.emo;
  if(el.classList.contains('sel')){el.classList.remove('sel');st.tradeEmos=st.tradeEmos.filter(e=>e!==emo);}
  else{el.classList.add('sel');if(!st.tradeEmos.includes(emo))st.tradeEmos.push(emo)}
}
function setFR(v){
  st.tradeFR=v;
  document.getElementById('rules-yes').className=v?'btn btn-ok':'btn btn-s';
  document.getElementById('rules-no').className=!v?'btn btn-d':'btn btn-s';
}
function addTag(e){if(e.key!=='Enter')return;const v=e.target.value.trim();if(!v||st.tradeTags.includes(v)){e.target.value='';return}st.tradeTags.push(v);e.target.value='';renderTradeTags()}
function removeTag(t){st.tradeTags=st.tradeTags.filter(x=>x!==t);renderTradeTags()}
function renderTradeTags(){
  const wrap=document.getElementById('trade-tags-wrap');const inp=document.getElementById('trade-tags-in');
  if(!wrap)return;wrap.innerHTML='';
  st.tradeTags.forEach(t=>{const el=document.createElement('div');el.className='tag';el.innerHTML=`${t}<span class="tag-x" onclick="removeTag('${t}')">✕</span>`;wrap.appendChild(el)});
  wrap.appendChild(inp);
}
function addSS(e){Array.from(e.target.files).forEach(f=>{const r=new FileReader();r.onload=ev=>{st.tradeSS.push({id:uid(),data:ev.target.result,name:f.name});renderSSPreviews()};r.readAsDataURL(f)})}
function dropSS(e){e.preventDefault();e.currentTarget.classList.remove('over');Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')).forEach(f=>{const r=new FileReader();r.onload=ev=>{st.tradeSS.push({id:uid(),data:ev.target.result,name:f.name});renderSSPreviews()};r.readAsDataURL(f)})}
function renderSSPreviews(){document.getElementById('ss-preview').innerHTML=st.tradeSS.map(s=>`<div class="ss-th"><img src="${s.data}"><button class="ss-del" onclick="delSS('${s.id}')">✕</button></div>`).join('')}
function delSS(id){st.tradeSS=st.tradeSS.filter(s=>s.id!==id);renderSSPreviews()}

function saveTrade(){
  const date=document.getElementById('t-date').value;
  const symbol=document.getElementById('t-symbol').value;
  const entry=document.getElementById('t-entry').value;
  if(!date||!symbol||!entry){toast('Missing fields','Date, Pair and Entry are required','warn');return}
  if(DB.pairs.length&&!DB.pairs.includes(symbol))toast('Pair warning',`${symbol} not in allowed pairs`,'warn');
  const exit=parseFloat(document.getElementById('t-exit').value)||0;
  const manualPnL=document.getElementById('t-pnl').value;
  let finalPnL=0;
  if(manualPnL!==''){finalPnL=parseFloat(manualPnL)||0}
  else if(st._calcPnL!=null){finalPnL=st._calcPnL}
  else{const calcTxt=document.getElementById('t-pnl-calc').textContent;if(calcTxt&&calcTxt!=='—'){finalPnL=parseFloat(calcTxt.replace(/[+$,]/g,''))*(calcTxt.startsWith('-')?-1:1)}}
  const planRR=document.getElementById('t-rr-plan').textContent;
  const actRR=document.getElementById('t-rr-actual').textContent;
  const trade={
    id:st.editTradeId||uid(),
    acctId:st.activeAcctId,
    date,closeDate:document.getElementById('t-close-date').value,
    openTime:document.getElementById('t-open-time').value,
    closeTime:document.getElementById('t-close-time').value,
    symbol,direction:st.tradeBuySell,
    session:document.getElementById('t-session').value||st.tradeSess||'No Session',
    setup:document.getElementById('t-setup').value,
    structure:st.tradeStruct,
    tf:document.getElementById('t-tf').value||st.tradeTF||'H4',
    inst:document.getElementById('t-inst').value,
    entry:parseFloat(entry)||0,
    sl:parseFloat(document.getElementById('t-sl').value)||0,
    tp:parseFloat(document.getElementById('t-tp').value)||0,
    exitPrice:exit,
    lots:parseFloat(document.getElementById('t-lots').value)||0,
    pnl:finalPnL,
    commission:parseFloat(document.getElementById('t-comm').value)||0,
    notes:document.getElementById('t-notes').value,
    tvLink:document.getElementById('t-tv-link').value,
    grade:st.tradeGrade,
    emotion:st.tradeEmos.join(', '),
    followedRules:st.tradeFR,tradeResult:st.tradeResult,
    plannedRR:planRR&&planRR!=='—'?planRR:'',
    rr:actRR&&actRR!=='—'?actRR:(planRR&&planRR!=='—'?planRR:''),
    screenshots:[...st.tradeSS],
    tags:[...st.tradeTags],
    checklist:Array.from(document.querySelectorAll('#modal-chk-list .chk-item')).map((el,i)=>el.classList.contains('done')?i:-1).filter(i=>i!==-1),
    journalNotes:st.editTradeId?(DB.trades.find(t=>t.id===st.editTradeId)?.journalNotes||''):'',
  };
  if(st.editTradeId){const i=DB.trades.findIndex(t=>t.id===st.editTradeId);if(i!==-1)DB.trades[i]={...DB.trades[i],...trade}}
  else DB.trades.unshift(trade);
  save('trades');C('modal-trade');checkRules();renderDash();renderTrades();renderJournal();
  toast(st.editTradeId?'Trade updated':'Trade saved',`${symbol} ${trade.direction}`,'success');
}
function deleteTrade(id){
  confirmAction('Delete Trade','Delete this trade? Cannot be undone.',()=>{
    DB.trades=DB.trades.filter(t=>t.id!==id);save('trades');
    renderDash();renderTrades();renderJournal();toast('Deleted','','warn');
  });
}

// ═══════════════════════════════════════════════════════════
// HOLD TIME
// ═══════════════════════════════════════════════════════════
function calcHold(date,openT,closeDate,closeT){
  if(!date||!openT||!closeT)return'—';
  try{
    const o=new Date(date+'T'+openT);const c=new Date((closeDate||date)+'T'+closeT);
    let d=(c-o)/60000;if(d<0&&!closeDate)d+=1440;if(d<0)return'—';
    return d<60?d.toFixed(0)+'m':d<1440?(d/60).toFixed(1)+'h':(d/1440).toFixed(1)+'d';
  }catch{return'—'}
}

// ═══════════════════════════════════════════════════════════
// VIEW TRADE
// ═══════════════════════════════════════════════════════════
function vf(l,v){return`<div><div style="font-size:10px;color:var(--t2);text-transform:uppercase;letter-spacing:.4px;font-weight:700;margin-bottom:2px">${l}</div><div style="font-size:13px">${v}</div></div>`}
function viewTrade(id){
  const t=DB.trades.find(x=>x.id===id);if(!t)return;
  const a=acct(t.acctId);
  const net=(parseFloat(t.pnl)||0)-(parseFloat(t.commission)||0);
  document.getElementById('vt-title').textContent=`${t.symbol} ${t.direction} — ${t.date}`;
  const tvBtn=t.tvLink?`<a href="${t.tvLink}" target="_blank" class="btn btn-s btn-sm">📊 TradingView Chart</a>`:'';
  document.getElementById('vt-body').innerHTML=`
    <div class="g2" style="margin-bottom:14px">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
        ${vf('Account',`<span style="display:inline-flex;align-items:center;gap:5px"><span style="width:7px;height:7px;border-radius:50%;background:${a?.color||'#888'}"></span>${a?.name||'—'}</span>`)}
        ${vf('Pair',`<strong style="font-size:15px;color:var(--t0)">${t.symbol}</strong>`)}
        ${vf('Direction',t.direction==='Buy'?'<span class="badge bg">↑ BUY</span>':'<span class="badge br">↓ SELL</span>')}
        ${vf('Session',t.session||'—')}
        ${vf('Setup',`<span class="badge bgd">${t.setup||'—'}</span>`)}
        ${vf('Structure',`<span class="badge ${t.structure==='Bullish'?'bg':'br'}">${t.structure||'—'}</span>`)}
        ${vf('Timeframe',t.tf||'—')}
        ${vf('Date/Time',`${t.date} ${t.openTime||''}`)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
        ${vf('Entry',`<span class="mono">${t.entry||'—'}</span>`)}
        ${vf('Stop Loss',`<span class="mono" style="color:var(--red2)">${t.sl||'—'}</span>`)}
        ${vf('Take Profit',`<span class="mono" style="color:var(--green2)">${t.tp||'—'}</span>`)}
        ${vf('★ Actual Exit',`<span class="mono" style="color:var(--gold2);font-weight:700">${t.exitPrice||'—'}</span>`)}
        ${vf('Lots',t.lots||'—')}
        ${vf('Gross P&L',`<span class="mono" style="font-weight:800;font-size:16px;color:${(parseFloat(t.pnl)||0)>=0?'var(--green2)':'var(--red2)'}">${(parseFloat(t.pnl)||0)>=0?'+$':'-$'}${Math.abs(parseFloat(t.pnl)||0).toFixed(2)}</span>`)}
        ${vf('Commission',t.commission?`<span class="mono" style="color:var(--t2)">-$${Math.abs(parseFloat(t.commission)).toFixed(2)}</span>`:'—')}
        ${vf('Net P&L',`<span class="mono" style="font-weight:800;font-size:16px;color:${net>=0?'var(--green2)':'var(--red2)'}">${net>=0?'+$':'-$'}${Math.abs(net).toFixed(2)}</span>`)}
        ${vf('Planned R:R',`<span class="mono" style="color:var(--gold2)">${t.plannedRR||t.rr||'—'}</span>`)}
        ${vf('Actual R:R',`<span class="mono" style="color:var(--accent2);font-weight:700">${t.rr||'—'}</span>`)}
        ${vf('Grade',gradeHtml(t.grade))}
        ${vf('Emotion',t.emotion||'—')}
        ${vf('Rules',t.followedRules===true?'<span class="badge bg">✓ Yes</span>':t.followedRules===false?'<span class="badge br">✗ No</span>':'—')}
        ${vf('Trade Result',resultBadge(t)||'<span class="badge bx">Auto-detect</span>')}}
        ${t.tags?.length?vf('Tags',t.tags.map(g=>`<span class="tag">${g}</span>`).join(' ')):''}
      </div>
    </div>
    ${t.notes?`<div class="fg"><div class="fl">Notes</div><div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:11px;font-size:13px;line-height:1.6;color:var(--t1)">${t.notes}</div></div>`:''}
    ${t.screenshots?.length?`<div class="fg"><div class="fl">Screenshots</div><div class="ss-grid">${t.screenshots.map(s=>`<div class="ss-th" onclick="window.open('','_blank').document.write('<img src=\\'${s.data}\\' style=\\'max-width:100%;background:#000\\'>')"><img src="${s.data}"></div>`).join('')}</div></div>`:''}
    <div style="display:flex;gap:7px;padding-top:12px;border-top:1px solid var(--border)">
      <button class="btn btn-s btn-sm" onclick="C('modal-view-trade');openAddTrade('${t.id}')">✎ Edit</button>
      ${tvBtn}
      <button class="btn btn-d btn-sm" onclick="C('modal-view-trade');deleteTrade('${t.id}')">✕ Delete</button>
    </div>`;
  O('modal-view-trade');
}

// ═══════════════════════════════════════════════════════════
// BADGE HELPERS
// ═══════════════════════════════════════════════════════════
function dirBadge(d){return d==='Buy'||d==='Long'?'<span class="badge bg">↑ Buy</span>':'<span class="badge br">↓ Sell</span>'}
function resultBadge(t){
  if(isRFBE(t))return '<span class="badge ba" style="font-size:10px">🔄 RF/BE</span>';
  if(netPnL(t)===0&&!t.tradeResult)return '<span class="badge ba" style="font-size:10px">⚖ BE</span>';
  if(isWin(t))return '<span class="badge bg" style="font-size:10px">✓ Win</span>';
  if(isLoss(t))return '<span class="badge br" style="font-size:10px">✗ Loss</span>';
  return '';
}
function gradeHtml(g){const c={'A+':'var(--green2)','A':'var(--accent2)','B':'var(--gold2)','C':'var(--red2)'};return g?`<span class="mono" style="color:${c[g]||'var(--t2)'};font-weight:800">${g}</span>`:'—'}
function fmtP(v){const n=parseFloat(v)||0;return`<span class="mono" style="color:${n>=0?'var(--green2)':'var(--red2)'};font-weight:700">${n>=0?'+$':'-$'}${Math.abs(n).toFixed(2)}</span>`}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
function getAcctBase(a){
  if(!a)return 0;
  const startBal=parseFloat(a.balance)||0;
  const depwTotal=getDepWOffset(a);
  return startBal+depwTotal;
}
function getDepWOffset(a){if(!a||!Array.isArray(a.depw))return 0;return a.depw.reduce((s,d)=>s+(d.type==='deposit'?1:-1)*(parseFloat(d.amount)||0),0)}

function renderDash(){
  updateSidebar();
  const trades=activeTrades();const a=acct();
  const pnl=trades.reduce((s,t)=>s+netPnL(t),0);
  const wins=trades.filter(t=>isWin(t));const losses=trades.filter(t=>isLoss(t));
  const gp=wins.reduce((s,t)=>s+netPnL(t),0);
  const gl=Math.abs(losses.reduce((s,t)=>s+netPnL(t),0));
  const wr=trades.length?(wins.length/trades.length*100).toFixed(1):0;
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'—';
  const rrTrades=trades.filter(t=>t.rr&&t.rr!=='—'&&t.rr!=='');
  let avgRR='—';
  if(rrTrades.length){
    const vals=rrTrades.map(t=>{const v=parseFloat(String(t.rr).replace(/[^\d.-]/g,''));return isNaN(v)?0:v});
    avgRR=(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2);
  }
  const pnlEl=document.getElementById('d-pnl');
  pnlEl.textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2);
  pnlEl.className='stat-v mono '+(pnl>=0?'pos':'neg');
  const base=getAcctBase(a);
  const pct=base>0?((pnl/base)*100).toFixed(2):null;
  document.getElementById('d-pnl-sub').textContent=trades.length+' trades'+(pct?` · ${pnl>=0?'+':''}${pct}%`:'');
  document.getElementById('d-wr').textContent=wr+'%';
  document.getElementById('d-wl').textContent=`${wins.length}W · ${losses.length}L`;
  document.getElementById('d-pf').textContent=pf;
  document.getElementById('d-rr').textContent=avgRR==='—'?'—':'1:'+avgRR;
  renderEquityChart(trades);renderPFBar();renderCalendar();
  renderTopSessions(trades);renderTopPairs(trades);
  renderDashTrades(trades.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8));
  checkRules();
}

function renderEquityChart(trades){
  const range=st.eqRange,a=acct();
  const curveMode=document.getElementById('eq-type')?.value||'profit';

  // Build sorted trade list
  let sorted=[...trades].sort((x,y)=>{
    const da=new Date(x.date+'T'+(x.openTime||'12:00'));
    const db=new Date(y.date+'T'+(y.openTime||'12:00'));
    return da-db;
  });
  const now=new Date();
  if(range==='7d'){const d=new Date(now-7*864e5);sorted=sorted.filter(t=>new Date(t.date)>=d)}
  else if(range==='30d'){const d=new Date(now-30*864e5);sorted=sorted.filter(t=>new Date(t.date)>=d)}
  else if(range==='3m'){const d=new Date(now-90*864e5);sorted=sorted.filter(t=>new Date(t.date)>=d)}
  if(a?.freshDate)sorted=sorted.filter(t=>t.date>=a.freshDate);

  const labels=[],values=[],tooltipDates=[];

  if(curveMode==='profit'){
    // Simple cumulative P&L from 0 — unchanged
    let cum=0;
    if(sorted.length){labels.push(sorted[0].date.slice(5));values.push(0);tooltipDates.push(sorted[0].date)}
    sorted.forEach(t=>{cum+=parseFloat(t.pnl)||0;labels.push(t.date.slice(5));values.push(parseFloat(cum.toFixed(2)));tooltipDates.push(t.date)});
  } else {
    // Equity mode: merge trades + deposit/withdrawal events chronologically
    // Build events list: {date, label, delta}
    const startBal=parseFloat(a?.balance)||0;
    const events=[];
    // Add deposit/withdrawal events
    (a?.depw||[]).forEach(d=>{
      events.push({date:d.date,label:d.date.slice(5),delta:(d.type==='deposit'?1:-1)*(parseFloat(d.amount)||0),type:d.type});
    });
    // Add trade events
    sorted.forEach(t=>{
      events.push({date:t.date+'T'+(t.openTime||'12:00'),label:t.date.slice(5),delta:netPnL(t),type:'trade'});
    });
    // Sort all events by date
    events.sort((a,b)=>new Date(a.date)-new Date(b.date));

    // Start at starting balance
    let equity=startBal;
    if(events.length){
      labels.push(events[0].label);values.push(parseFloat(equity.toFixed(2)));tooltipDates.push(events[0].date.slice(0,10));
    } else {
      labels.push(new Date().toISOString().slice(5,10));values.push(startBal);tooltipDates.push(new Date().toISOString().slice(0,10));
    }
    events.forEach(e=>{
      equity+=e.delta;
      labels.push(e.label);values.push(parseFloat(equity.toFixed(2)));tooltipDates.push(e.date.slice(0,10));
    });
  }

  const startVal=values[0]??0;
  const lastVal=values[values.length-1]??startVal;
  const isUp=lastVal>=startVal;
  const lc=isUp?'#22c55e':'#ef4444';

  const extraDS=[];
  if(a?.type==='Prop Firm'&&a.pfRules&&labels.length>1){
    const pfBase=parseFloat(a.balance)||0;
    if(a.pfRules.maxDD)extraDS.push({label:`Max DD (${a.pfRules.maxDD}%)`,data:labels.map(()=>pfBase-(pfBase*a.pfRules.maxDD/100)),borderColor:'rgba(239,68,68,.6)',borderWidth:1.5,borderDash:[4,4],pointRadius:0,fill:false,tension:0});
    if(a.pfRules.profitTarget)extraDS.push({label:`Target (${a.pfRules.profitTarget}%)`,data:labels.map(()=>pfBase+(pfBase*a.pfRules.profitTarget/100)),borderColor:'rgba(34,197,94,.6)',borderWidth:1.5,borderDash:[4,4],pointRadius:0,fill:false,tension:0});
  }

  if(st.charts.equityChart){try{st.charts.equityChart.destroy()}catch(e){}delete st.charts.equityChart}
  requestAnimationFrame(()=>{
    const canvas=document.getElementById('equityChart');if(!canvas)return;
    const ctx=canvas.getContext('2d');
    const grad=ctx.createLinearGradient(0,0,0,200);
    grad.addColorStop(0,isUp?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)');
    grad.addColorStop(1,'transparent');
    const c=CL();
    const ch=new Chart(ctx,{type:'line',data:{labels,datasets:[{label:curveMode==='equity'?'Equity':'P&L',data:values,borderColor:lc,backgroundColor:grad,borderWidth:2,fill:true,tension:.4,pointRadius:values.length<=20?3:0,pointHoverRadius:5,pointBackgroundColor:lc,pointBorderColor:'transparent'},...extraDS]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:350},interaction:{mode:'index',intersect:false},scales:{x:{ticks:{color:c.text,font:{size:10},maxTicksLimit:10,maxRotation:0},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'},callback:v=>(v>=0?'$':'-$')+Math.abs(v).toFixed(0)},grid:{color:c.grid},border:{display:false}}},plugins:{legend:{display:extraDS.length>0,position:'bottom',labels:{color:c.t1,font:{size:10},boxWidth:16}},tooltip:{...chartTooltip(),callbacks:{title:i=>tooltipDates[i[0]?.dataIndex]||i[0]?.label||'',label:i=>` ${i.dataset.label}: ${i.raw>=0?'$':'-$'}${Math.abs(i.raw).toFixed(2)}`}}}}});
    st.charts.equityChart=ch;
  });
}

function filterEq(r){
  st.eqRange=r;
  ['7d','30d','3m','all'].forEach(x=>{const el=document.getElementById('eq-'+x);if(el)el.className=x===r?'btn btn-p btn-xs':'btn btn-g btn-xs'});
  renderEquityChart(activeTrades());
}

function renderPFBar(){
  const bar=document.getElementById('pf-dash-bar');if(!bar)return;
  const a=acct();if(!a||a.type!=='Prop Firm'){bar.style.display='none';return}
  const trades=activeTrades();const pnl=trades.reduce((s,t)=>s+netPnL(t),0);
  const today=todayStr();const todayPnL=trades.filter(t=>t.date===today).reduce((s,t)=>s+netPnL(t),0);
  const base=getAcctBase(a);const pf=a.pfRules||{};
  const lossToday=Math.abs(Math.min(0,todayPnL));const totalLoss=Math.abs(Math.min(0,pnl));
  const pb=(pct,color)=>`<div style="height:5px;background:var(--bg3);border-radius:99px;overflow:hidden;margin-top:4px"><div style="width:${Math.min(100,pct)}%;height:100%;border-radius:99px;background:${color};transition:width .5s"></div></div>`;
  const stat=(lbl,val,sub,col)=>`<div style="flex:1;min-width:110px"><div style="font-size:11.5px;color:var(--t2);margin-bottom:2px">${lbl}</div><div style="font-size:12.5px;font-weight:700;color:${col||'var(--t0)'}">${val}</div>${sub||''}</div>`;
  bar.style.display='flex';bar.style.flexWrap='wrap';bar.style.gap='16px';
  bar.innerHTML=[
    stat('Daily DD',`${(lossToday/base*100).toFixed(2)}% / ${pf.dailyDD||0}%`,pb(pf.dailyDD?lossToday/base*100/pf.dailyDD*100:0,lossToday/base*100>=(pf.dailyDD||0)?'var(--red)':'var(--gold)'),lossToday/base*100>=(pf.dailyDD||0)?'var(--red2)':'var(--gold2)'),
    stat('Max DD',`${(totalLoss/base*100).toFixed(2)}% / ${pf.maxDD||0}%`,pb(pf.maxDD?totalLoss/base*100/pf.maxDD*100:0,totalLoss/base*100>=(pf.maxDD||0)*0.8?'var(--red)':'var(--accent)'),totalLoss/base*100>=(pf.maxDD||0)?'var(--red2)':'var(--t0)'),
    stat('Target',`${base&&pf.profitTarget?Math.max(0,pnl/base*100).toFixed(2):0}% / ${pf.profitTarget||0}%`,pb(pf.profitTarget&&base?Math.max(0,pnl/base*100/pf.profitTarget*100):0,'var(--green)'),'var(--green2)'),
    stat('Net P&L',(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2),`<div style="font-size:12px;color:var(--t2);margin-top:2px">Today: ${todayPnL>=0?'+$':'-$'}${Math.abs(todayPnL).toFixed(2)}</div>`,pnl>=0?'var(--green2)':'var(--red2)'),
  ].join('');
}

function renderTopSessions(trades){
  const el=document.getElementById('dash-top-sessions');if(!el)return;
  const sm={};trades.forEach(t=>{if(!t.session)return;if(!sm[t.session])sm[t.session]={pnl:0,w:0,n:0};sm[t.session].pnl+=parseFloat(t.pnl)||0;sm[t.session].n++;if((parseFloat(t.pnl)||0)>0)sm[t.session].w++});
  const e=Object.entries(sm).sort((a,b)=>b[1].pnl-a[1].pnl);
  el.innerHTML=e.length?e.map(([nm,d])=>{const col=DB.sessions.find(s=>s.name===nm)?.color||'var(--accent)';return`<div style="display:flex;align-items:center;gap:9px;padding:9px 13px;border-bottom:1px solid var(--border)"><div style="width:3px;height:32px;border-radius:2px;background:${col};flex-shrink:0"></div><div style="flex:1"><div style="font-size:12.5px;font-weight:600;color:var(--t0)">${nm}</div><div style="font-size:12px;color:var(--t2)">${d.n} trades · WR ${d.n?(d.w/d.n*100).toFixed(0):0}%</div></div><div style="font-size:13px;font-weight:700;color:${d.pnl>=0?'var(--green2)':'var(--red2)'}">${d.pnl>=0?'+$':'-$'}${Math.abs(d.pnl).toFixed(2)}</div></div>`}).join(''):'<div class="empty" style="padding:20px"><div class="empty-tl">No data</div></div>';
}

function renderTopPairs(trades){
  const el=document.getElementById('dash-top-pairs');if(!el)return;
  const pm={};trades.forEach(t=>{if(!t.symbol)return;if(!pm[t.symbol])pm[t.symbol]={pnl:0,w:0,n:0};pm[t.symbol].pnl+=parseFloat(t.pnl)||0;pm[t.symbol].n++;if((parseFloat(t.pnl)||0)>0)pm[t.symbol].w++});
  const e=Object.entries(pm).sort((a,b)=>b[1].pnl-a[1].pnl).slice(0,5);
  el.innerHTML=e.length?e.map(([sym,d])=>`<div style="display:flex;align-items:center;gap:9px;padding:9px 13px;border-bottom:1px solid var(--border)"><div style="font-size:11px;font-weight:700;font-family:'Geist Mono';color:var(--t0);min-width:65px">${sym}</div><div style="flex:1"><div style="font-size:12px;color:var(--t2)">${d.n} trades · WR ${d.n?(d.w/d.n*100).toFixed(0):0}%</div></div><div style="font-size:13px;font-weight:700;color:${d.pnl>=0?'var(--green2)':'var(--red2)'}">${d.pnl>=0?'+$':'-$'}${Math.abs(d.pnl).toFixed(2)}</div></div>`).join(''):'<div class="empty" style="padding:20px"><div class="empty-tl">No data</div></div>';
}

function renderCalendar(){
  const{calY:y,calM:m}=st;
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dw=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  document.getElementById('cal-label').textContent=`${mo[m]} ${y}`;
  document.getElementById('cal-head').innerHTML=dw.map(d=>`<div class="cal-hdd">${d}</div>`).join('');
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),off=(fd+6)%7;
  const today=new Date();const pm={},cm={};
  DB.trades.filter(t=>t.acctId===st.activeAcctId).forEach(t=>{
    if(!t.date)return;const p=t.date.split('-').map(Number);
    if(p[0]===y&&p[1]-1===m){pm[p[2]]=(pm[p[2]]||0)+netPnL(t);cm[p[2]]=(cm[p[2]]||0)+1}
  });
  let html=Array(off).fill('<div></div>').join('');
  for(let d=1;d<=dim;d++){
    const p=pm[d];const isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+=`<div class="cal-day ${p>0?'win':p<0?'loss':''} ${isT?'today':''} ${p!==undefined?'ht':''}" title="${p!==undefined?`${cm[d]||0} trade(s): ${p>=0?'+$':'-$'}${Math.abs(p).toFixed(2)}`:''}">
      <div class="cal-dn">${d}</div>
      ${p!==undefined?`<div class="cal-dp">${p>=0?'+$':'-$'}${Math.abs(p).toFixed(0)}</div>`:''}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function calMove(dir){st.calM+=dir;if(st.calM>11){st.calM=0;st.calY++}if(st.calM<0){st.calM=11;st.calY--}renderCalendar()}

function renderDashTrades(trades){
  const tbody=document.getElementById('dash-tbody');if(!trades.length){tbody.innerHTML='<tr><td colspan="9"><div class="empty"><div class="empty-ic">⇅</div><div class="empty-tl">No trades yet</div></div></td></tr>';return}
  tbody.innerHTML=trades.map(t=>`<tr onclick="viewTrade('${t.id}')">
    <td class="mono" style="font-size:12px;color:var(--t1)">${t.date}</td>
    <td><strong style="color:var(--t0)">${t.symbol}</strong></td>
    <td>${dirBadge(t.direction)}</td>
    <td class="mono" style="font-size:11px">${t.entry||'—'}</td>
    <td class="mono" style="font-size:11px;color:var(--gold2)">${t.exitPrice||'—'}</td>
    <td>${fmtP(netPnL(t))}</td>
    <td style="font-size:11px;color:var(--gold2)">${t.rr||'—'}</td>
    <td>${gradeHtml(t.grade)}</td>
    <td><span class="badge ${(parseFloat(t.pnl)||0)>0?'bg':(parseFloat(t.pnl)||0)<0?'br':'bx'}">${isRFBE(t)?'RF/BE':isWin(t)?'WIN':isLoss(t)?'LOSS':'BE'}</span></td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════════════════════
// TRADES PAGE
// ═══════════════════════════════════════════════════════════
function populateFilters(){
  const fS=document.getElementById('f-sym');if(fS){const cv=fS.value;const all=[...new Set(DB.trades.map(t=>t.symbol).filter(Boolean))].sort();fS.innerHTML='<option value="">All Pairs</option>'+all.map(s=>`<option>${s}</option>`).join('');fS.value=cv}
  const fSe=document.getElementById('f-sess');if(fSe){const cv=fSe.value;fSe.innerHTML='<option value="">All Sessions</option>'+DB.sessions.map(s=>`<option>${s.name}</option>`).join('');fSe.value=cv}
}
function getFilteredTrades(){
  let t=[...DB.trades].filter(x=>!st.activeAcctId||x.acctId===st.activeAcctId);
  const fS=document.getElementById('f-sym')?.value,fSe=document.getElementById('f-sess')?.value;
  const fD=document.getElementById('f-dir')?.value,fR=document.getElementById('f-res')?.value;
  const fF=document.getElementById('f-from')?.value,fT=document.getElementById('f-to')?.value;
  if(fS)t=t.filter(x=>x.symbol===fS);if(fSe)t=t.filter(x=>x.session===fSe);
  if(fD)t=t.filter(x=>x.direction===fD);
  if(fR==='Win')t=t.filter(x=>parseFloat(x.pnl)>0);if(fR==='Loss')t=t.filter(x=>parseFloat(x.pnl)<0);if(fR==='BE')t=t.filter(x=>parseFloat(x.pnl)===0);
  if(fF)t=t.filter(x=>x.date>=fF);if(fT)t=t.filter(x=>x.date<=fT);
  t.sort((a,b)=>b.date.localeCompare(a.date));
  return t;
}
['f-sym','f-sess','f-dir','f-res','f-from','f-to'].forEach(id=>document.getElementById(id)?.addEventListener('change',renderTrades));
function clearFilters(){['f-sym','f-sess','f-dir','f-res','f-from','f-to'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});renderTrades()}

function renderTrades(){
  populateFilters();const trades=getFilteredTrades();
  document.getElementById('trades-count').textContent=trades.length+' trades';
  const tbody=document.getElementById('trades-tbody');
  if(!trades.length){tbody.innerHTML='<tr><td colspan="17"><div class="empty"><div class="empty-ic">⇅</div><div class="empty-tl">No trades</div></div></td></tr>';return}
  const am={};DB.accounts.forEach(a=>am[a.id]=a);
  tbody.innerHTML=trades.map(t=>{
    const a=am[t.acctId];const net=(parseFloat(t.pnl)||0)-(parseFloat(t.commission)||0);const hold=calcHold(t.date,t.openTime,t.closeDate,t.closeTime);
    return`<tr onclick="viewTrade('${t.id}')">
      <td class="mono" style="font-size:12px;color:var(--t1)">${t.date}<br><span style="color:var(--t2)">${t.openTime||''}</span></td>
      <td><strong style="color:var(--t0);font-size:14px">${t.symbol}</strong></td>
      <td>${dirBadge(t.direction)} ${resultBadge(t)}</td>
      <td style="font-size:12px;color:var(--gold2);font-weight:600">${t.setup?.split(' ')[0]||'—'}</td>
      <td style="font-size:12.5px;color:var(--t1)">${t.session||'—'}</td>
      <td class="mono" style="font-size:11px">${t.entry||'—'}</td>
      <td class="mono" style="font-size:11px;color:var(--gold2);font-weight:600">${t.exitPrice||'—'}</td>
      <td class="mono" style="font-size:11px;color:var(--red2)">${t.sl||'—'}</td>
      <td class="mono" style="font-size:12.5px;color:var(--t1)">${t.lots||'—'}</td>
      <td>${fmtP(netPnL(t))}</td>
      <td><span class="mono" style="color:${net>=0?'var(--green2)':'var(--red2)'};font-weight:700">${net>=0?'+$':'-$'}${Math.abs(net).toFixed(2)}</span></td>
      <td style="font-size:11px;color:var(--gold2)">${t.plannedRR||'—'}</td>
      <td style="font-size:11px;color:var(--accent2);font-weight:600">${t.rr||'—'}</td>
      <td style="font-size:12.5px;color:var(--t1)">${hold}</td>
      <td>${gradeHtml(t.grade)}</td>
      <td onclick="event.stopPropagation()"><div style="display:flex;gap:3px"><button class="btn-ic" onclick="openAddTrade('${t.id}')">✎</button><button class="btn-ic" onclick="deleteTrade('${t.id}')">✕</button></div></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// JOURNAL
// ═══════════════════════════════════════════════════════════
function renderJournal(){
  let all=activeTrades().sort((a,b)=>b.date.localeCompare(a.date));
  if(st.jrnlDateFrom)all=all.filter(t=>t.date>=st.jrnlDateFrom);
  if(st.jrnlDateTo)all=all.filter(t=>t.date<=st.jrnlDateTo);
  const tab=st.jrnlTabFilter||'all';
  const trades=tab==='pending'?all.filter(t=>!(t.journalNotes?.trim().length>0)):
                tab==='done'?all.filter(t=>t.journalNotes?.trim().length>0):all;
  const list=document.getElementById('jrnl-list');
  if(!trades.length){list.innerHTML='<div class="empty" style="padding:40px"><div class="empty-ic">✎</div><div class="empty-tl">No trades '+(tab==='pending'?'to review':tab==='done'?'journaled yet':'')+'</div></div>';return}
  list.innerHTML=trades.map(t=>{const hasJ=t.journalNotes?.trim().length>0;return`<div class="jrnl-item" onclick="openJrnlDetail('${t.id}')">
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px">
      <strong style="font-size:13px;color:var(--t0)">${t.symbol}</strong>${dirBadge(t.direction)}
      <span style="font-size:10px;color:var(--gold2)">${t.setup?.split(' ')[0]||''}</span>
      <span style="margin-left:auto;font-size:9.5px;color:${hasJ?'var(--green2)':'var(--t3)'}">${hasJ?'✓ done':'pending'}</span>
    </div>
    <div style="display:flex;justify-content:space-between"><span style="font-size:12px;color:var(--t2)">${t.date}${t.session&&t.session!=='No Session'?' · '+t.session:''}</span>${fmtP(netPnL(t))}</div>
  </div>`}).join('');
}

function setJrnlDate(){
  st.jrnlDateFrom=document.getElementById('jrnl-from')?.value||'';
  st.jrnlDateTo=document.getElementById('jrnl-to')?.value||'';
  renderJournal();
}
function clearJrnlDate(){
  st.jrnlDateFrom='';st.jrnlDateTo='';
  const f=document.getElementById('jrnl-from');const t=document.getElementById('jrnl-to');
  if(f)f.value='';if(t)t.value='';
  renderJournal();
}

function setJrnlTab(tab,el){
  st.jrnlTabFilter=tab;
  document.querySelectorAll('.jrnl-tab').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  renderJournal();
}

function mbox(l,v,c){return`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:9px;text-align:center"><div style="font-size:10.5px;color:var(--t2);text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px">${l}</div><div style="font-weight:700;font-size:12.5px;color:${c};font-family:'Geist Mono',monospace">${v}</div></div>`}
let _jrnlTimer=null;
function openJrnlDetail(id){
  const t=DB.trades.find(x=>x.id===id);if(!t)return;
  document.querySelectorAll('.jrnl-item').forEach(el=>el.classList.remove('active'));
  const a=acct(t.acctId);
  const net=(parseFloat(t.pnl)||0)-(parseFloat(t.commission)||0);
  const tvBtn=t.tvLink?`<a href="${t.tvLink}" target="_blank" class="btn btn-s btn-sm" style="margin-bottom:12px;display:inline-flex">📊 TradingView Chart</a>`:'';
  
  // Full trade data grid
  const dataGrid=[
    ['Pair',`<strong style="color:var(--t0)">${t.symbol}</strong>`],
    ['Direction',dirBadge(t.direction)],
    ['Account',a?.name||'—'],
    ['Session',t.session||'—'],
    ['Setup',`<span style="color:var(--gold2)">${t.setup||'—'}</span>`],
    ['Structure',t.structure||'—'],
    ['Timeframe',t.tf||'—'],
    ['Date',t.date||'—'],
    ['Open Time',t.openTime||'—'],
    ['Close Time',t.closeTime||'—'],
    ['Entry',`<span class="mono">${t.entry||'—'}</span>`],
    ['Exit',`<span class="mono" style="color:var(--gold2);font-weight:700">${t.exitPrice||'—'}</span>`],
    ['SL',`<span class="mono" style="color:var(--red2)">${t.sl||'—'}</span>`],
    ['TP',`<span class="mono" style="color:var(--green2)">${t.tp||'—'}</span>`],
    ['Lots',t.lots||'—'],
    ['Commission',t.commission?'-$'+Math.abs(parseFloat(t.commission)).toFixed(2):'—'],
    ['Planned R:R',`<span class="mono" style="color:var(--gold2)">${t.plannedRR||'—'}</span>`],
    ['Actual R:R',`<span class="mono" style="color:var(--accent2);font-weight:700">${t.rr||'—'}</span>`],
    ['Grade',gradeHtml(t.grade)],
    ['Emotion',t.emotion||'—'],
    ['Rules',t.followedRules===true?'<span class="badge bg">✓ Yes</span>':t.followedRules===false?'<span class="badge br">✗ No</span>':'—'],
    ['Result',resultBadge(t)||'<span class="badge bx">Auto-detect</span>'],
  ].map(([l,v])=>`<div class="jd-item"><div class="jd-lbl">${l}</div><div class="jd-val">${v}</div></div>`).join('');
  
  const pnlDetail=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
      ${mbox('Gross P&L',(parseFloat(t.pnl)||0)>=0?'+$'+Math.abs(parseFloat(t.pnl)||0).toFixed(2):'-$'+Math.abs(parseFloat(t.pnl)||0).toFixed(2),(parseFloat(t.pnl)||0)>=0?'var(--green2)':'var(--red2)')}
      ${mbox('Net P&L',(net>=0?'+$':'-$')+Math.abs(net).toFixed(2),net>=0?'var(--green2)':'var(--red2)')}
    </div>`;

  document.getElementById('jrnl-detail').innerHTML=`
    <div style="display:flex;align-items:center;gap:9px;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid var(--border)">
      <strong style="font-size:15px;color:var(--t0)">${t.symbol} ${t.direction}</strong>
      <span class="badge bgd">${t.setup?.split(' ')[0]||''}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--t2)">${t.date}</span>
      <button class="btn btn-s btn-sm" onclick="openAddTrade('${t.id}')">✎ Edit</button>
    </div>
    ${tvBtn}
    ${pnlDetail}
    <!-- Full trade details grid -->
    <div class="jrnl-trade-detail">
      <div class="card-t" style="margin-bottom:8px">Trade Details</div>
      <div class="jrnl-detail-grid">${dataGrid}</div>
    </div>
    ${t.notes?`<div class="jrnl-trade-detail" style="margin-top:10px"><div class="card-t" style="margin-bottom:5px">Trade Notes</div><div style="font-size:12.5px;color:var(--t1);line-height:1.6">${t.notes}</div></div>`:''}
    ${t.screenshots?.length?`<div class="jrnl-trade-detail" style="margin-top:10px"><div class="card-t" style="margin-bottom:8px">Screenshots</div><div class="ss-grid">${t.screenshots.map(s=>`<div class="ss-th" onclick="window.open('','_blank').document.write('<img src=\'${s.data}\' style=\'max-width:100%;background:#000\'>')"><img src="${s.data}"></div>`).join('')}</div></div>`:''}
    <div class="jrnl-trade-detail" style="margin-top:10px">
      <div class="card-t" style="margin-bottom:8px">Analysis & Insights <span id="jsa" style="font-size:10px;color:var(--green2);opacity:0;transition:opacity .4s">✓ saved</span></div>
      <textarea class="ft" id="jrnl-ta" rows="8" placeholder="Your analysis here...">${t.journalNotes||''}</textarea>
      <button class="btn btn-p btn-sm" style="margin-top:8px" onclick="saveJrnl('${t.id}')">💾 Save Notes</button>
    </div>`;
  
  const ta=document.getElementById('jrnl-ta');
  if(ta)ta.addEventListener('keyup',()=>{clearTimeout(_jrnlTimer);_jrnlTimer=setTimeout(()=>{const n=ta.value;const i=DB.trades.findIndex(x=>x.id===id);if(i!==-1){DB.trades[i].journalNotes=n;save('trades')}const ind=document.getElementById('jsa');if(ind){ind.style.opacity='1';setTimeout(()=>ind.style.opacity='0',1500)}renderJournal()},800)});
  // Scroll to top
  const jr=document.getElementById('jrnl-detail');if(jr)jr.scrollTop=0;
}

function saveJrnl(id){const n=document.getElementById('jrnl-ta')?.value;const i=DB.trades.findIndex(t=>t.id===id);if(i!==-1){DB.trades[i].journalNotes=n;save('trades')}toast('Saved','','success');renderJournal()}

// ═══════════════════════════════════════════════════════════
// ANALYTICS — filter helpers
// ═══════════════════════════════════════════════════════════
function getFilteredAnalyticsTrades(){
  const now=new Date();let trades=[...activeTrades()];
  const f=st.perfFilter;
  if(f==='today'){const d=todayStr();trades=trades.filter(t=>t.date===d)}
  else if(f==='7d'){const d=new Date(now-7*864e5).toISOString().slice(0,10);trades=trades.filter(t=>t.date>=d)}
  else if(f==='30d'){const d=new Date(now-30*864e5).toISOString().slice(0,10);trades=trades.filter(t=>t.date>=d)}
  else if(f==='3m'){const d=new Date(now-90*864e5).toISOString().slice(0,10);trades=trades.filter(t=>t.date>=d)}
  else if(f==='1y'){const d=new Date(now-365*864e5).toISOString().slice(0,10);trades=trades.filter(t=>t.date>=d)}
  const tf=st.perfTypeFilter;
  if(tf==='wins')trades=trades.filter(t=>parseFloat(t.pnl)>0);
  else if(tf==='losses')trades=trades.filter(t=>parseFloat(t.pnl)<0);
  return trades;
}
function setPerfFilter(f,el){
  st.perfFilter=f;
  document.querySelectorAll('#perf-time-pills .time-pill').forEach(p=>p.classList.remove('active'));
  if(el)el.classList.add('active');
  renderAnalytics(st.anTab);
}
function setPerfTypeFilter(f){
  st.perfTypeFilter=f;
  ['all','wins','losses'].forEach(x=>{const el=document.getElementById('pf-'+x);if(el)el.classList.toggle('active',x===f)});
  renderAnalytics(st.anTab);
}
function anTab(tab,btn){
  st.anTab=tab;
  document.querySelectorAll('#an-tabs .tab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  ['ov','pairs','sessions','setups','time','emotions','calendar'].forEach(t=>{const el=document.getElementById('an-'+t);if(el)el.style.display=t===tab?'block':'none'});
  renderAnalytics(tab);
}

function getStreaks(trades){const s=[...trades].sort((a,b)=>a.date.localeCompare(b.date));let mW=0,mL=0,cW=0,cL=0;s.forEach(t=>{const p=parseFloat(t.pnl);if(p>0){cW++;cL=0;mW=Math.max(mW,cW)}else if(p<0){cL++;cW=0;mL=Math.max(mL,cL)}});return{maxW:mW,maxL:mL}}
function avgHoldTime(trades){const m=trades.map(t=>{if(!t.openTime||!t.closeTime)return null;try{const o=new Date(t.date+'T'+t.openTime);const c=new Date((t.closeDate||t.date)+'T'+t.closeTime);let d=(c-o)/60000;if(d<0)d+=1440;return d>0?d:null}catch{return null}}).filter(v=>v!==null);if(!m.length)return'—';const avg=m.reduce((s,v)=>s+v,0)/m.length;return avg<60?avg.toFixed(0)+'m':avg<1440?(avg/60).toFixed(1)+'h':(avg/1440).toFixed(1)+'d'}
function avgHoldWL(trades,win){const m=trades.filter(t=>(parseFloat(t.pnl)||0)>0===win).map(t=>{if(!t.openTime||!t.closeTime)return null;try{const o=new Date(t.date+'T'+t.openTime);const c=new Date((t.closeDate||t.date)+'T'+t.closeTime);let d=(c-o)/60000;if(d<0)d+=1440;return d>0?d:null}catch{return null}}).filter(v=>v!==null);if(!m.length)return'—';const avg=m.reduce((s,v)=>s+v,0)/m.length;return avg<60?avg.toFixed(0)+'m':(avg/60).toFixed(1)+'h'}

function renderAnalytics(tab='ov'){
  const trades=getFilteredAnalyticsTrades();
  const wins=trades.filter(t=>isWin(t));const losses=trades.filter(t=>isLoss(t));
  const pnl=trades.reduce((s,t)=>s+netPnL(t),0);
  const gp=wins.reduce((s,t)=>s+netPnL(t),0);
  const gl=Math.abs(losses.reduce((s,t)=>s+netPnL(t),0));
  const pf=gl>0?(gp/gl).toFixed(2):gp>0?'∞':'—';
  const wr=trades.length?(wins.length/trades.length*100).toFixed(1):0;
  const exp=trades.length?(pnl/trades.length).toFixed(2):'0';
  const c=CL();
  document.getElementById('an-pnl').textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2);
  document.getElementById('an-pnl').className='stat-v mono '+(pnl>=0?'pos':'neg');
  document.getElementById('an-wr').textContent=wr+'%';
  document.getElementById('an-pf').textContent=pf;
  document.getElementById('an-exp').textContent=(parseFloat(exp)>=0?'+$':'-$')+Math.abs(exp);
  const _a=acct();const _base=parseFloat(_a?.balance)||0;
  const _depwOff=getDepWOffset(_a);const _equity=_base+_depwOff+pnl;
  const _depArr=(_a?.depw||[]);
  const _totDep=_depArr.filter(d=>d.type==='deposit').reduce((s,d)=>s+(parseFloat(d.amount)||0),0);
  const _totWit=_depArr.filter(d=>d.type==='withdrawal').reduce((s,d)=>s+(parseFloat(d.amount)||0),0);
  const _dayMap={};trades.forEach(t=>{_dayMap[t.date]=(_dayMap[t.date]||0)+netPnL(t)});
  const _dayVals=Object.values(_dayMap).filter(v=>v>0);
  const _maxDay=_dayVals.length?Math.max(..._dayVals):0;
  const _cons=pnl>0&&_maxDay>0?(_maxDay/pnl*100).toFixed(1)+'%':'—';
  ['an-equity','an-deposited','an-withdrawn','an-net-profit','an-consistency'].forEach(eid=>{const el=document.getElementById(eid);if(!el)return;if(eid==='an-equity')el.textContent='$'+_equity.toFixed(2);else if(eid==='an-deposited')el.textContent='+$'+_totDep.toFixed(2);else if(eid==='an-withdrawn')el.textContent=_totWit>0?'-$'+_totWit.toFixed(2):'$0';else if(eid==='an-net-profit'){el.textContent=(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2);el.className='stat-v mono '+(pnl>=0?'pos':'neg')}else if(eid==='an-consistency')el.textContent=_cons;});

  if(tab==='ov'){
    // Equity curve in analytics
    renderAnEquity('profit',trades);
    // WL donut
    const rfBeTrades=trades.filter(t=>isRFBE(t));
    const pureWins=trades.filter(t=>!isRFBE(t)&&isWin(t));
    const pureLosses=trades.filter(t=>!isRFBE(t)&&isLoss(t));
    const zeroBE=trades.filter(t=>!isRFBE(t)&&netPnL(t)===0);
    makeChart('wlChart',{type:'doughnut',data:{labels:['Win','Loss','RF/BE','$0 BE'],datasets:[{data:[pureWins.length,pureLosses.length,rfBeTrades.length,zeroBE.length],backgroundColor:['rgba(34,197,94,.75)','rgba(239,68,68,.75)','rgba(59,130,246,.7)','rgba(59,130,246,.3)'],borderWidth:0,hoverOffset:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:c.t1,font:{size:11},padding:10,filter:i=>i.parsed>0}}},cutout:'65%'}});
    // Stats tables
    const strk=getStreaks(trades);const totalLots=trades.reduce((s,t)=>s+(parseFloat(t.lots)||0),0).toFixed(2);
    const totalComm=trades.reduce((s,t)=>s+(parseFloat(t.commission)||0),0).toFixed(2);
    const maxDD=calcMaxDD(trades);
    const frPct=trades.length?(trades.filter(t=>t.followedRules===true).length/trades.length*100).toFixed(0)+'%':'—';
    const a=acct();const base=getAcctBase(a);const depw=getDepWOffset(a);
    const leftRows=[
      ['Total P&L',(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2)],
      ['Total Trades',trades.length],
      ['Winners',wins.length],
      ['Losers',losses.length],
      ['Win Rate',wr+'%'],
      ['Profit Factor',pf],
      ['Expectancy','$'+exp],
      ['Avg Win','$'+(wins.length?(gp/wins.length).toFixed(2):'0')],
      ['Avg Loss','-$'+(losses.length?(gl/losses.length).toFixed(2):'0')],
      ['Best Trade','+$'+Math.max(0,...trades.map(t=>parseFloat(t.pnl)||0)).toFixed(2)],
      ['Worst Trade','-$'+Math.abs(Math.min(0,...trades.map(t=>parseFloat(t.pnl)||0))).toFixed(2)],
      ['Max Drawdown',maxDD],
      ['Total Lots',totalLots],
      ['Total Commissions','-$'+totalComm],
      ['Rules Followed',frPct],
      ['Max Win Streak',strk.maxW+' trades'],
      ['Max Loss Streak',strk.maxL+' trades'],
      ['RF/BE Trades',()=>{const rf=trades.filter(t=>isRFBE(t));const zbe=trades.filter(t=>!isRFBE(t)&&netPnL(t)===0);return `${rf.length+zbe.length} (${rf.length} RF, ${zbe.length} $0)`}],
      ['WR incl. RF/BE',()=>{const tot=trades.length;if(!tot)return '—';const wAll=trades.filter(t=>isWin(t)||isBE(t));return (wAll.length/tot*100).toFixed(1)+'%'}],
      ['WR excl. RF/BE',()=>{const decisive=trades.filter(t=>!isBE(t)&&netPnL(t)!==0);if(!decisive.length)return '—';return (decisive.filter(t=>isWin(t)).length/decisive.length*100).toFixed(1)+'%'}],
      ...(a?.type==='Live'||a?.type==='Demo'?[['Total Deposited','$'+Math.max(0,depw).toFixed(2)],['Total Withdrawn','$'+Math.abs(Math.min(0,depw)).toFixed(2)]]:['Account Balance','$'+(base+pnl).toFixed(2)]),
    ];
    const rightRows=[
      ['Total Trading Days',[...new Set(trades.map(t=>t.date))].length],
      ['Winning Days',[...new Set(trades.map(t=>t.date))].filter(d=>trades.filter(x=>x.date===d).reduce((s,t)=>s+netPnL(t),0)>0).length],
      ['Losing Days',[...new Set(trades.map(t=>t.date))].filter(d=>trades.filter(x=>x.date===d).reduce((s,t)=>s+netPnL(t),0)<0).length],
      ['Avg Daily P&L','$'+(trades.length?([...new Set(trades.map(t=>t.date))].reduce((s,d)=>s+trades.filter(x=>x.date===d).reduce((ss,t)=>ss+(parseFloat(t.pnl)||0),0),0)/[...new Set(trades.map(t=>t.date))].length||1).toFixed(2):'0')],
      ['Avg Hold Time (All)',avgHoldTime(trades)],
      ['Avg Hold Time (Wins)',avgHoldWL(trades,true)],
      ['Avg Hold Time (Losses)',avgHoldWL(trades,false)],
      ['Planned Avg R:R',()=>{const rrt=trades.filter(t=>t.plannedRR&&t.plannedRR!=='—');if(!rrt.length)return'—';const vals=rrt.map(t=>parseFloat(String(t.plannedRR).replace(/[^\d.]/g,''))||0);return'1:'+(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2)}],
      ['Actual Avg R:R',()=>{const rrt=trades.filter(t=>t.rr&&t.rr!=='—');if(!rrt.length)return'—';const vals=rrt.map(t=>parseFloat(String(t.rr).replace(/[^\d.-]/g,''))||0);return(vals.reduce((s,v)=>s+v,0)/vals.length).toFixed(2)+' avg'}],
      ['Longs Won',trades.filter(t=>(t.direction==='Buy'||t.direction==='Long')&&parseFloat(t.pnl)>0).length],
      ['Longs Lost',trades.filter(t=>(t.direction==='Buy'||t.direction==='Long')&&parseFloat(t.pnl)<0).length],
      ['Shorts Won',trades.filter(t=>(t.direction==='Sell'||t.direction==='Short')&&parseFloat(t.pnl)>0).length],
      ['Shorts Lost',trades.filter(t=>(t.direction==='Sell'||t.direction==='Short')&&parseFloat(t.pnl)<0).length],
    ];
    const rowHtml=rows=>rows.map(([k,v])=>`<tr><td>${k}</td><td>${typeof v==='function'?v():v}</td></tr>`).join('');
    document.getElementById('an-stats-left').innerHTML=rowHtml(leftRows);
    document.getElementById('an-stats-right').innerHTML=rowHtml(rightRows);
    // Day of week — HORIZONTAL bar
    const dow=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const dd=dow.map((_,i)=>trades.filter(t=>{const d=new Date(t.date).getDay();return(d===0?6:d-1)===i}).reduce((s,t)=>s+netPnL(t),0));
    makeChart('dowChart',{type:'bar',data:{labels:dow,datasets:[{data:dd,backgroundColor:dd.map(v=>v>=0?'rgba(34,197,94,.65)':'rgba(239,68,68,.6)'),borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:11}},grid:{display:false},border:{display:false}}}}});
    // Grade donut
    const gs={'A+':0,'A':0,'B':0,'C':0};trades.forEach(t=>{if(gs[t.grade]!==undefined)gs[t.grade]++});
    makeChart('gradeChart',{type:'doughnut',data:{labels:Object.keys(gs),datasets:[{data:Object.values(gs),backgroundColor:['rgba(34,197,94,.8)','rgba(59,130,246,.8)','rgba(245,158,11,.8)','rgba(239,68,68,.8)'],borderWidth:0}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right',labels:{color:c.t1,font:{size:11}}}},cutout:'60%'}});
    // Buy vs Sell
    const buys=trades.filter(t=>t.direction==='Buy'||t.direction==='Long');const sells=trades.filter(t=>t.direction==='Sell'||t.direction==='Short');
    const bWins=buys.filter(t=>isWin(t)).length,sWins=sells.filter(t=>isWin(t)).length;
    const bPnL=buys.reduce((s,t)=>s+netPnL(t),0),sPnL=sells.reduce((s,t)=>s+netPnL(t),0);
    document.getElementById('buysell-stats').innerHTML=`
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="background:var(--green-d);border:1px solid rgba(34,197,94,.2);border-radius:var(--rs);padding:12px;text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--green2);margin-bottom:8px">↑ BUY (Long)</div>
          <div style="font-size:18px;font-weight:800;color:var(--t0)">${buys.length} trades</div>
          <div style="font-size:12px;color:var(--t2);margin:4px 0">WR: ${buys.length?(bWins/buys.length*100).toFixed(0):0}%</div>
          <div style="font-size:13px;font-weight:700;color:${bPnL>=0?'var(--green2)':'var(--red2)'}">${bPnL>=0?'+$':'-$'}${Math.abs(bPnL).toFixed(2)}</div>
        </div>
        <div style="background:var(--red-d);border:1px solid rgba(239,68,68,.2);border-radius:var(--rs);padding:12px;text-align:center">
          <div style="font-size:12px;font-weight:700;color:var(--red2);margin-bottom:8px">↓ SELL (Short)</div>
          <div style="font-size:18px;font-weight:800;color:var(--t0)">${sells.length} trades</div>
          <div style="font-size:12px;color:var(--t2);margin:4px 0">WR: ${sells.length?(sWins/sells.length*100).toFixed(0):0}%</div>
          <div style="font-size:13px;font-weight:700;color:${sPnL>=0?'var(--green2)':'var(--red2)'}">${sPnL>=0?'+$':'-$'}${Math.abs(sPnL).toFixed(2)}</div>
        </div>
      </div>`;
    // Hold time
    document.getElementById('an-hold').innerHTML=`<table class="stats-table"><tr><td>Avg Hold (All)</td><td>${avgHoldTime(trades)}</td></tr><tr><td>Avg Hold (Winners)</td><td>${avgHoldWL(trades,true)}</td></tr><tr><td>Avg Hold (Losers)</td><td>${avgHoldWL(trades,false)}</td></tr><tr><td>Trades with timing</td><td>${trades.filter(t=>t.openTime&&t.closeTime).length}</td></tr></table>`;
  }
  if(tab==='pairs'){
    const pm={};trades.forEach(t=>{if(!t.symbol)return;if(!pm[t.symbol])pm[t.symbol]={w:0,n:0,p:0,l:0,lots:0,wp:0,lp:0,best:-Infinity,worst:Infinity};const pv=netPnL(t);pm[t.symbol].n++;pm[t.symbol].p+=pv;pm[t.symbol].lots+=parseFloat(t.lots)||0;if(isWin(t)){pm[t.symbol].w++;pm[t.symbol].wp+=pv;pm[t.symbol].best=Math.max(pm[t.symbol].best,pv)}if(isLoss(t)){pm[t.symbol].l++;pm[t.symbol].lp+=Math.abs(pv);pm[t.symbol].worst=Math.min(pm[t.symbol].worst,pv)}});
    const e=Object.entries(pm).sort((a,b)=>b[1].p-a[1].p);
    makeChart('pairsChart',{type:'bar',data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1].p),backgroundColor:e.map(x=>x[1].p>=0?'rgba(34,197,94,.65)':'rgba(239,68,68,.6)'),borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:11}},grid:{display:false},border:{display:false}}}}});
    document.getElementById('pairs-tbl').innerHTML=e.map(([sym,d])=>`<tr><td><strong>${sym}</strong></td><td>${d.n}</td><td class="mono" style="color:var(--accent2)">${d.n?(d.w/d.n*100).toFixed(0):0}%</td><td>${fmtP(d.p)}</td><td class="mono">${d.lots.toFixed(2)}</td><td class="mono" style="color:var(--green2)">${d.w?'$'+(d.wp/d.w).toFixed(2):'—'}</td><td class="mono" style="color:var(--red2)">${d.l?'-$'+(d.lp/d.l).toFixed(2):'—'}</td><td class="mono" style="color:var(--green2)">${d.best!==Infinity?'+$'+d.best.toFixed(2):'—'}</td><td class="mono" style="color:var(--red2)">${d.worst!==Infinity?'-$'+Math.abs(d.worst).toFixed(2):'—'}</td></tr>`).join('');
  }
  if(tab==='sessions'){
    const sm={};DB.sessions.forEach(s=>sm[s.name]={w:0,n:0,p:0,lots:0});
    trades.forEach(t=>{if(!t.session)return;if(!sm[t.session])sm[t.session]={w:0,n:0,p:0,lots:0};sm[t.session].n++;sm[t.session].p+=netPnL(t);sm[t.session].lots+=parseFloat(t.lots)||0;if(isWin(t))sm[t.session].w++});
    const e=Object.entries(sm).filter(([,d])=>d.n>0);
    makeChart('sessChart',{type:'bar',data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1].p),backgroundColor:e.map(x=>x[1].p>=0?'rgba(34,197,94,.65)':'rgba(239,68,68,.6)'),borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:12}},grid:{display:false},border:{display:false}}}}});
    document.getElementById('sess-details').innerHTML=e.map(([sess,d])=>`<div style="padding:9px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;font-weight:600;color:var(--t0)">${sess}</div><div style="font-size:12px;color:var(--t2)">${d.n} trades · WR: ${d.n?(d.w/d.n*100).toFixed(0):0}%</div></div><div style="text-align:right">${fmtP(d.p)}</div></div>`).join('');
  }
  if(tab==='setups'){
    const sm={};trades.forEach(t=>{if(!t.setup)return;if(!sm[t.setup])sm[t.setup]={w:0,n:0,p:0};sm[t.setup].n++;sm[t.setup].p+=netPnL(t);if(isWin(t))sm[t.setup].w++});
    const e=Object.entries(sm).sort((a,b)=>b[1].p-a[1].p);
    makeChart('setupsChart',{type:'bar',data:{labels:e.map(x=>x[0].split(' ')[0]),datasets:[{data:e.map(x=>x[1].p),backgroundColor:e.map(x=>x[1].p>=0?'rgba(245,158,11,.7)':'rgba(239,68,68,.6)'),borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:10}},grid:{display:false},border:{display:false}}}}});
  }
  if(tab==='time'){
    const hd=Array.from({length:24},(_,h)=>trades.filter(t=>parseInt((t.openTime||'0:0').split(':')[0])===h).reduce((s,t)=>s+netPnL(t),0));
    makeChart('hourChart',{type:'bar',data:{labels:Array.from({length:24},(_,h)=>h.toString().padStart(2,'0')+':00'),datasets:[{data:hd,backgroundColor:hd.map(v=>v>=0?'rgba(34,197,94,.6)':'rgba(239,68,68,.55)'),borderRadius:4,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:9},maxRotation:45},grid:{display:false},border:{display:false}},y:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}}}}});
    // Monthly P&L
    const mMap={};trades.forEach(t=>{const ym=t.date.slice(0,7);mMap[ym]=(mMap[ym]||0)+netPnL(t)});
    const me=Object.entries(mMap).sort((a,b)=>a[0].localeCompare(b[0]));
    makeChart('monthChart',{type:'bar',data:{labels:me.map(x=>x[0]),datasets:[{data:me.map(x=>x[1]),backgroundColor:me.map(x=>x[1]>=0?'rgba(34,197,94,.65)':'rgba(239,68,68,.6)'),borderRadius:5,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10}},grid:{display:false},border:{display:false}},y:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}}}}});
  }
  if(tab==='emotions'){
    const em={};trades.forEach(t=>{if(!t.emotion)return;const emotions=t.emotion.split(', ').filter(Boolean);emotions.forEach(emo=>{if(!em[emo])em[emo]={c:0,p:0};em[emo].c++;em[emo].p+=netPnL(t)})});
    const e=Object.entries(em).sort((a,b)=>b[1].c-a[1].c);
    const emoColors=['rgba(245,158,11,.8)','rgba(34,197,94,.7)','rgba(239,68,68,.7)','rgba(59,130,246,.7)','rgba(167,139,250,.7)','rgba(251,146,60,.7)','rgba(20,184,166,.7)','rgba(244,63,94,.7)'];
    makeChart('emoChart',{type:'bar',data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1].c),backgroundColor:emoColors,borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:10}},grid:{display:false},border:{display:false}}}}});
    makeChart('emoPnlChart',{type:'bar',data:{labels:e.map(x=>x[0]),datasets:[{data:e.map(x=>x[1].p),backgroundColor:e.map(x=>x[1].p>=0?'rgba(34,197,94,.7)':'rgba(239,68,68,.7)'),borderRadius:5,borderSkipped:false}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'}},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.t1,font:{size:10}},grid:{display:false},border:{display:false}}}}});
    document.getElementById('emo-tbl').innerHTML=e.map(([emo,d])=>`<div style="padding:7px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:13px;color:var(--t0)">${emo}</div><div style="font-size:12px;color:var(--t2)">${d.c} trades · WR ${d.c?(trades.filter(t=>t.emotion?.includes(emo)&&parseFloat(t.pnl)>0).length/d.c*100).toFixed(0):0}%</div></div>${fmtP(d.p)}</div>`).join('');
  }
  if(tab==='calendar'){
    renderAnCalendar(trades);
    renderWeeklySummary(trades);
  }
}

function renderAnEquity(mode,trades){
  // Use same logic as dashboard P&L curve: sort by date+time, cumulative from 0
  trades=trades||getFilteredAnalyticsTrades();
  const sorted=[...trades].sort((a,b)=>{
    const da=new Date(a.date+'T'+(a.openTime||'12:00'));
    const db=new Date(b.date+'T'+(b.openTime||'12:00'));
    return da-db;
  });
  const c=CL();
  let cum=0;
  const labels=[],vals=[],tooltipD=[];
  // Start point at first trade date (matches dashboard)
  if(sorted.length){labels.push(sorted[0].date.slice(5));vals.push(0);tooltipD.push(sorted[0].date)}
  sorted.forEach(t=>{
    cum+=netPnL(t);
    labels.push(t.date.slice(5));
    vals.push(parseFloat(cum.toFixed(2)));
    tooltipD.push(t.date);
  });
  const isUp=vals[vals.length-1]>=0;const lc=isUp?'#22c55e':'#ef4444';
  const canvas=document.getElementById('anEquityChart');if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,180);
  grad.addColorStop(0,isUp?'rgba(34,197,94,.15)':'rgba(239,68,68,.15)');
  grad.addColorStop(1,'transparent');
  makeChart('anEquityChart',{type:'line',data:{labels,datasets:[{data:vals,borderColor:lc,backgroundColor:grad,borderWidth:2,fill:true,tension:.4,pointRadius:vals.length<=20?3:0,pointHoverRadius:5,pointBackgroundColor:lc,pointBorderColor:'transparent'}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:300},interaction:{mode:'index',intersect:false},scales:{x:{ticks:{color:c.text,font:{size:10},maxTicksLimit:10,maxRotation:0},grid:{color:c.grid},border:{display:false}},y:{ticks:{color:c.text,font:{size:10,family:'Geist Mono'},callback:v=>(v>=0?'+$':'-$')+Math.abs(v).toFixed(0)},grid:{color:c.grid},border:{display:false}}},plugins:{legend:{display:false},tooltip:{...chartTooltip(),callbacks:{title:i=>tooltipD[i[0]?.dataIndex]||i[0]?.label,label:i=>` P&L: ${i.raw>=0?'+$':'-$'}${Math.abs(i.raw).toFixed(2)}`}}}}});
}

function calcMaxDD(trades){
  const sorted=[...trades].sort((a,b)=>a.date.localeCompare(b.date));
  let peak=0,maxDD=0,cum=0;
  sorted.forEach(t=>{cum+=netPnL(t);if(cum>peak)peak=cum;const dd=peak-cum;if(dd>maxDD)maxDD=dd});
  return maxDD>0?'-$'+maxDD.toFixed(2):'—';
}

// Analytics Calendar
function anCalMove(dir){st.anCalM+=dir;if(st.anCalM>11){st.anCalM=0;st.anCalY++}if(st.anCalM<0){st.anCalM=11;st.anCalY--}renderAnalytics('calendar')}
function renderAnCalendar(trades){
  const y=st.anCalY,m=st.anCalM;
  const mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dw=['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Wk'];
  document.getElementById('an-cal-label').textContent=`${mo[m]} ${y}`;
  // 8-col grid: 7 days + weekly total
  document.getElementById('an-cal-head').style.gridTemplateColumns='repeat(7,1fr) 64px';
  document.getElementById('an-cal-head').innerHTML=dw.map((d,i)=>`<div class="cal-hdd" style="${i===7?'color:var(--accent2)':''}">${d}</div>`).join('');
  const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate(),off=(fd+6)%7;
  const today=new Date();
  const pm={},cm={};
  trades.forEach(t=>{if(!t.date)return;const p=t.date.split('-').map(Number);if(p[0]===y&&p[1]-1===m){pm[p[2]]=(pm[p[2]]||0)+netPnL(t);cm[p[2]]=(cm[p[2]]||0)+1}});
  
  let html=Array(off).fill('<div></div>').join('');
  let dayCount=off;
  let weekPnL=0;
  
  for(let d=1;d<=dim;d++){
    const p=pm[d];const isT=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+=`<div class="cal-day ${p>0?'win':p<0?'loss':''} ${isT?'today':''} ${p!==undefined?'ht':''}" onclick="showDayDetail(${y},${m+1},${d})" title="${p!==undefined?`${cm[d]||0} trade(s): ${p>=0?'+$':'-$'}${Math.abs(p).toFixed(2)}`:''}">
      <div class="cal-dn">${d}</div>
      ${p!==undefined?`<div class="cal-dp">${p>=0?'+$':'-$'}${Math.abs(p).toFixed(0)}</div>`:''}
    </div>`;
    weekPnL+=(p||0);
    dayCount++;
    // Sunday = end of week (position 7 in Mon-first grid), insert weekly total
    const dow=(new Date(y,m,d).getDay()+6)%7; // 0=Mon,6=Sun
    if(dow===6||d===dim){
      // Pad remaining cells if end of month mid-week
      if(d===dim&&dow<6){const rem=6-dow;html+=Array(rem).fill('<div></div>').join('')}
      const cls=weekPnL>0?'wk-pos':weekPnL<0?'wk-neg':'';
      html+=`<div class="cal-week-total ${cls}"><div class="wk-lbl">Week</div><div class="wk-val">${weekPnL>=0?'+$':'-$'}${Math.abs(weekPnL).toFixed(0)}</div></div>`;
      weekPnL=0;
    }
  }
  
  const grid=document.getElementById('an-cal-grid');
  grid.style.gridTemplateColumns='repeat(7,1fr) 64px';
  grid.innerHTML=html;
}

function showDayDetail(y,m,d){
  const dateStr=`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const trades=activeTrades().filter(t=>t.date===dateStr);
  const detail=document.getElementById('an-day-detail');
  // title: `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]}`;
  if(!trades.length){detail.innerHTML='<div class="empty" style="padding:20px"><div class="empty-tl">No trades</div></div>';return}
  const dayPnL=trades.reduce((s,t)=>s+netPnL(t),0);
  detail.innerHTML=`<div style="padding:10px 13px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center"><span style="font-size:12px;color:var(--t2)">${trades.length} trades</span>${fmtP(dayPnL)}</div>`+trades.map(t=>`<div style="padding:9px 13px;border-bottom:1px solid var(--border);cursor:pointer" onclick="C('modal-view-trade');viewTrade('${t.id}')"><div style="display:flex;align-items:center;gap:7px"><strong style="font-size:12.5px;color:var(--t0)">${t.symbol}</strong>${dirBadge(t.direction)}<span style="font-size:10px;color:var(--gold2)">${t.setup?.split(' ')[0]||''}</span><span style="margin-left:auto">${fmtP(netPnL(t))}</span></div><div style="font-size:11.5px;color:var(--t2);margin-top:2px">${t.session||'—'} · ${t.openTime||'—'}</div></div>`).join('');
}
function renderWeeklySummary(trades){
  const el=document.getElementById('an-weekly-summary');if(!el)return;
  const y=st.anCalY,m=st.anCalM;
  const dim=new Date(y,m+1,0).getDate();
  const weeks=[];let w=[];const fd=(new Date(y,m,1).getDay()+6)%7;
  for(let d=1;d<=dim;d++){
    const dow=(new Date(y,m,d).getDay()+6)%7;
    if(dow===0&&w.length)weeks.push(w),w=[];
    w.push(d);
  }
  if(w.length)weeks.push(w);
  el.innerHTML=weeks.map((wk,i)=>{
    const wTrades=trades.filter(t=>{const p=t.date.split('-').map(Number);return p[0]===y&&p[1]-1===m&&wk.includes(p[2])});
    const wPnL=wTrades.reduce((s,t)=>s+netPnL(t),0);
    const wWins=wTrades.filter(t=>parseFloat(t.pnl)>0).length;
    return`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
      <div>
        <div style="font-size:13.5px;font-weight:700;color:var(--t0)">Week ${i+1}</div>
        <div style="font-size:11.5px;color:var(--t2)">${wk[0]}–${wk[wk.length-1]} · ${wTrades.length} trades · WR ${wTrades.length?(wWins/wTrades.length*100).toFixed(0):0}%</div>
      </div>
      <div style="font-family:'Geist Mono',monospace;font-size:15px;font-weight:800;color:${wPnL>=0?'var(--green2)':'var(--red2)'}">${wPnL>=0?'+$':'-$'}${Math.abs(wPnL).toFixed(2)}</div>
    </div>`;
  }).join('')||'<div style="color:var(--t2);font-size:13px;padding:10px">No trades this month</div>';
}

// ═══════════════════════════════════════════════════════════
// ACCOUNTS
// ═══════════════════════════════════════════════════════════
function showPFFields(){
  const t=document.getElementById('a-type').value;
  document.getElementById('pf-fields').style.display=t==='Prop Firm'?'block':'none';
  document.getElementById('depw-section').style.display=t!=='Prop Firm'?'block':'none';
}
function selAcctColor(c,el){st.acctColor=c;document.getElementById('a-color').value=c;document.querySelectorAll('.cdot').forEach(d=>d.classList.remove('sel'));el.classList.add('sel')}
function openAddAcct(){
  st.editAcctId=null;st.depwList=[];
  document.getElementById('acct-modal-title').textContent='Add Account';
  ['a-name','a-broker','a-balance','a-cur-bal','a-fresh-date','a-daily-dd','a-max-dd','a-profit-target','a-min-days'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});
  document.getElementById('a-type').value='Live';document.getElementById('a-currency').value='USD';
  document.getElementById('a-color').value='#3b82f6';document.getElementById('pf-fields').style.display='none';
  document.getElementById('depw-section').style.display='block';
  st.acctColor='#3b82f6';document.querySelectorAll('.cdot').forEach((d,i)=>d.classList.toggle('sel',i===0));
  renderDepWList();O('modal-acct-add');
}
function renderDepWList(){
  const list=document.getElementById('depw-list');if(!list)return;
  if(!st.depwList.length){list.innerHTML='<div style="font-size:12px;color:var(--t2);padding:5px">No deposits/withdrawals.</div>';return}
  list.innerHTML=st.depwList.map((d,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)"><span style="font-size:11.5px;color:var(--t2)">${d.date}</span><span class="badge ${d.type==='deposit'?'bg':'br'}" style="font-size:9px">${d.type}</span><span class="mono" style="font-size:12px;flex:1">${d.type==='deposit'?'+$':'-$'}${Math.abs(d.amount).toFixed(2)}</span><button class="btn-ic" onclick="removeDepW(${i})" style="padding:2px 5px;font-size:11px">✕</button></div>`).join('');
}
function addDepW(){
  const amt=parseFloat(document.getElementById('depw-amount')?.value)||0;
  const type=document.getElementById('depw-type')?.value||'deposit';
  const date=document.getElementById('depw-date')?.value||todayStr();
  if(!amt){toast('Enter amount','','warn');return}
  st.depwList.push({amount:amt,type,date});
  document.getElementById('depw-amount').value='';renderDepWList();
}
function removeDepW(i){st.depwList.splice(i,1);renderDepWList()}
function saveAcct(){
  const name=document.getElementById('a-name').value.trim();
  if(!name){toast('Name required','','warn');return}
  const type=document.getElementById('a-type').value;
  const pfRules=type==='Prop Firm'?{dailyDD:parseFloat(document.getElementById('a-daily-dd').value)||0,maxDD:parseFloat(document.getElementById('a-max-dd').value)||0,profitTarget:parseFloat(document.getElementById('a-profit-target').value)||0,minDays:parseInt(document.getElementById('a-min-days').value)||0,tz:document.getElementById('a-pf-tz').value||'UTC'}:{};
  const a={id:st.editAcctId||uid(),name,type,balance:parseFloat(document.getElementById('a-balance').value)||0,curBalance:parseFloat(document.getElementById('a-cur-bal').value)||null,freshDate:document.getElementById('a-fresh-date').value||null,currency:document.getElementById('a-currency').value,broker:document.getElementById('a-broker').value,color:document.getElementById('a-color').value||st.acctColor,pfRules,depw:[...st.depwList]};
  if(st.editAcctId){const i=DB.accounts.findIndex(x=>x.id===st.editAcctId);if(i!==-1)DB.accounts[i]={...DB.accounts[i],...a}}else DB.accounts.push(a);
  save('accounts');C('modal-acct-add');renderAccounts();updateSidebar();populateFilters();toast('Account saved',name,'success');
}
function deleteAcct(id){if(DB.accounts.length===1){toast('Cannot delete','Keep at least one','warn');return}confirmAction('Delete Account','Delete this account and all its trades?',()=>{DB.accounts=DB.accounts.filter(a=>a.id!==id);DB.trades=DB.trades.filter(t=>t.acctId!==id);if(st.activeAcctId===id){st.activeAcctId=DB.accounts[0]?.id;S.set('activeAcct',st.activeAcctId)}save('accounts');save('trades');renderAccounts();updateSidebar()})}
function editAcct(id){
  st.editAcctId=id;const a=DB.accounts.find(x=>x.id===id);if(!a)return;
  st.depwList=[...((a.depw)||[])];
  document.getElementById('acct-modal-title').textContent='Edit Account';
  document.getElementById('a-name').value=a.name;document.getElementById('a-type').value=a.type;
  document.getElementById('a-balance').value=a.balance;document.getElementById('a-cur-bal').value=a.curBalance||'';
  document.getElementById('a-fresh-date').value=a.freshDate||'';document.getElementById('a-currency').value=a.currency;
  document.getElementById('a-broker').value=a.broker||'';document.getElementById('a-color').value=a.color;st.acctColor=a.color;
  document.getElementById('pf-fields').style.display=a.type==='Prop Firm'?'block':'none';
  document.getElementById('depw-section').style.display=a.type!=='Prop Firm'?'block':'none';
  if(a.pfRules){document.getElementById('a-daily-dd').value=a.pfRules.dailyDD||'';document.getElementById('a-max-dd').value=a.pfRules.maxDD||'';document.getElementById('a-profit-target').value=a.pfRules.profitTarget||'';document.getElementById('a-min-days').value=a.pfRules.minDays||'';document.getElementById('a-pf-tz').value=a.pfRules.tz||'UTC'}
  renderDepWList();
  O('modal-acct-add');
}
function renderAccounts(){
  const grid=document.getElementById('accounts-grid');
  grid.innerHTML=DB.accounts.map(a=>{
    let trades=DB.trades.filter(t=>t.acctId===a.id);
    if(a.freshDate)trades=trades.filter(t=>t.date>=a.freshDate);
    const pnl=trades.reduce((s,t)=>s+netPnL(t),0);
    const wins=trades.filter(t=>parseFloat(t.pnl)>0).length;
    const wr=trades.length?(wins/trades.length*100).toFixed(1):0;
    const lots=trades.reduce((s,t)=>s+(parseFloat(t.lots)||0),0).toFixed(2);
    const depwOffset=getDepWOffset(a);
    const base=getAcctBase(a);
    const equity=base+pnl;
    const isActive=a.id===st.activeAcctId;
    let pfHtml='';
    if(a.type==='Prop Firm'&&a.pfRules){
      const pf=a.pfRules;const todayPnL=DB.trades.filter(t=>t.acctId===a.id&&t.date===todayStr()).reduce((s,t)=>s+netPnL(t),0);
      const lossT=Math.abs(Math.min(0,todayPnL));const totalLoss=Math.abs(Math.min(0,pnl));
      pfHtml=`<div class="pf-tr">${pf.dailyDD?`<div class="pf-row"><span class="pf-lbl">Daily DD</span><span class="pf-val" style="color:${lossT/base*100>=pf.dailyDD?'var(--red2)':'var(--t0)'}">$${lossT.toFixed(2)} / ${pf.dailyDD}%</span></div><div class="prog"><div class="prog-f" style="width:${Math.min(100,pf.dailyDD?lossT/base*100/pf.dailyDD*100:0)}%;background:${lossT/base*100>=pf.dailyDD?'var(--red)':'var(--green)'}"></div></div>`:''}${pf.maxDD?`<div class="pf-row" style="margin-top:7px"><span class="pf-lbl">Max DD</span><span class="pf-val">$${totalLoss.toFixed(2)} / ${pf.maxDD}%</span></div><div class="prog"><div class="prog-f" style="width:${Math.min(100,pf.maxDD?totalLoss/base*100/pf.maxDD*100:0)}%;background:${totalLoss/base*100>=pf.maxDD?'var(--red)':'var(--accent)'}"></div></div>`:''}${pf.profitTarget?`<div class="pf-row" style="margin-top:7px"><span class="pf-lbl">Target</span><span class="pf-val" style="color:var(--green2)">$${Math.max(0,pnl).toFixed(2)} / ${pf.profitTarget}%</span></div><div class="prog"><div class="prog-f" style="width:${Math.min(100,pf.profitTarget&&base?Math.max(0,pnl/base*100/pf.profitTarget*100):0)}%;background:var(--green)"></div></div>`:''}</div>`;
    }
    const mbox2=(l,v,c)=>`<div style="background:var(--bg3);border-radius:var(--rxs);padding:8px;text-align:center"><div style="font-size:10px;color:var(--t2);text-transform:uppercase;letter-spacing:.4px;margin-bottom:2px">${l}</div><div style="font-weight:700;font-size:12.5px;color:${c};font-family:'Geist Mono',monospace">${v}</div></div>`;
    return`<div style="background:var(--card);border:1px solid ${isActive?a.color:'var(--border)'};border-radius:var(--r);padding:16px;transition:all .2s">
      <div style="display:flex;align-items:flex-start;gap:9px;margin-bottom:12px">
        <div style="width:38px;height:38px;border-radius:9px;background:${a.color}20;display:flex;align-items:center;justify-content:center;font-size:17px;border:1px solid ${a.color}30;flex-shrink:0">${a.type==='Prop Firm'?'🏆':a.type==='Demo'?'🎮':a.type==='Paper'?'📝':'💼'}</div>
        <div style="flex:1"><div style="font-weight:700;font-size:14px;color:var(--t0)">${a.name}</div><div style="font-size:12px;color:var(--t2);margin-top:1px">${a.type} · ${a.broker||'—'} · ${a.currency}</div>${a.freshDate?`<div style="font-size:9.5px;color:var(--accent2);margin-top:2px">⚡ From ${a.freshDate}</div>`:''}</div>
        ${isActive?'<span class="badge bg" style="font-size:9px">ACTIVE</span>':''}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-bottom:10px">
        ${mbox2('Starting Bal','$'+(parseFloat(a.balance)||0).toFixed(0),'var(--t1)')}
        ${mbox2('Total Deposited','+$'+(_a_dep=((a.depw||[]).filter(d=>d.type==='deposit').reduce((s,d)=>s+(parseFloat(d.amount)||0),0))).toFixed(0),'var(--green2)')}
        ${mbox2('Equity',a.currency+' '+equity.toFixed(2),pnl>=0?'var(--green2)':'var(--red2)')}
        ${mbox2('Trade P&L',(pnl>=0?'+$':'-$')+Math.abs(pnl).toFixed(2),pnl>=0?'var(--green2)':'var(--red2)')}
        ${mbox2('Win Rate',wr+'%','var(--accent2)')}
        ${mbox2('Withdrawal',(_a_wit=((a.depw||[]).filter(d=>d.type==='withdrawal').reduce((s,d)=>s+(parseFloat(d.amount)||0),0)))>0?'-$'+_a_wit.toFixed(0):'$0','var(--t2)')}
      </div>
      <div style="font-size:12px;color:var(--t2);margin-bottom:10px">${trades.length} trades · ${lots} lots${(a.depw&&a.depw.length)?` · D/W: ${a.depw.length} entries`:''}</div>
      ${pfHtml}
      <div style="display:flex;gap:5px;margin-top:10px">
        <button class="btn btn-ok btn-sm" onclick="switchAcct('${a.id}')">Set Active</button>
        <button class="btn btn-s btn-sm" onclick="editAcct('${a.id}')">Edit</button>
        ${!isActive?`<button class="btn btn-d btn-sm" onclick="deleteAcct('${a.id}')">Delete</button>`:''}
      </div>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// RULES PAGE
// ═══════════════════════════════════════════════════════════
function renderRules(){
  const today=todayStr();
  const todayT=DB.trades.filter(t=>t.acctId===st.activeAcctId&&t.date===today);
  const todayPnL=todayT.reduce((s,t)=>s+netPnL(t),0);
  const lossToday=Math.abs(Math.min(0,todayPnL));
  const rl=document.getElementById('rules-list');
  rl.innerHTML=DB.rules.map(r=>{
    let viol=false;
    if(r.type==='daily_loss'&&r.val>0&&lossToday>=r.val)viol=true;
    if(r.type==='max_trades'&&r.val>0&&todayT.length>r.val)viol=true;
    const aName=r.acctId?DB.accounts.find(x=>x.id===r.acctId)?.name||'?':'Global';
    return`<div class="rule-item ${viol?'viol':'ok'}">
      <div class="rule-dot" style="background:${viol?'var(--red)':'var(--green)'}"></div>
      <div style="flex:1"><div style="font-size:13px;font-weight:500;color:var(--t0)">${ruleLabel(r.type)}: ${r.type==='custom'?r.text:r.val}</div><div style="font-size:10.5px;color:var(--t2)">${aName}</div></div>
      ${viol?'<span class="badge br" style="font-size:9px">BREACHED</span>':''}
      <button class="btn-ic" onclick="deleteRule('${r.id}')">✕</button>
    </div>`;
  }).join('')||'<div style="color:var(--t2);font-size:12.5px;padding:8px">No rules set.</div>';
  const ra=document.getElementById('rule-acct');
  if(ra)ra.innerHTML='<option value="">Global</option>'+DB.accounts.map(a=>`<option value="${a.id}">${a.name}</option>`).join('');
  const cl=document.getElementById('global-chklist');
  cl.innerHTML=DB.checklist.map((item,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:3px"><span style="font-size:12.5px;flex:1">${item}</span><button class="btn-ic" onclick="removeCLItem(${i})">✕</button></div>`).join('');
  // Custom setups list
  const sl=document.getElementById('custom-setups-list');
  sl.innerHTML=DB.setups.map((s,i)=>`<div class="setup-tag">${s}<span class="setup-tag-x" onclick="removeSetup(${i})">✕</span></div>`).join('');
  // Sessions
  const sc=document.getElementById('sessions-config-list');
  sc.innerHTML=DB.sessions.map(s=>`<div style="display:flex;align-items:center;gap:9px;padding:7px 10px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);margin-bottom:3px"><div style="width:9px;height:9px;border-radius:50%;background:${s.color}"></div><div style="flex:1"><div style="font-size:13px;color:var(--t0)">${s.name}</div><div style="font-size:11.5px;color:var(--t2)">${gmtToUserTZ(s.start)}–${gmtToUserTZ(s.end)} ${tzLabel()}</div></div><button class="btn-ic" onclick="editSession('${s.id}')">✎</button><button class="btn-ic" onclick="deleteSession('${s.id}')">✕</button></div>`).join('');
  renderPairTags();
  // Today status
  document.getElementById('today-status').innerHTML=`<div style="background:var(--bg2);border:1px solid var(--border);border-radius:var(--rs);padding:12px">${[['Trades today',todayT.length],['Today P&L',(todayPnL>=0?'+$':'-$')+Math.abs(todayPnL).toFixed(2)],['Today loss','-$'+lossToday.toFixed(2)]].map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px;color:var(--t2)">${k}</span><span class="mono" style="font-size:12px">${v}</span></div>`).join('')}</div>`;
  const vl=document.getElementById('viol-log');
  if(DB.violations.length)vl.innerHTML=DB.violations.slice(0,10).map((v,i)=>`<div style="padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:7px;align-items:center"><span style="color:var(--t2);font-size:11.5px;font-family:'Geist Mono';flex-shrink:0">${v.date}</span><span style="font-size:12px;color:var(--red2);flex:1">${v.msg}</span><button onclick="delViol(${i})" style="background:none;border:none;color:var(--t2);cursor:pointer;font-size:13px">✕</button></div>`).join('');
}
function ruleLabel(t){return{daily_loss:'Max Daily Loss',daily_loss_pct:'Max Daily Loss %',max_trades:'Max Trades/Day',min_rr:'Min R:R',max_lot:'Max Lot Size',custom:'Custom'}[t]||t}
function showRuleFields(){const t=document.getElementById('rule-type').value;document.getElementById('rule-val-g').style.display=t==='custom'?'none':'block';document.getElementById('rule-txt-g').style.display=t==='custom'?'block':'none'}
function saveRule(){
  const type=document.getElementById('rule-type').value;const val=parseFloat(document.getElementById('rule-val').value)||0;const text=document.getElementById('rule-text').value.trim();
  if(type!=='custom'&&!val){toast('Enter value','','warn');return}if(type==='custom'&&!text){toast('Enter text','','warn');return}
  DB.rules.push({id:uid(),type,val,text,acctId:document.getElementById('rule-acct').value});
  save('rules');C('modal-rule-add');renderRules();checkRules();toast('Rule added','','success');
}
function deleteRule(id){DB.rules=DB.rules.filter(r=>r.id!==id);save('rules');renderRules();checkRules()}
function delViol(i){DB.violations.splice(i,1);S.set('violations',DB.violations);renderRules()}
function addCLItem(){const t=prompt('Checklist item:');if(!t)return;DB.checklist.push(t);save('checklist');renderRules();renderModalChecklist()}
function removeCLItem(i){DB.checklist.splice(i,1);save('checklist');renderRules()}
// Custom setups
function addSetup(){const inp=document.getElementById('new-setup-inp');const v=inp.value.trim();if(!v)return;if(!DB.setups.includes(v)){DB.setups.push(v);save('setups')}inp.value='';renderRules();const sel=document.getElementById('t-setup');if(sel)sel.innerHTML=DB.setups.map(s=>`<option>${s}</option>`).join('')}
function removeSetup(i){DB.setups.splice(i,1);save('setups');renderRules();const sel=document.getElementById('t-setup');if(sel)sel.innerHTML=DB.setups.map(s=>`<option>${s}</option>`).join('')}
// Pairs
function addPair(e){if(e.key!=='Enter')return;const v=e.target.value.trim().toUpperCase();if(!v||DB.pairs.includes(v)){e.target.value='';return}DB.pairs.push(v);save('pairs');e.target.value='';renderPairTags();const sel=document.getElementById('t-symbol');if(sel)sel.innerHTML=DB.pairs.map(p=>`<option>${p}</option>`).join('')}
function removePair(p){DB.pairs=DB.pairs.filter(x=>x!==p);save('pairs');renderPairTags()}
function renderPairTags(){const wrap=document.getElementById('pairs-wrap');const inp=document.getElementById('pairs-inp');if(!wrap)return;wrap.innerHTML='';DB.pairs.forEach(p=>{const el=document.createElement('div');el.className='tag';el.innerHTML=`${p}<span class="tag-x" onclick="removePair('${p}')">✕</span>`;wrap.appendChild(el)});wrap.appendChild(inp)}
// Sessions
function saveSession(){const name=document.getElementById('sess-name-inp').value.trim();const start=document.getElementById('sess-start').value;const end=document.getElementById('sess-end').value;const color=document.getElementById('sess-color').value;if(!name||!start||!end){toast('Fill all fields','','warn');return}const s={id:st.editSessId||uid(),name,start,end,color};if(st.editSessId){const i=DB.sessions.findIndex(x=>x.id===st.editSessId);if(i!==-1)DB.sessions[i]=s}else DB.sessions.push(s);save('sessions');C('modal-session-add');renderRules();const sel=document.getElementById('t-session');if(sel)sel.innerHTML='<option value="">No Session</option>'+DB.sessions.map(s=>`<option>${s.name}</option>`).join('');toast('Session saved',name,'success')}
function editSession(id){st.editSessId=id;const s=DB.sessions.find(x=>x.id===id);if(!s)return;document.getElementById('sess-modal-title').textContent='Edit Session';document.getElementById('sess-name-inp').value=s.name;document.getElementById('sess-start').value=s.start;document.getElementById('sess-end').value=s.end;document.getElementById('sess-color').value=s.color;O('modal-session-add')}
function deleteSession(id){DB.sessions=DB.sessions.filter(s=>s.id!==id);save('sessions');renderRules()}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function loadSettings(){
  document.getElementById('set-name').value=DB.settings.name||'';
  document.getElementById('set-strat').value=DB.settings.strategy||'';
  document.getElementById('set-tz').value=DB.settings.tz||'Asia/Kolkata';
  document.getElementById('set-cur').value=DB.settings.currency||'USD';
  document.querySelectorAll('[data-t]').forEach(el=>el.classList.toggle('active',el.dataset.t===DB.settings.theme));
  const togBE=document.getElementById('tog-be-win');
  if(togBE)togBE.classList.toggle('on',!!DB.settings.beAsWin);
}
function toggleBEasWin(){
  DB.settings.beAsWin=!DB.settings.beAsWin;
  S.set('settings',DB.settings);
  const tog=document.getElementById('tog-be-win');
  if(tog)tog.classList.toggle('on',!!DB.settings.beAsWin);
  renderDash();
  toast(DB.settings.beAsWin?'BE counts as Win':'BE counts as Loss','','success');
}
function saveSettings(){
  DB.settings.name=document.getElementById('set-name').value;DB.settings.strategy=document.getElementById('set-strat').value;
  DB.settings.tz=document.getElementById('set-tz').value;DB.settings.currency=document.getElementById('set-cur').value;
  S.set('settings',DB.settings);updateSidebar();
}
function setTheme(t){
  DB.settings.theme=t;S.set('settings',DB.settings);
  document.documentElement.setAttribute('data-theme',t);
  document.querySelectorAll('[data-t]').forEach(el=>el.classList.toggle('active',el.dataset.t===t));
  setTimeout(()=>renderDash(),120);toast('Theme',t,'success');
}

// ═══════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════
function exportJSON(backup=false){
  const data={accounts:DB.accounts,trades:DB.trades,rules:DB.rules,sessions:DB.sessions,checklist:DB.checklist,pairs:DB.pairs,setups:DB.setups,settings:DB.settings,violations:DB.violations,_activeAcctId:st.activeAcctId,_version:4,_savedAt:new Date().toISOString()};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download=backup?`FXJournal_${todayStr()}.json`:'FXJournal.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(a.href);
  markSaved();toast('Saved',a.download,'success');
}
function importData(e){
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(d.accounts)DB.accounts=d.accounts;
      if(d.trades)DB.trades=normDates(d.trades).map(t=>({...t,direction:t.direction==='Long'?'Buy':t.direction==='Short'?'Sell':t.direction}));
      if(d.rules)DB.rules=d.rules;if(d.sessions)DB.sessions=d.sessions;
      if(d.checklist)DB.checklist=d.checklist;if(d.pairs)DB.pairs=d.pairs;
      if(d.setups)DB.setups=d.setups;if(d.settings)DB.settings=d.settings;
      if(d.violations)DB.violations=d.violations;
      saveAll();
      if(DB.settings.theme)document.documentElement.setAttribute('data-theme',DB.settings.theme);
      const _importedAcctId=d._activeAcctId;if(_importedAcctId&&DB.accounts.find(a=>a.id===_importedAcctId)){st.activeAcctId=_importedAcctId}else if(DB.accounts.length){st.activeAcctId=DB.accounts[0].id}S.set('activeAcct',st.activeAcctId);
      renderDash();updateSidebar();populateFilters();markSaved();
      toast('Imported',`${DB.trades.length} trades loaded`,'success');
    }catch(err){toast('Import failed',err.message,'error')}
  };
  r.readAsText(f);e.target.value='';
}
function exportCSV(){
  const t=activeTrades();
  const hdr='Date,Account,Pair,Direction,Setup,Session,Entry,Exit,SL,TP,Lots,Gross P&L,Net P&L,Commission,Planned R:R,Actual R:R,Grade,Emotion,Rules,Notes,Journal Notes\n';
  const rows=t.map(x=>[x.date,DB.accounts.find(a=>a.id===x.acctId)?.name||'',x.symbol,x.direction,`"${x.setup||''}"`,x.session,x.entry,x.exitPrice||'',x.sl,x.tp,x.lots,x.pnl,((parseFloat(x.pnl)||0)-(parseFloat(x.commission)||0)).toFixed(2),x.commission||0,x.plannedRR||'',x.rr||'',x.grade||'',x.emotion||'',x.followedRules===true?'Yes':x.followedRules===false?'No':'',`"${(x.notes||'').replace(/"/g,"''")}"`,`"${(x.journalNotes||'').replace(/"/g,"''")}"`.replace(/\n/g,' | '),].join(',')).join('\n');
  const blob=new Blob([hdr+rows],{type:'text/csv'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='trades_'+todayStr()+'.csv';a.click();
  toast('Exported',t.length+' trades','success');
}
function clearAll(){confirmAction('⚠ Clear All Data','Delete ALL data permanently?',()=>{Object.keys(localStorage).filter(k=>k.startsWith('fxj_')||k.startsWith('kj2_')||k.startsWith('kj_')).forEach(k=>localStorage.removeItem(k));location.reload()})}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
function selTF(tf){
  st.tradeTF=tf;
  document.querySelectorAll('.tf-chip').forEach(c=>c.classList.toggle('sel',c.textContent===tf));
  document.getElementById('t-tf').value=tf;
}

function selSessChip(sess){
  st.tradeSess=sess;
  document.querySelectorAll('.sess-chip').forEach(c=>c.classList.toggle('sel',c.dataset.s===sess));
  document.getElementById('t-session').value=sess;
}

function renderSessChips(autoSess){
  const wrap=document.getElementById('t-session-chips');
  if(!wrap)return;
  const opts=['No Session',...DB.sessions.map(s=>s.name)];
  wrap.innerHTML=opts.map(nm=>`<div class="sess-chip${nm===autoSess?' sel':''}" data-s="${escQ(nm)}">${nm}</div>`).join('');
  wrap.querySelectorAll('.sess-chip').forEach(el=>{
    el.addEventListener('click',()=>selSessChip(el.dataset.s));
  });
  const val=autoSess||'No Session';
  const hiddenEl=document.getElementById('t-session');
  if(hiddenEl)hiddenEl.value=val;
  st.tradeSess=val;
}
function escQ(s){return s.replace(/'/g,"\\'")}

function autoDetectInstrument(sym){
  if(!sym)return;
  const s=sym.toUpperCase();
  const inst=document.getElementById('t-inst');if(!inst)return;
  if(s.includes('XAU')||s.includes('GOLD'))inst.value='gold';
  else if(s.includes('XAG')||s.includes('SILVER'))inst.value='gold';
  else if(s.includes('BTC')||s.includes('ETH')||s.includes('XRP')||s.includes('SOL')||s.includes('ADA'))inst.value='crypto';
  else if(s.includes('NAS')||s.includes('SPX')||s.includes('DOW')||s.includes('US30')||s.includes('US500')||s.includes('GER')||s.includes('UK'))inst.value='indices';
  else if(/^[A-Z]{6}$/.test(s)||(s.length===6&&!s.includes('USD'+'USD')))inst.value='forex';
  else inst.value='forex';
  calcAll();
}

// ── Net P&L helper: always deduct commission ──
function netPnL(t){return (parseFloat(t.pnl)||0)-(parseFloat(t.commission)||0)}
// ── Win/Loss classification respecting BE/RF override ──
function isRFBE(t){return t.tradeResult==='rf'}
function isBE(t){return t.tradeResult==='rf'||netPnL(t)===0}
function isWin(t){
  if(t.tradeResult==='rf')return !!DB.settings.beAsWin;
  if(t.tradeResult==='win')return true;
  if(t.tradeResult==='loss')return false;
  const np=netPnL(t);
  if(np===0)return !!DB.settings.beAsWin;// $0 trade counts as win if beAsWin on
  return np>0;
}
function isLoss(t){
  if(t.tradeResult==='rf')return false;// RF/BE never a loss
  if(t.tradeResult==='win')return false;
  if(t.tradeResult==='loss')return true;
  const np=netPnL(t);
  if(np===0)return false;// $0 = BE, not loss
  return np<0;
}

function setTradeResult(r){
  st.tradeResult=st.tradeResult===r?null:r;// toggle
  const el=document.getElementById('tr-rf');if(!el)return;
  el.classList.toggle('sel',st.tradeResult==='rf');
}

// ── Timezone helpers ──
function gmtToUserTZ(hhmm){
  // Convert a "HH:MM" GMT string to the user's selected timezone
  const tz=DB.settings.tz||'Asia/Kolkata';
  try{
    const [h,m]=hhmm.split(':').map(Number);
    const now=new Date();
    const utcDate=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate(),h,m,0));
    const opts={hour:'2-digit',minute:'2-digit',hour12:false,timeZone:tz};
    return utcDate.toLocaleTimeString('en-GB',opts);
  }catch{return hhmm}
}
function tzLabel(){
  const tz=DB.settings.tz||'Asia/Kolkata';
  const labels={'Asia/Kolkata':'IST','Asia/Calcutta':'IST','UTC':'UTC','America/New_York':'EST','Europe/London':'GMT','Asia/Dubai':'GST','Asia/Singapore':'SGT','Australia/Sydney':'AEST'};
  return labels[tz]||tz.split('/').pop();
}

function init(){
  try{
    const theme=DB.settings.theme||'amoled';
    document.documentElement.setAttribute('data-theme',theme);
    // Ensure activeAcctId is valid
    if(!st.activeAcctId||!DB.accounts.find(a=>a.id===st.activeAcctId)){
      st.activeAcctId=DB.accounts[0]?.id;
      if(st.activeAcctId)S.set('activeAcct',st.activeAcctId);
    }
    // Populate dropdowns
    const symSel=document.getElementById('t-symbol');if(symSel)symSel.innerHTML=DB.pairs.map(p=>`<option>${p}</option>`).join('');
    const setupSel=document.getElementById('t-setup');if(setupSel)setupSel.innerHTML=DB.setups.map(s=>`<option>${s}</option>`).join('');
    updateSidebar();
    populateFilters();
    renderDash();
    checkRules();
  }catch(err){
    console.error('init error:',err);
    // Retry once after a tick in case DOM wasn't fully ready
    setTimeout(()=>{try{updateSidebar();renderDash();}catch(e){console.error('init retry failed:',e);}},50);
  }
}
// Wait for DOM then init
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
}else{
  init();
}
setInterval(checkRules,60000);