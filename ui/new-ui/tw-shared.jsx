// tw-shared.jsx — TaxWijs shared components (exports to window)
// ── Hooks ─────────────────────────────────────────────────────────────────
function useMediaQuery(q){
  const [m,setM]=React.useState(()=>window.matchMedia(q).matches);
  React.useEffect(()=>{
    const mq=window.matchMedia(q);
    const h=e=>setM(e.matches);
    mq.addEventListener('change',h);
    return()=>mq.removeEventListener('change',h);
  },[q]);
  return m;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IC={
  grid:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><rect x="1.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9.5" y="1.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
  chat:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5l-3 2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  calc:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><rect x="2.5" y="1.5" width="11" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M4.5 4.5h7M4.5 8.5h2M8.5 8.5h2M4.5 11.5h2M8.5 11.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  check:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  globe:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="8" cy="8" rx="3" ry="6" stroke="currentColor" strokeWidth="1.5"/><path d="M2 8h12" stroke="currentColor" strokeWidth="1.5"/></svg>,
  users:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M11.5 11.5c1 .5 1.5 1.3 1.5 2.5H3c0-1.2.5-2 1.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="7" cy="6.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M13 8.5c.9.4 1.5 1.1 1.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="12" cy="5" r="1.8" stroke="currentColor" strokeWidth="1.5"/></svg>,
  briefcase:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><rect x="1.5" y="5.5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 5.5V4a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 10.5 4v1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M1.5 9.5h13" stroke="currentColor" strokeWidth="1.5"/></svg>,
  settings:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  arrow:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowUp:(p)=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  arrowDown:(p)=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M6 3v6M9 6L6 9 3 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevDown:(p)=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  chevRight:(p)=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" {...p}><path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  close:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  bell:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 2a4 4 0 0 1 4 4v2.5l1.5 2.5H2.5L4 8.5V6a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5"/></svg>,
  moon:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M13.5 10.5a6 6 0 0 1-8-8A6 6 0 1 0 13.5 10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  sun:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  spark:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 1.5l1.8 4.7H15l-4 2.9 1.5 4.6L8 11l-4.5 2.7L5 9.1 1 6.2h5.2L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  send:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M14 2L7 9M14 2L9.5 14 7 9 2 6.5 14 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  user:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  menu:(p)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...p}><path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  home:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M2 7L8 2l6 5v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  clock:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="M7 4.5V7l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  warning:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M8 2L14.5 13.5H1.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.75" fill="currentColor"/></svg>,
  file:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M9 1.5H3.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V6L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M9 1.5V6h4.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  trending:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M1 10l3.5-3.5 3 3L12 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 3h3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  trendingDown:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M1 4l3.5 3.5 3-3L12 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11h3V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  plus:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  search:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  logout:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M6.5 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3.5M10 11l3-3-3-3M5 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  checkCircle:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5 8l2.5 2.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  snooze:(p)=><svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}><circle cx="7" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5.5l4 0M5 9.5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  euro:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M11 4.5A4.5 4.5 0 1 0 11 11.5M3 7.5h6M3 9.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  zap:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><path d="M9.5 1.5L4 9h4.5L6.5 14.5l6-8H8.5L9.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  info:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 7.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="5.5" r="0.8" fill="currentColor"/></svg>,
  pricing:(p)=><svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...p}><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5.5v1c0 .8.7 1.5 1.5 1.5S11 8.8 11 9.5 10.3 11 9.5 11H8m0-5.5H6.5A1.5 1.5 0 0 0 5 7a1.5 1.5 0 0 0 1.5 1.5H8m0 2.5v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
};

// ── Button ─────────────────────────────────────────────────────────────────
function Btn({children,variant='primary',size='md',loading,disabled,fullWidth,onClick,style,...rest}){
  const [hov,setHov]=React.useState(false);
  const sz={xs:[26,'0 9px',11,5],sm:[30,'0 12px',12,6],md:[36,'0 16px',13.5,7],lg:[42,'0 20px',15,8],xl:[50,'0 24px',16,10]}[size]||[36,'0 16px',13.5,7];
  const bg={primary:['var(--blue)','var(--blue-hover)','#fff'],secondary:['var(--bg-4)','var(--bg-hover)','var(--text)'],ghost:['transparent','var(--bg-hover)','var(--text-2)'],danger:['var(--danger-subtle)','var(--danger)','var(--danger-text)'],blue:['var(--blue-subtle)','var(--blue)','var(--blue-text)']}[variant]||['var(--blue)','var(--blue-hover)','#fff'];
  const borderMap={secondary:'1px solid var(--border-2)',ghost:'1px solid var(--border)',danger:'1px solid var(--danger-border)',blue:'1px solid var(--blue-border)'};
  return(
    <button onClick={onClick} disabled={disabled||loading}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:sz[3],
        height:sz[0],padding:sz[1],fontSize:sz[2],fontWeight:500,fontFamily:'var(--font)',
        borderRadius:'var(--r-md)',transition:'all var(--t-fast)',
        background:hov&&!disabled?bg[1]:bg[0],
        color:hov&&variant==='danger'&&!disabled?'#fff':bg[2],
        border:borderMap[variant]||'none',
        width:fullWidth?'100%':'auto',letterSpacing:'-0.01em',whiteSpace:'nowrap',flexShrink:0,
        opacity:disabled?.5:1,cursor:disabled||loading?'not-allowed':'pointer',...style}} {...rest}>
      {loading&&<svg width="13" height="13" viewBox="0 0 13 13" style={{animation:'spin .8s linear infinite'}}><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="18 10"/></svg>}
      {children}
    </button>
  );
}

// ── Input ──────────────────────────────────────────────────────────────────
function TwInput({label,hint,error,prefix,suffix,type='text',style,inputStyle,...rest}){
  return(
    <div style={{display:'flex',flexDirection:'column',gap:5,...style}}>
      {label&&<label style={{fontSize:'var(--text-sm)',fontWeight:500,color:'var(--text-2)'}}>{label}</label>}
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        {prefix&&<span style={{position:'absolute',left:11,color:'var(--text-3)',display:'flex'}}>{prefix}</span>}
        <input type={type} style={{
          width:'100%',height:38,padding:`0 ${suffix?36:12}px 0 ${prefix?36:12}px`,
          background:'var(--bg-3)',border:'1px solid '+(error?'var(--danger-border)':'var(--border-2)'),
          borderRadius:'var(--r-md)',color:'var(--text)',fontSize:'var(--text-base)',
          outline:'none',transition:'border-color var(--t-fast),box-shadow var(--t-fast)',
          fontFamily:'var(--font)',...inputStyle}}
          onFocus={e=>{e.target.style.borderColor='var(--blue)';e.target.style.boxShadow='var(--sh-focus)'}}
          onBlur={e=>{e.target.style.borderColor=error?'var(--danger-border)':'var(--border-2)';e.target.style.boxShadow='none'}}
          {...rest}/>
        {suffix&&<span style={{position:'absolute',right:11,color:'var(--text-3)',display:'flex'}}>{suffix}</span>}
      </div>
      {(hint||error)&&<span style={{fontSize:'var(--text-xs)',color:error?'var(--danger-text)':'var(--text-3)'}}>{error||hint}</span>}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({label,value,trend,trendLabel,accent,loading,mono,icon}){
  const trendUp=trend>0;
  return(
    <div className="card" style={{padding:'20px 22px',background:accent?'var(--blue-subtle)':'var(--bg-3)',border:`1px solid ${accent?'var(--blue-border)':'var(--border)'}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
        <span className="eyebrow" style={{color:accent?'var(--blue-text)':'var(--text-3)'}}>{label}</span>
        {icon&&<span style={{color:accent?'var(--blue-text)':'var(--text-3)',display:'flex'}}>{icon}</span>}
      </div>
      {loading?<div className="skel" style={{height:36,width:'70%',marginBottom:8}}/>:
        <div style={{fontFamily:mono?'var(--mono)':'var(--font)',fontSize:'var(--text-3xl)',fontWeight:700,color:accent?'var(--blue-text)':'var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>
          {value}
        </div>}
      {trend!=null&&!loading&&(
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:8,fontSize:'var(--text-sm)'}}>
          <span style={{display:'flex',alignItems:'center',gap:3,color:trendUp?'var(--ok)':'var(--danger)'}}>
            {trendUp?<IC.arrowUp/>:<IC.arrowDown/>}{Math.abs(trend)}%
          </span>
          {trendLabel&&<span style={{color:'var(--text-3)'}}>{trendLabel}</span>}
        </div>)}
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
function ProgressBar({value,max=100,color='var(--blue)',height=6,label,showPct}){
  const pct=Math.min(100,Math.round((value/max)*100));
  return(
    <div>
      {(label||showPct)&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:5,fontSize:'var(--text-sm)',color:'var(--text-2)'}}>
        {label&&<span>{label}</span>}
        {showPct&&<span style={{fontFamily:'var(--mono)',fontWeight:600}}>{pct}%</span>}
      </div>}
      <div style={{height,background:'var(--border)',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:99,transition:'width .8s ease'}}/>
      </div>
    </div>
  );
}

// ── Progress Ring ──────────────────────────────────────────────────────────
function ProgressRing({value,size=72,stroke=6,color}){
  const r=(size-stroke)/2,circ=2*Math.PI*r,dash=(value/100)*circ;
  const c=color||(value>=75?'var(--ok)':value>=45?'var(--warn)':'var(--danger)');
  return(
    <div style={{position:'relative',width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:'stroke-dasharray .8s ease'}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <span style={{fontFamily:'var(--mono)',fontSize:size*.25,fontWeight:700,color:c,lineHeight:1}}>{value}</span>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skel({w,h,radius}){
  return <div className="skel" style={{width:w||'100%',height:h||14,borderRadius:radius||'var(--r-sm)',flexShrink:0}}/>;
}

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({name='',size=32,color}){
  const initials=(name||'').split(' ').map(n=>n[0]||'').slice(0,2).join('').toUpperCase()||'?';
  const colors=['var(--blue)','var(--ok)','var(--purple)','var(--warn)'];
  const bg=color||colors[(name||'').charCodeAt(0)%colors.length];
  return(
    <div style={{width:size,height:size,borderRadius:'50%',background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:700,color:'#fff',flexShrink:0,letterSpacing:'-0.02em'}}>
      {initials}
    </div>
  );
}

// ── Logo ───────────────────────────────────────────────────────────────────
function Logo({size=28,showText=true}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:9}}>
      <div style={{width:size,height:size,borderRadius:size*.3,background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width={size*.58} height={size*.58} viewBox="0 0 16 16" fill="none">
          <path d="M3 12L8 3l5 9H3z" fill="#fff" fillOpacity=".9"/>
          <path d="M5.5 12L8 8.5l2.5 3.5" fill="#fff" fillOpacity=".5"/>
        </svg>
      </div>
      {showText&&<span style={{fontSize:16,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em'}}>Tax<span style={{color:'var(--blue)'}}>Wijs</span></span>}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
const NAV_ITEMS=[
  {id:'landing',label:'Home',icon:'home',group:'top',hidden:true},
  {id:'dashboard',label:'Dashboard',icon:'grid',group:'top'},
  {id:'chat',label:'AI Chat',icon:'chat',group:'top'},
  {id:'calculator',label:'Calculator',icon:'calc',group:'top'},
  {id:'deduction',label:'Deductions',icon:'check',group:'tools'},
  {id:'expat',label:'Expat Guide',icon:'globe',group:'tools'},
  {id:'accountant',label:'Accountant',icon:'users',group:'portals'},
  {id:'client',label:'Client Portal',icon:'briefcase',group:'portals'},
  {id:'pricing',label:'Pricing',icon:'pricing',group:'bottom'},
];

function SidebarItem({id,label,icon,active,onClick,collapsed}){
  const [hov,setHov]=React.useState(false);
  const IconComp=IC[icon]||(()=>null);
  return(
    <button onClick={onClick}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      title={collapsed?label:undefined}
      style={{display:'flex',alignItems:'center',gap:10,width:'100%',padding:collapsed?'0':'0 10px',height:36,
        justifyContent:collapsed?'center':'flex-start',borderRadius:'var(--r-md)',
        background:active?'var(--blue-subtle)':hov?'var(--bg-hover)':'transparent',
        color:active?'var(--blue-text)':hov?'var(--text)':'var(--text-3)',
        transition:'all var(--t-fast)',fontWeight:active?600:400,fontSize:'var(--text-sm)'}}>
      <span style={{display:'flex',flexShrink:0}}><IconComp/></span>
      {!collapsed&&<span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>}
      {active&&!collapsed&&<span style={{marginLeft:'auto',width:5,height:5,borderRadius:'50%',background:'var(--blue)',flexShrink:0}}/>}
    </button>
  );
}

function Sidebar({page,setPage,collapsed}){
  const groups=[
    {key:'top',label:null,items:NAV_ITEMS.filter(n=>!n.hidden&&n.group==='top')},
    {key:'tools',label:'Tools',items:NAV_ITEMS.filter(n=>n.group==='tools')},
    {key:'portals',label:'Portals',items:NAV_ITEMS.filter(n=>n.group==='portals')},
  ];
  return(
    <nav style={{width:collapsed?60:'var(--sidebar-w)',flexShrink:0,background:'var(--bg-2)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',height:'100svh',position:'sticky',top:0,transition:'width var(--t-slow)',overflow:'hidden'}}>
      <div style={{padding:'16px',display:'flex',alignItems:'center',justifyContent:collapsed?'center':'flex-start',borderBottom:'1px solid var(--border)',flexShrink:0}}>
        <Logo showText={!collapsed}/>
      </div>
      <div style={{flex:1,overflowY:'auto',overflowX:'hidden',padding:'10px 8px',display:'flex',flexDirection:'column',gap:2}}>
        {groups.map(g=>(
          <div key={g.key}>
            {g.label&&!collapsed&&<div className="eyebrow" style={{padding:'10px 10px 4px',color:'var(--text-4)',fontSize:10}}>{g.label}</div>}
            {collapsed&&g.label&&<div style={{height:1,background:'var(--border)',margin:'6px 8px'}}/>}
            {g.items.map(item=><SidebarItem key={item.id} {...item} active={page===item.id} onClick={()=>setPage(item.id)} collapsed={collapsed}/>)}
          </div>
        ))}
      </div>
      <div style={{padding:'8px',borderTop:'1px solid var(--border)',flexShrink:0}}>
        <SidebarItem id="settings" label="Settings" icon="settings" active={page==='settings'} onClick={()=>setPage('settings')} collapsed={collapsed}/>
        <SidebarItem id="logout" label="Log out" icon="logout" onClick={()=>setPage('landing')} collapsed={collapsed}/>
      </div>
    </nav>
  );
}

// ── App Top Bar ────────────────────────────────────────────────────────────
function AppTopBar({title,theme,setTheme,lang,setLang,setPage}){
  const isMob=useMediaQuery('(max-width:768px)');
  return(
    <header style={{height:'var(--topbar-h)',padding:'0 20px',background:'var(--bg-2)',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',gap:12,flexShrink:0,position:'sticky',top:0,zIndex:'var(--z-drop)'}}>
      {isMob&&<Btn variant="ghost" size="sm" onClick={()=>setPage('landing')} style={{padding:'0 8px'}}><IC.home style={{color:'var(--text-3)'}}/></Btn>}
      <span style={{fontWeight:600,fontSize:'var(--text-md)',flex:1,letterSpacing:'-0.02em'}}>{title}</span>
      <div style={{display:'flex',alignItems:'center',gap:6}}>
        <div style={{display:'flex',gap:2,background:'var(--bg-3)',borderRadius:'var(--r-md)',border:'1px solid var(--border)',padding:2}}>
          {['en','nl','fa'].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:'2px 8px',borderRadius:'var(--r-sm)',fontSize:'var(--text-xs)',fontWeight:lang===l?700:400,background:lang===l?'var(--bg-hover)':'transparent',color:lang===l?'var(--text)':'var(--text-3)',transition:'all var(--t-fast)',cursor:'pointer',border:'none',fontFamily:'var(--font)'}}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')} style={{width:34,padding:0,justifyContent:'center'}}>
          {theme==='dark'?<IC.sun style={{color:'var(--text-2)'}}/>:<IC.moon style={{color:'var(--text-2)'}}/>}
        </Btn>
        <div style={{position:'relative'}}>
          <Btn variant="ghost" size="sm" style={{width:34,padding:0,justifyContent:'center'}}>
            <IC.bell style={{color:'var(--text-2)'}}/>
          </Btn>
          <span style={{position:'absolute',top:4,right:6,width:7,height:7,borderRadius:'50%',background:'var(--danger)',border:'1.5px solid var(--bg-2)'}}/>
        </div>
        <Avatar name="Alex de Vries" size={28}/>
      </div>
    </header>
  );
}

// ── Bottom Nav (mobile) ────────────────────────────────────────────────────
function BottomNav({page,setPage}){
  const items=[{id:'dashboard',label:'Home',icon:'grid'},{id:'chat',label:'Chat',icon:'chat'},{id:'calculator',label:'Calc',icon:'calc'},{id:'deduction',label:'Check',icon:'check'},{id:'accountant',label:'More',icon:'users'}];
  return(
    <nav style={{position:'fixed',bottom:0,left:0,right:0,background:'var(--bg-2)',borderTop:'1px solid var(--border)',display:'flex',zIndex:'var(--z-sidebar)',paddingBottom:'env(safe-area-inset-bottom)'}}>
      {items.map(item=>{
        const IconComp=IC[item.icon]||(()=>null);
        const active=page===item.id;
        return(
          <button key={item.id} onClick={()=>setPage(item.id)}
            style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'9px 0',cursor:'pointer',border:'none',background:'transparent',fontFamily:'var(--font)',color:active?'var(--blue)':'var(--text-3)',transition:'color var(--t-fast)'}}>
            <span style={{display:'flex'}}><IconComp style={{width:20,height:20}}/></span>
            <span style={{fontSize:10,fontWeight:active?600:400,letterSpacing:'0.01em'}}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── App Layout ─────────────────────────────────────────────────────────────
function AppLayout({children,page,setPage,theme,setTheme,lang,setLang,title='Dashboard'}){
  const isMob=useMediaQuery('(max-width:768px)');
  const isTab=useMediaQuery('(max-width:1024px)');
  const collapsed=isTab&&!isMob;
  const PAGE_TITLES={dashboard:'Dashboard',chat:'AI Tax Chat',calculator:'Tax Calculator',deduction:'Deduction Checker',expat:'Expat Tax Guide',accountant:'Accountant Portal',client:'Client Portal',pricing:'Pricing',settings:'Settings'};
  return(
    <div style={{display:'flex',minHeight:'100svh',background:'var(--bg)'}}>
      {!isMob&&<Sidebar page={page} setPage={setPage} collapsed={collapsed}/>}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
        <AppTopBar title={PAGE_TITLES[page]||title} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang} setPage={setPage}/>
        <main style={{flex:1,overflow:'auto',padding:isMob?'16px':isTab?'20px 24px':'24px 32px',paddingBottom:isMob?'80px':'24px'}}>
          {children}
        </main>
      </div>
      {isMob&&<BottomNav page={page} setPage={setPage}/>}
    </div>
  );
}

// ── Exports ────────────────────────────────────────────────────────────────
Object.assign(window,{IC,Btn,TwInput,KPICard,ProgressBar,ProgressRing,Skel,Avatar,Logo,Sidebar,AppTopBar,BottomNav,AppLayout,NAV_ITEMS,useMediaQuery});
