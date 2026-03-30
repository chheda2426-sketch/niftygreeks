"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { UserProfile, Position, Scenario, PLAN_LIMITS } from "../../types";

// ── Black-Scholes ─────────────────────────────────────────────────────────────
function ncdf(x: number) {
  const a=[0.254829592,-0.284496736,1.421413741,-1.453152027,1.061405429],p=0.3275911;
  const s=x<0?-1:1; x=Math.abs(x)/Math.sqrt(2);
  const t=1/(1+p*x);
  const y=1-(((((a[4]*t+a[3])*t)+a[2])*t+a[1])*t+a[0])*t*Math.exp(-x*x);
  return 0.5*(1+s*y);
}
function npdf(x: number){ return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI); }
function bsCalc(S:number,K:number,T:number,r:number,sigma:number){
  if(T<=0){ const iv=Math.max(S-K,0); return{price:iv,delta:S>K?1:0,gamma:0,theta:0,vega:0,iv:sigma*100}; }
  const d1=(Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  const price=S*ncdf(d1)-K*Math.exp(-r*T)*ncdf(d2);
  const delta=ncdf(d1);
  const gamma=npdf(d1)/(S*sigma*Math.sqrt(T));
  const theta=(-(S*npdf(d1)*sigma)/(2*Math.sqrt(T))-r*K*Math.exp(-r*T)*ncdf(d2))/365;
  const vega=S*npdf(d1)*Math.sqrt(T)/100;
  return{price,delta,gamma,theta,vega,iv:sigma*100};
}

// ── NSE Calendar ──────────────────────────────────────────────────────────────
const EXPIRIES=[
  {label:"24 Mar 2026",short:"24Mar",date:"2026-03-24",dte:0, tag:"TODAY"},
  {label:"30 Mar 2026",short:"30Mar",date:"2026-03-30",dte:6, tag:"WEEKLY"},
  {label:"07 Apr 2026",short:"07Apr",date:"2026-04-07",dte:14,tag:"WEEKLY"},
  {label:"13 Apr 2026",short:"13Apr",date:"2026-04-13",dte:20,tag:"WEEKLY"},
  {label:"21 Apr 2026",short:"21Apr",date:"2026-04-21",dte:28,tag:"WEEKLY"},
  {label:"28 Apr 2026",short:"28Apr",date:"2026-04-28",dte:35,tag:"MONTHLY"},
  {label:"26 May 2026",short:"26May",date:"2026-05-26",dte:63,tag:"MONTHLY"},
];
const TAG_COL:Record<string,string>={TODAY:"#FF4444",MONTHLY:"#FFD600",WEEKLY:"#00E5FF"};
const RATE=0.065;
const GCFG:{[k:string]:{color:string;label:string;unit:string;min:number;max:number}}={
  delta:{color:"#00E5FF",label:"Delta",      unit:"", min:0,  max:1   },
  gamma:{color:"#FFD600",label:"Gamma",      unit:"", min:0,  max:0.01},
  theta:{color:"#FF4444",label:"Theta ₹/day",unit:"", min:-50,max:0   },
  vega: {color:"#69FF47",label:"Vega",       unit:"", min:0,  max:30  },
  iv:   {color:"#FF6B35",label:"IV %",       unit:"%",min:15, max:50  },
  price:{color:"#B388FF",label:"Premium ₹",  unit:"₹",min:0,  max:1500},
};

function isMarketOpen(){
  const ist=new Date(Date.now()+5.5*3600*1000);
  const day=ist.getUTCDay(), mins=ist.getUTCHours()*60+ist.getUTCMinutes();
  return day>0&&day<6&&mins>=555&&mins<=930;
}
function getISTTime(){
  const ist=new Date(Date.now()+5.5*3600*1000);
  return `${ist.getUTCHours().toString().padStart(2,"0")}:${ist.getUTCMinutes().toString().padStart(2,"0")} IST`;
}
function getStrikeList(spot:number){ const atm=Math.round(spot/50)*50; return Array.from({length:21},(_,i)=>atm+(i-10)*50); }

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTip({active,payload,label}:any){
  if(!active||!payload?.length) return null;
  return(
    <div style={{background:"rgba(10,10,20,0.96)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,padding:"10px 14px",fontFamily:"monospace",fontSize:11}}>
      <div style={{color:"#666",marginBottom:5}}>{label}</div>
      {payload.map((p:any,i:number)=>(
        <div key={i} style={{color:p.color}}>{p.name}:<span style={{color:"#fff",marginLeft:4}}>{Number(p.value).toFixed(4)}</span></div>
      ))}
    </div>
  );
}

// ── Greek Card ────────────────────────────────────────────────────────────────
function GreekCard({gk,value,change,cfg,active,onClick,live}:{gk:string;value:number;change:number;cfg:any;active:boolean;onClick:()=>void;live:boolean}){
  return(
    <div onClick={onClick} style={{background:active?`${cfg.color}18`:"rgba(255,255,255,0.03)",border:`1px solid ${active?cfg.color:"rgba(255,255,255,0.08)"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
      {active&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:cfg.color}}/>}
      {live&&<div style={{position:"absolute",top:8,right:8,width:6,height:6,borderRadius:"50%",background:"#69FF47"}}/>}
      <div style={{color:"#555",fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:6}}>{cfg.label}</div>
      <div style={{color:cfg.color,fontSize:22,fontWeight:700,fontFamily:"monospace"}}>
        {cfg.unit}{typeof value==="number"?value.toFixed(gk==="gamma"?5:3):"—"}
      </div>
      <div style={{color:change>=0?"#69FF47":"#FF4444",fontSize:11,marginTop:4,fontFamily:"monospace"}}>
        {change>=0?"▲":"▼"} {Math.abs(change).toFixed(4)}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardClient({
  profile,
  initialPositions,
}: {
  profile: UserProfile;
  initialPositions: Position[];
}) {
  const plan     = profile.plan ?? "free";
  const limits   = PLAN_LIMITS[plan];

  // Position state
  const [strike,   setStrike]   = useState(22850);
  const [expiry,   setExpiry]   = useState(EXPIRIES[2]);
  const [optType,  setOptType]  = useState<"CE"|"PE">("CE");
  const [entryPx,  setEntryPx]  = useState(422);
  const [entryIn,  setEntryIn]  = useState("422");
  const [lots,     setLots]     = useState(65);
  const [lotsIn,   setLotsIn]   = useState("65");
  const [showPos,  setShowPos]  = useState(false);
  const [customSt, setCustomSt] = useState("");

  // Market state
  const [spot,     setSpot]     = useState(22761);
  const [iv,       setIv]       = useState(0.2857);
  const [dte,      setDte]      = useState(14);

  // Live NSE state
  const [liveData, setLiveData] = useState<any>(null);
  const [isNSE,    setIsNSE]    = useState(false);
  const [fetching, setFetching] = useState(false);
  const [status,   setStatus]   = useState("");
  const [lastUpd,  setLastUpd]  = useState<string|null>(null);
  const [autoOn,   setAutoOn]   = useState(false);
  const [countdown,setCountdown]= useState(180);
  const [mktOpen,  setMktOpen]  = useState(isMarketOpen());

  // Chart
  const [isLiveSim,setIsLiveSim]= useState(false);
  const [activeG,  setActiveG]  = useState("delta");
  const [history,  setHistory]  = useState<any[]>([]);

  // Scenarios
  const [scenarios,setScenarios]= useState<Scenario[]>([
    {id:1,label:"Gap Up — Gift Nifty",  target:23350,iv_delta:-3,col:"#69FF47"},
    {id:2,label:"Mild Rally",           target:23000,iv_delta:-1,col:"#00E5FF"},
    {id:3,label:"Gap Down — Bearish",   target:22000,iv_delta:4, col:"#FF4444"},
    {id:4,label:"Flat / Sideways",      target:22512,iv_delta:0, col:"#FFD600"},
  ]);
  const [scInput,  setScInput]  = useState({label:"",target:"",iv_delta:"0"});
  const scId = useRef(4);

  // Saved positions from DB
  const [dbPositions, setDbPositions] = useState<Position[]>(initialPositions);
  const [savingPos,   setSavingPos]   = useState(false);
  const [saveMsg,     setSaveMsg]     = useState("");

  const spotRef=useRef(22761), ivRef=useRef(0.2857);
  const simTmr=useRef<any>(null), autoTmr=useRef<any>(null), cntTmr=useRef<any>(null);

  useEffect(()=>{ setDte(expiry.dte); },[expiry]);
  useEffect(()=>{ const t=setInterval(()=>setMktOpen(isMarketOpen()),30000); return()=>clearInterval(t); },[]);

  // Init chart history
  useEffect(()=>{
    const h=[];
    for(let i=30;i>=1;i--){
      const s=22761+(Math.random()-0.5)*40*i/15;
      const v=0.2857+(Math.random()-0.5)*0.01;
      const g=bsCalc(s,strike,dte/365,RATE,v);
      const t=new Date(Date.now()-i*3000);
      h.push({time:`${t.getHours().toString().padStart(2,"0")}:${t.getMinutes().toString().padStart(2,"0")}:${t.getSeconds().toString().padStart(2,"00")}`,spot:+s.toFixed(2),...Object.fromEntries(Object.keys(GCFG).map(k=>[k,+(g[k as keyof typeof g]||0).toFixed(5)]))});
    }
    setHistory(h);
  },[strike,expiry]);

  // NSE fetch (calls our secure API route)
  const fetchNSE = useCallback(async(sk=strike,ex=expiry,ot=optType)=>{
    if(fetching||!limits.liveNSE){ setStatus("Upgrade to Trader plan for live NSE data"); return; }
    setFetching(true); setStatus(`Fetching NSE: ${sk} ${ot} · ${ex.label}…`);
    try{
      const res=await fetch("/api/nse",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({strike:sk,expiry:ex.label,optType:ot})});
      const data=await res.json();
      if(res.ok&&data){
        setLiveData(data); setIsNSE(true);
        if(data.spot){ setSpot(data.spot); spotRef.current=data.spot; }
        if(data.iv){ setIv(data.iv/100); ivRef.current=data.iv/100; }
        setLastUpd(getISTTime());
        setStatus(`✓ NSE live · ${sk} ${ot} · ${ex.label} · ${data.fetchTime||getISTTime()}`);
        const g={price:data.ltp||0,delta:data.delta||0,gamma:data.gamma||0,theta:data.theta||0,vega:data.vega||0,iv:data.iv||28};
        setHistory(prev=>[...prev.slice(-59),{time:data.fetchTime||getISTTime(),spot:data.spot||spot,...Object.fromEntries(Object.keys(GCFG).map(k=>[k,+(g[k as keyof typeof g]||0).toFixed(5)]))}]);
        setCountdown(180);
      } else {
        setStatus(`✗ ${data.error||"NSE fetch failed"}`); setIsNSE(false);
      }
    }catch(e){ setStatus("✗ Network error"); setIsNSE(false); }
    setFetching(false);
  },[fetching,strike,expiry,optType,limits.liveNSE,spot]);

  // Auto-refresh
  useEffect(()=>{
    clearInterval(autoTmr.current); clearInterval(cntTmr.current);
    if(autoOn&&limits.autoRefresh){
      setCountdown(180);
      autoTmr.current=setInterval(()=>fetchNSE(),180000);
      cntTmr.current=setInterval(()=>setCountdown(c=>c>0?c-1:180),1000);
    }
    return()=>{ clearInterval(autoTmr.current); clearInterval(cntTmr.current); };
  },[autoOn,limits.autoRefresh]);

  // Simulation
  useEffect(()=>{
    if(isLiveSim){
      simTmr.current=setInterval(()=>{
        const ns=Math.max(21000,Math.min(25000,spotRef.current+(Math.random()-0.47)*10));
        const ni=Math.max(0.18,Math.min(0.45,ivRef.current+(0.2857-ivRef.current)*0.05+(Math.random()-0.5)*0.003));
        spotRef.current=ns; ivRef.current=ni; setSpot(ns); setIv(ni);
        const g=bsCalc(ns,strike,dte/365,RATE,ni);
        const ts=new Date().toLocaleTimeString();
        setHistory(p=>[...p.slice(-59),{time:ts,spot:+ns.toFixed(2),...Object.fromEntries(Object.keys(GCFG).map(k=>[k,+(g[k as keyof typeof g]||0).toFixed(5)]))}]);
      },1500);
    } else clearInterval(simTmr.current);
    return()=>clearInterval(simTmr.current);
  },[isLiveSim,strike,dte]);

  // Derived Greeks
  const G=(()=>{
    if(isNSE&&liveData){
      const bs=bsCalc(spot,strike,dte/365,RATE,iv);
      return{price:liveData.ltp??bs.price,delta:liveData.delta??bs.delta,gamma:liveData.gamma??bs.gamma,theta:liveData.theta??bs.theta,vega:liveData.vega??bs.vega,iv:liveData.iv??iv*100};
    }
    return bsCalc(spot,strike,dte/365,RATE,iv);
  })();

  const pnlUnit=G.price-entryPx, totalPnl=pnlUnit*lots;
  const pnlColor=totalPnl>=0?"#69FF47":"#FF4444";
  const be=optType==="CE"?strike+entryPx:strike-entryPx;
  const mm=optType==="CE"?(spot>strike?"ITM":"OTM"):(spot<strike?"ITM":"OTM");
  const mmColor=mm==="ITM"?"#69FF47":"#FF6B35";
  const changes:Record<string,number>={};
  Object.keys(GCFG).forEach(k=>{ const prev=history.length>1?history[history.length-2]?.[k]||0:0; changes[k]=(G[k as keyof typeof G] as number||0)-prev; });

  const strikeList=getStrikeList(spot);
  const atmStrike=Math.round(spot/50)*50;

  // Save position to DB
  async function savePosition(){
    if(dbPositions.length>=limits.positions){ setSaveMsg(`Position limit (${limits.positions}) reached. Upgrade to add more.`); return; }
    setSavingPos(true); setSaveMsg("");
    const body={ label:`${strike} ${optType} ${expiry.short}`, strike, opt_type:optType, expiry_date:expiry.date, expiry_label:expiry.label, dte:expiry.dte, entry_price:entryPx, lot_size:lots, iv, color:"#00E5FF" };
    const res=await fetch("/api/positions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await res.json();
    if(res.ok){ setDbPositions(p=>[data,...p]); setSaveMsg("✓ Position saved"); }
    else setSaveMsg(`✗ ${data.error}`);
    setSavingPos(false);
    setTimeout(()=>setSaveMsg(""),3000);
  }

  async function deletePosition(id:string){
    await fetch(`/api/positions?id=${id}`,{method:"DELETE"});
    setDbPositions(p=>p.filter(x=>x.id!==id));
  }

  return(
    <div style={{background:"#06060F",minHeight:"100vh",color:"#fff",fontFamily:"Courier New,monospace",padding:"16px",boxSizing:"border-box"}}>

      {/* Plan banner for free users */}
      {plan==="free"&&(
        <div style={{background:"rgba(255,214,0,0.07)",border:"1px solid rgba(255,214,0,0.2)",borderRadius:9,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#FFD600"}}>⚡ You're on the Free plan — Black-Scholes model only · 1 position max</span>
          <a href="/pricing" style={{background:"#FFD600",color:"#000",padding:"5px 14px",borderRadius:6,fontSize:11,fontWeight:700,textDecoration:"none"}}>Upgrade →</a>
        </div>
      )}

      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
        <div>
          <div style={{fontSize:9,color:"#222",letterSpacing:3,textTransform:"uppercase"}}>NSE · Live Greeks Monitor</div>
          <div style={{fontSize:20,fontWeight:700,marginTop:2}}>
            NIFTY <span style={{color:"#00E5FF"}}>{strike}</span>{" "}
            <span style={{color:optType==="CE"?"#69FF47":"#FF4444",border:`1px solid ${optType==="CE"?"#69FF47":"#FF4444"}`,borderRadius:4,padding:"1px 7px",fontSize:13}}>{optType}</span>
            <span style={{color:"#444",fontSize:13,marginLeft:8}}>· {expiry.label}</span>
          </div>
          <div style={{display:"flex",gap:8,marginTop:5,alignItems:"center",flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:mktOpen?"#69FF47":"#FF4444"}}/>
              <span style={{fontSize:9,color:mktOpen?"#69FF47":"#FF4444"}}>{mktOpen?"MARKET OPEN":"MARKET CLOSED"}</span>
            </div>
            <span style={{background:isNSE?"rgba(105,255,71,0.12)":"rgba(255,214,0,0.1)",border:`1px solid ${isNSE?"#69FF4433":"#FFD60033"}`,borderRadius:4,padding:"1px 7px",fontSize:8,color:isNSE?"#69FF47":"#FFD600",fontWeight:700}}>
              {isNSE?"● NSE LIVE":"◎ B-S MODEL"}
            </span>
            <span style={{background:`${mmColor}12`,border:`1px solid ${mmColor}33`,borderRadius:4,padding:"1px 7px",fontSize:8,color:mmColor,fontWeight:700}}>{mm}</span>
            <span style={{background:TAG_COL[expiry.tag]+"18",color:TAG_COL[expiry.tag],border:`1px solid ${TAG_COL[expiry.tag]}33`,borderRadius:4,padding:"1px 7px",fontSize:8,fontWeight:700}}>{expiry.tag}</span>
            {lastUpd&&<span style={{fontSize:8,color:"#333"}}>Updated: {lastUpd}</span>}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:9,color:"#333"}}>NIFTY SPOT</div>
          <div style={{fontSize:22,fontWeight:700,color:"#69FF47"}}>{spot.toFixed(2)}</div>
          <div style={{fontSize:9,color:"#444"}}>▲{(spot-22512).toFixed(2)}</div>
        </div>
      </div>

      {/* STRIKE + EXPIRY SELECTOR */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
        {/* Type */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:"#888",letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>Option Type</div>
          <div style={{display:"flex",gap:8}}>
            {(["CE","PE"] as const).map(t=>(
              <button key={t} onClick={()=>{setOptType(t);setIsNSE(false);setLiveData(null);}}
                style={{flex:1,padding:"9px",borderRadius:8,border:`1px solid ${optType===t?(t==="CE"?"#69FF47":"#FF4444"):"rgba(255,255,255,0.09)"}`,background:optType===t?(t==="CE"?"rgba(105,255,71,0.15)":"rgba(255,68,68,0.15)"):"transparent",color:optType===t?(t==="CE"?"#69FF47":"#FF4444"):"#444",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:15}}>
                {t} {t==="CE"?"↑":"↓"}
              </button>
            ))}
          </div>
        </div>
        {/* Strike */}
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
            <div style={{fontSize:9,color:"#00E5FF",letterSpacing:2,textTransform:"uppercase"}}>Strike Price</div>
            <div style={{fontSize:9,color:"#444"}}>ATM: <span style={{color:"#FFD600",fontWeight:700}}>{atmStrike}</span></div>
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
            {strikeList.map(s=>(
              <button key={s} onClick={()=>{setStrike(s);setIsNSE(false);setLiveData(null);setStatus(`Strike → ${s} · tap ↻ FETCH NSE`);}}
                style={{padding:"5px 9px",borderRadius:7,border:`2px solid ${s===strike?"#00E5FF":s===atmStrike?"#FFD60066":"rgba(255,255,255,0.08)"}`,background:s===strike?"rgba(0,229,255,0.18)":s===atmStrike?"rgba(255,214,0,0.07)":"transparent",color:s===strike?"#00E5FF":s===atmStrike?"#FFD600":"#555",cursor:"pointer",fontFamily:"monospace",fontSize:10,fontWeight:s===strike||s===atmStrike?700:400}}>
                {s}{s===atmStrike?" ▲":""}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <span style={{fontSize:9,color:"#444"}}>Custom:</span>
            <input type="number" step={50} value={customSt} onChange={e=>setCustomSt(e.target.value)} placeholder="e.g. 23250"
              style={{width:110,background:"#0a0a14",border:"1px solid #333",color:"#fff",borderRadius:6,padding:"6px 8px",fontFamily:"monospace",fontSize:12}}/>
            <button onClick={()=>{const v=+customSt;if(v>18000&&v<30000){setStrike(v);setCustomSt("");setIsNSE(false);}}}
              style={{padding:"6px 12px",borderRadius:6,border:"1px solid #00E5FF44",background:"rgba(0,229,255,0.1)",color:"#00E5FF",cursor:"pointer",fontFamily:"monospace",fontSize:10,fontWeight:700}}>SET</button>
          </div>
        </div>
        {/* Expiry */}
        <div>
          <div style={{fontSize:9,color:"#FFD600",letterSpacing:2,marginBottom:7,textTransform:"uppercase"}}>📅 NSE Expiry</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5}}>
            {EXPIRIES.map(ex=>{
              const sel=expiry.date===ex.date;
              const tc=TAG_COL[ex.tag];
              return(
                <button key={ex.date} onClick={()=>{setExpiry(ex);setDte(ex.dte);setIsNSE(false);setLiveData(null);}}
                  style={{padding:"8px 4px",borderRadius:8,border:`2px solid ${sel?tc:"rgba(255,255,255,0.07)"}`,background:sel?`${tc}15`:"transparent",color:sel?tc:"#444",cursor:"pointer",fontFamily:"monospace",fontSize:9,textAlign:"center",lineHeight:1.6}}>
                  <div style={{fontWeight:700,fontSize:10}}>{ex.short}</div>
                  <div style={{fontSize:8}}>{ex.dte===0?"TODAY":ex.dte+"d"}</div>
                  {ex.tag!=="WEEKLY"&&<div style={{fontSize:7,fontWeight:700}}>{ex.tag}</div>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* NSE FETCH CONTROLS */}
      <div style={{background:"rgba(0,229,255,0.04)",border:"1px solid rgba(0,229,255,0.14)",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:status?8:0}}>
          <button onClick={()=>fetchNSE()} disabled={fetching||!limits.liveNSE}
            style={{padding:"9px 18px",borderRadius:8,border:`1px solid ${limits.liveNSE?"rgba(0,229,255,0.45)":"rgba(255,255,255,0.1)"}`,background:fetching?"rgba(0,229,255,0.03)":"rgba(0,229,255,0.12)",color:fetching||!limits.liveNSE?"#333":"#00E5FF",cursor:fetching?"wait":"pointer",fontFamily:"monospace",fontWeight:700,fontSize:11,letterSpacing:1,display:"flex",alignItems:"center",gap:6}}>
            {fetching?<><span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>↻</span>FETCHING…</>:<>↻ FETCH NSE — {strike} {optType} · {expiry.short}</>}
          </button>
          {limits.autoRefresh&&(
            <button onClick={()=>setAutoOn(a=>!a)}
              style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${autoOn?"#69FF4455":"rgba(255,255,255,0.09)"}`,background:autoOn?"rgba(105,255,71,0.1)":"transparent",color:autoOn?"#69FF47":"#555",cursor:"pointer",fontFamily:"monospace",fontSize:10,fontWeight:700}}>
              {autoOn?`⏱ AUTO · ${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,"0")}`:"⏱ AUTO"}
            </button>
          )}
          <button onClick={()=>{if(!isLiveSim){spotRef.current=spot;ivRef.current=iv;}setIsLiveSim(l=>!l);}}
            style={{padding:"9px 14px",borderRadius:8,border:`1px solid ${isLiveSim?"#FF444455":"rgba(255,255,255,0.09)"}`,background:isLiveSim?"rgba(255,68,68,0.1)":"transparent",color:isLiveSim?"#FF4444":"#555",cursor:"pointer",fontFamily:"monospace",fontSize:10,fontWeight:700}}>
            {isLiveSim?"⏹ SIM":"▶ SIM"}
          </button>
          {!limits.liveNSE&&(
            <a href="/pricing" style={{padding:"9px 14px",borderRadius:8,border:"1px solid #FFD60044",background:"rgba(255,214,0,0.07)",color:"#FFD600",textDecoration:"none",fontFamily:"monospace",fontSize:10,fontWeight:700}}>
              ⚡ Upgrade for Live NSE
            </a>
          )}
        </div>
        {status&&<div style={{fontSize:9,color:status.startsWith("✓")?"#69FF47":status.startsWith("✗")?"#FF6666":"#888"}}>{status}</div>}
        {isNSE&&liveData&&(
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:8}}>
            {[{l:"Bid",v:liveData.bid?"₹"+liveData.bid:"—",c:"#69FF47"},{l:"Ask",v:liveData.ask?"₹"+liveData.ask:"—",c:"#FF4444"},{l:"OI",v:liveData.oi?(liveData.oi/1000).toFixed(0)+"K":"—",c:"#888"},{l:"Vol",v:liveData.volume?(liveData.volume/1000).toFixed(0)+"K":"—",c:"#888"}].map(({l,v,c})=>(
              <div key={l}><div style={{fontSize:8,color:"#333",letterSpacing:1,textTransform:"uppercase"}}>{l}</div><div style={{color:c,fontFamily:"monospace",fontSize:12,fontWeight:700}}>{v}</div></div>
            ))}
          </div>
        )}
      </div>

      {/* POSITION SETTINGS */}
      <button onClick={()=>setShowPos(p=>!p)} style={{width:"100%",padding:"8px 14px",borderRadius:9,border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:showPos?"#888":"#444",cursor:"pointer",fontFamily:"monospace",fontSize:10,letterSpacing:1,marginBottom:showPos?0:14,display:"flex",justifyContent:"space-between"}}>
        <span>💼 POSITION SETTINGS</span><span>{showPos?"▲":"▼"}</span>
      </button>
      {showPos&&(
        <div style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
            <div>
              <div style={{fontSize:9,color:"#B388FF",letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Entry Price ₹</div>
              <div style={{display:"flex",gap:5}}>
                <input type="number" value={entryIn} onChange={e=>setEntryIn(e.target.value)} onBlur={()=>{const v=+entryIn;if(v>0)setEntryPx(v);}}
                  style={{flex:1,background:"#0a0a14",border:"1px solid #B388FF33",color:"#B388FF",borderRadius:6,padding:"7px 8px",fontFamily:"monospace",fontSize:13}}/>
                <button onClick={()=>{const v=+entryIn;if(v>0){setEntryPx(v);setShowPos(false);}}} style={{padding:"6px 10px",background:"rgba(179,136,255,0.1)",border:"1px solid #B388FF44",color:"#B388FF",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700}}>✓</button>
              </div>
            </div>
            <div>
              <div style={{fontSize:9,color:"#FF6B35",letterSpacing:1,marginBottom:5,textTransform:"uppercase"}}>Lot Size</div>
              <div style={{display:"flex",gap:5}}>
                <input type="number" value={lotsIn} onChange={e=>setLotsIn(e.target.value)} onBlur={()=>{const v=+lotsIn;if(v>0)setLots(v);}}
                  style={{flex:1,background:"#0a0a14",border:"1px solid #FF6B3533",color:"#FF6B35",borderRadius:6,padding:"7px 8px",fontFamily:"monospace",fontSize:13}}/>
                <button onClick={()=>{const v=+lotsIn;if(v>0){setLots(v);setShowPos(false);}}} style={{padding:"6px 10px",background:"rgba(255,107,53,0.1)",border:"1px solid #FF6B3544",color:"#FF6B35",borderRadius:6,cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700}}>✓</button>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={savePosition} disabled={savingPos}
              style={{padding:"8px 16px",borderRadius:7,border:"1px solid #69FF4744",background:"rgba(105,255,71,0.1)",color:"#69FF47",cursor:savingPos?"wait":"pointer",fontFamily:"monospace",fontSize:11,fontWeight:700}}>
              {savingPos?"Saving…":"💾 Save Position"}
            </button>
            {saveMsg&&<span style={{fontSize:10,color:saveMsg.startsWith("✓")?"#69FF47":"#FF6666"}}>{saveMsg}</span>}
          </div>
          {dbPositions.length>0&&(
            <div style={{marginTop:10}}>
              <div style={{fontSize:9,color:"#333",letterSpacing:1,marginBottom:6,textTransform:"uppercase"}}>Saved Positions</div>
              {dbPositions.map(p=>(
                <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                  <span style={{color:"#888",fontSize:11,fontFamily:"monospace"}}>{p.label}</span>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setStrike(p.strike);setOptType(p.opt_type);setExpiry(EXPIRIES.find(e=>e.date===p.expiry_date)||EXPIRIES[2]);setEntryPx(p.entry_price);setLots(p.lot_size);setShowPos(false);}}
                      style={{padding:"2px 8px",borderRadius:4,border:"1px solid rgba(0,229,255,0.3)",background:"transparent",color:"#00E5FF",cursor:"pointer",fontFamily:"monospace",fontSize:9}}>Load</button>
                    <button onClick={()=>deletePosition(p.id)}
                      style={{padding:"2px 8px",borderRadius:4,border:"1px solid #FF444433",background:"transparent",color:"#FF4444",cursor:"pointer",fontFamily:"monospace",fontSize:9}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* P&L BANNER */}
      <div style={{background:`${pnlColor}12`,border:`1px solid ${pnlColor}40`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:10,color:"#555",letterSpacing:2}}>P&L · ₹{entryPx} entry × {lots} lots</div>
          <div style={{fontSize:26,fontWeight:700,color:pnlColor,fontFamily:"monospace"}}>{totalPnl>=0?"+":""}₹{totalPnl.toFixed(0)}</div>
          <div style={{fontSize:10,color:pnlColor}}>{pnlUnit>=0?"+":""}{((pnlUnit/entryPx)*100).toFixed(1)}% ROI</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"#555",letterSpacing:2}}>PREMIUM</div>
          <div style={{fontSize:20,color:"#B388FF",fontWeight:700}}>₹{G.price.toFixed(2)}</div>
          <div style={{fontSize:10,color:pnlUnit>=0?"#69FF47":"#FF4444"}}>{pnlUnit>=0?"+":""}₹{pnlUnit.toFixed(2)}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#555",letterSpacing:2}}>BREAKEVEN</div>
          <div style={{fontSize:15,fontWeight:700,color:"#FFD600",fontFamily:"monospace"}}>{be}</div>
          <div style={{fontSize:9,color:spot>be?"#69FF47":"#FF6B35"}}>{spot>be?"✓ Above BE":"Need +"+(be-spot).toFixed(0)+"pts"}</div>
        </div>
      </div>

      {/* GREEK CARDS */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {Object.entries(GCFG).map(([k,cfg])=>(
          <GreekCard key={k} gk={k} value={G[k as keyof typeof G] as number} change={changes[k]||0} cfg={cfg} active={activeG===k} onClick={()=>setActiveG(k)} live={isNSE&&liveData?.[k==="price"?"ltp":k==="iv"?"iv":k]!=null}/>
        ))}
      </div>

      {/* GREEK CHART */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><span style={{color:GCFG[activeG].color,fontWeight:700}}>{GCFG[activeG].label}</span><span style={{color:"#444",fontSize:11,marginLeft:8}}>vs TIME</span></div>
          <div style={{fontSize:10,color:"#444"}}>60 ticks · tap card to switch</div>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={history} margin={{top:5,right:5,left:-20,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="time" tick={{fill:"#444",fontSize:9}} interval="preserveStartEnd"/>
            <YAxis tick={{fill:"#444",fontSize:9}} domain={[GCFG[activeG].min,GCFG[activeG].max]}/>
            <Tooltip content={<ChartTip/>}/>
            <Line type="monotone" dataKey={activeG} stroke={GCFG[activeG].color} strokeWidth={2} dot={false} isAnimationActive={false} name={GCFG[activeG].label}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SPOT CHART */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px",marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{color:"#00E5FF",fontWeight:700}}>NIFTY SPOT</span>
          <span style={{fontSize:10,color:"#444"}}>Strike {strike} · 23350 target</span>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={history} margin={{top:5,right:5,left:-20,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)"/>
            <XAxis dataKey="time" tick={{fill:"#444",fontSize:9}} interval="preserveStartEnd"/>
            <YAxis tick={{fill:"#444",fontSize:9}} domain={["auto","auto"]}/>
            <Tooltip content={<ChartTip/>}/>
            <ReferenceLine y={strike} stroke="#FF444466" strokeDasharray="4 4" label={{value:`${strike}`,fill:"#FF4444",fontSize:9}}/>
            <ReferenceLine y={23350}  stroke="#FF6B3544" strokeDasharray="4 4" label={{value:"23350",fill:"#FF6B35",fontSize:9}}/>
            <Line type="monotone" dataKey="spot" stroke="#00E5FF" strokeWidth={2} dot={false} isAnimationActive={false} name="NIFTY"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* MANUAL CONTROLS */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px",marginBottom:14}}>
        <div style={{fontSize:10,color:"#444",letterSpacing:2,marginBottom:12}}>MANUAL CONTROLS</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div>
            <div style={{fontSize:10,color:"#555",marginBottom:6}}>SPOT: <span style={{color:"#00E5FF"}}>{spot.toFixed(0)}</span></div>
            <input type="range" min={21000} max={25000} step={25} value={spot} onChange={e=>{const v=+e.target.value;setSpot(v);spotRef.current=v;setIsNSE(false);const g=bsCalc(v,strike,dte/365,RATE,iv);setHistory(p=>[...p.slice(-59),{time:new Date().toLocaleTimeString(),spot:v,...Object.fromEntries(Object.keys(GCFG).map(k=>[k,+(g[k as keyof typeof g]||0).toFixed(5)]))}]);}} style={{width:"100%",accentColor:"#00E5FF"}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:"#555",marginBottom:6}}>IV: <span style={{color:"#FF6B35"}}>{(iv*100).toFixed(1)}%</span></div>
            <input type="range" min={15} max={60} step={0.5} value={iv*100} onChange={e=>{const v=+e.target.value/100;setIv(v);ivRef.current=v;setIsNSE(false);const g=bsCalc(spot,strike,dte/365,RATE,v);setHistory(p=>[...p.slice(-59),{time:new Date().toLocaleTimeString(),spot,...Object.fromEntries(Object.keys(GCFG).map(k=>[k,+(g[k as keyof typeof g]||0).toFixed(5)]))}]);}} style={{width:"100%",accentColor:"#FF6B35"}}/>
          </div>
          <div>
            <div style={{fontSize:10,color:"#555",marginBottom:6}}>DTE: <span style={{color:"#FFD600"}}>{dte}d</span></div>
            <input type="range" min={0} max={90} step={1} value={dte} onChange={e=>setDte(+e.target.value)} style={{width:"100%",accentColor:"#FFD600"}}/>
          </div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <button onClick={()=>{if(!isLiveSim){spotRef.current=spot;ivRef.current=iv;}setIsLiveSim(l=>!l);}} style={{width:"100%",padding:"10px",borderRadius:8,border:`1px solid ${isLiveSim?"#FF4444":"#69FF47"}`,background:isLiveSim?"rgba(255,68,68,0.15)":"rgba(105,255,71,0.15)",color:isLiveSim?"#FF4444":"#69FF47",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:12,letterSpacing:2}}>
              {isLiveSim?"⏹ STOP SIM":"▶ START SIM"}
            </button>
          </div>
        </div>
      </div>

      {/* MULTI-SCENARIO PANEL */}
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div style={{fontSize:10,color:"#888",letterSpacing:2,textTransform:"uppercase"}}>📊 Scenario Impact Analyser</div>
          <div style={{fontSize:9,color:"#444"}}>Spot: <span style={{color:"#00E5FF",fontWeight:700}}>{spot.toFixed(0)}</span> · {lots} lots · ₹{entryPx}</div>
        </div>

        {/* Quick add */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:9,color:"#333",letterSpacing:1,marginBottom:7,textTransform:"uppercase"}}>Quick Add</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[
              {label:"Strong Gap Up",  target:spot+500, iv_delta:-4, col:"#69FF47"},
              {label:"Mild Gap Up",    target:spot+200, iv_delta:-2, col:"#00E5FF"},
              {label:"Flat",           target:spot,     iv_delta:0,  col:"#FFD600"},
              {label:"Mild Gap Down",  target:spot-200, iv_delta:3,  col:"#FF6B35"},
              {label:"Strong Gap Down",target:spot-500, iv_delta:6,  col:"#FF4444"},
            ].map(p=>(
              <button key={p.label} onClick={()=>{if(scenarios.length>=limits.scenarios){return;}const t=Math.round(p.target/50)*50;setScenarios(prev=>[...prev,{id:++scId.current,label:p.label,target:t,iv_delta:p.iv_delta,col:p.col}]);}}
                disabled={scenarios.length>=limits.scenarios}
                style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${p.col}44`,background:`${p.col}10`,color:p.col,cursor:"pointer",fontFamily:"monospace",fontSize:9,fontWeight:700,opacity:scenarios.length>=limits.scenarios?0.4:1}}>
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom scenario input */}
        <div style={{background:"rgba(0,0,0,0.3)",borderRadius:9,padding:"10px 12px",marginBottom:14,border:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:9,color:"#444",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>Custom Scenario</div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,alignItems:"flex-end"}}>
            <div>
              <div style={{fontSize:8,color:"#555",marginBottom:4}}>LABEL</div>
              <input type="text" value={scInput.label} onChange={e=>setScInput(s=>({...s,label:e.target.value}))} placeholder="e.g. RBI Policy Gap"
                style={{width:"100%",background:"#0a0a14",border:"1px solid #333",color:"#fff",borderRadius:6,padding:"6px 8px",fontFamily:"monospace",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:8,color:"#555",marginBottom:4}}>NIFTY OPENS AT</div>
              <input type="number" value={scInput.target} onChange={e=>setScInput(s=>({...s,target:e.target.value}))} placeholder={String(Math.round(spot/50)*50)}
                style={{width:"100%",background:"#0a0a14",border:"1px solid #333",color:"#00E5FF",borderRadius:6,padding:"6px 8px",fontFamily:"monospace",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:8,color:"#555",marginBottom:4}}>IV CHANGE %</div>
              <input type="number" step="0.5" value={scInput.iv_delta} onChange={e=>setScInput(s=>({...s,iv_delta:e.target.value}))} placeholder="-3"
                style={{width:"100%",background:"#0a0a14",border:"1px solid #333",color:"#FF6B35",borderRadius:6,padding:"6px 8px",fontFamily:"monospace",fontSize:11,boxSizing:"border-box"}}/>
            </div>
            <button onClick={()=>{
              if(scenarios.length>=limits.scenarios) return;
              const t=+scInput.target||spot; const d=+scInput.iv_delta||0;
              const col=t>spot+100?"#69FF47":t<spot-100?"#FF4444":"#FFD600";
              const lbl=scInput.label||(t>spot?`Gap Up → ${Math.round(t)}`:`Gap Down → ${Math.round(t)}`);
              setScenarios(prev=>[...prev,{id:++scId.current,label:lbl,target:Math.round(t),iv_delta:d,col}]);
              setScInput({label:"",target:"",iv_delta:"0"});
            }} style={{padding:"7px 14px",borderRadius:7,border:"1px solid #69FF4766",background:"rgba(105,255,71,0.12)",color:"#69FF47",cursor:"pointer",fontFamily:"monospace",fontWeight:700,fontSize:11}}>
              + ADD
            </button>
          </div>
          {scenarios.length>=limits.scenarios&&<div style={{fontSize:9,color:"#FFD600",marginTop:6}}>⚡ Scenario limit ({limits.scenarios}) reached. <a href="/pricing" style={{color:"#FFD600"}}>Upgrade</a> for more.</div>}
        </div>

        {/* Scenario cards */}
        {scenarios.map(sc=>{
          const mv=sc.target-spot;
          const ivAdj=iv+sc.iv_delta/100;
          const dP=G.delta*mv;
          const gP=0.5*G.gamma*mv*mv;
          const th=Math.abs(G.theta);
          const vc=G.vega*Math.abs(sc.iv_delta)*(sc.iv_delta<0?-1:1);
          const netUnit=dP+gP-th-vc;
          const netTot=netUnit*lots;
          const isUp=mv>0;
          return(
            <div key={sc.id} style={{background:`${sc.col}09`,border:`2px solid ${sc.col}30`,borderRadius:11,padding:"12px 14px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                    <span style={{color:sc.col,fontWeight:700,fontSize:13}}>{sc.label}</span>
                    <span style={{background:isUp?"rgba(105,255,71,0.12)":"rgba(255,68,68,0.12)",color:isUp?"#69FF47":"#FF4444",borderRadius:4,padding:"1px 6px",fontSize:8,fontWeight:700}}>{isUp?"GAP UP ▲":"GAP DOWN ▼"}</span>
                  </div>
                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:9,color:"#555"}}>Opens at <span style={{color:sc.col,fontWeight:700,fontFamily:"monospace"}}>{sc.target.toLocaleString()}</span></span>
                    <span style={{fontSize:9,color:isUp?"#69FF47":"#FF4444",fontFamily:"monospace"}}>{isUp?"+":""}{mv.toFixed(0)} pts</span>
                    <span style={{fontSize:9,color:"#FF6B35"}}>IV {sc.iv_delta>=0?"+":""}{sc.iv_delta}%</span>
                  </div>
                </div>
                <button onClick={()=>setScenarios(prev=>prev.filter(s=>s.id!==sc.id))} style={{padding:"3px 8px",borderRadius:4,border:"1px solid #FF444433",background:"rgba(255,68,68,0.08)",color:"#FF4444",cursor:"pointer",fontFamily:"monospace",fontSize:9}}>✕</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {[{k:"Δ Move",v:`${dP>=0?"+":""}₹${dP.toFixed(0)}`,c:"#00E5FF"},{k:"Γ Boost",v:`+₹${gP.toFixed(0)}`,c:"#FFD600"},{k:"θ Cost",v:`-₹${th.toFixed(0)}`,c:"#FF4444"},{k:"Vega",v:`${vc<=0?"-":"+"}₹${Math.abs(vc).toFixed(0)}`,c:"#FF6B35"}].map(({k,v,c})=>(
                  <div key={k} style={{background:"rgba(0,0,0,0.25)",borderRadius:6,padding:"6px 4px",textAlign:"center"}}>
                    <div style={{fontSize:8,color:"#444",letterSpacing:1,marginBottom:2,textTransform:"uppercase"}}>{k}</div>
                    <div style={{color:c,fontFamily:"monospace",fontSize:11,fontWeight:700}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{background:netTot>=0?"rgba(105,255,71,0.1)":"rgba(255,68,68,0.1)",border:`1px solid ${netTot>=0?"#69FF4733":"#FF444433"}`,borderRadius:8,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontSize:9,color:"#555"}}>Per Unit</div><div style={{color:netTot>=0?"#69FF47":"#FF4444",fontFamily:"monospace",fontSize:14,fontWeight:700}}>{netUnit>=0?"+":""}₹{netUnit.toFixed(0)}</div></div>
                <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>ROI</div><div style={{color:netTot>=0?"#69FF47":"#FF4444",fontFamily:"monospace",fontSize:14,fontWeight:700}}>{netUnit>=0?"+":""}{((netUnit/entryPx)*100).toFixed(1)}%</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:9,color:"#555"}}>Net × {lots} Lots</div><div style={{color:netTot>=0?"#69FF47":"#FF4444",fontFamily:"monospace",fontSize:20,fontWeight:700}}>{netTot>=0?"+":""}₹{netTot.toFixed(0)}</div></div>
              </div>
            </div>
          );
        })}

        {/* Comparison summary */}
        {scenarios.length>1&&(
          <div style={{marginTop:4,background:"rgba(0,0,0,0.3)",borderRadius:10,padding:"10px 12px",border:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontSize:9,color:"#333",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Comparison · {lots} Lots</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"monospace",fontSize:11}}>
              <thead>
                <tr>{["Scenario","Opens At","Move","Net P&L"].map(h=>(
                  <th key={h} style={{color:"#333",fontSize:8,padding:"3px 6px",textAlign:h==="Net P&L"?"right":"left",letterSpacing:1,textTransform:"uppercase",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {scenarios.map(sc=>{
                  const mv=sc.target-spot; const vc=G.vega*Math.abs(sc.iv_delta)*(sc.iv_delta<0?-1:1);
                  const net=(G.delta*mv+0.5*G.gamma*mv*mv-Math.abs(G.theta)-vc)*lots;
                  return(<tr key={sc.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <td style={{padding:"5px 6px",color:sc.col,fontWeight:700}}>{sc.label}</td>
                    <td style={{padding:"5px 6px",color:"#888",fontFamily:"monospace"}}>{sc.target.toLocaleString()}</td>
                    <td style={{padding:"5px 6px",color:mv>=0?"#69FF47":"#FF4444",fontFamily:"monospace"}}>{mv>=0?"+":""}{mv.toFixed(0)}</td>
                    <td style={{padding:"5px 6px",color:net>=0?"#69FF47":"#FF4444",fontWeight:700,textAlign:"right",fontFamily:"monospace"}}>{net>=0?"+":""}₹{net.toFixed(0)}</td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{textAlign:"center",marginTop:14,fontSize:9,color:"#222"}}>
        {isNSE?"● NSE LIVE DATA ·":"◎ BLACK-SCHOLES ·"} TAP GREEK CARDS TO SWITCH CHART · EDUCATIONAL ONLY
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
