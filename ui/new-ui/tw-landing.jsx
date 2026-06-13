// tw-landing.jsx — TaxWijs Landing Page sections + page
const {useState:useStateL,useEffect:useEffectL,useRef:useRefL}=React;

function LandingNav({setPage,theme,setTheme,lang,setLang}){
  const [scrolled,setScrolled]=React.useState(false);
  const isMob=useMediaQuery('(max-width:768px)');
  const t=(LT[lang]||LT.en).nav;
  React.useEffect(()=>{const h=()=>setScrolled(window.scrollY>20);window.addEventListener('scroll',h);return()=>window.removeEventListener('scroll',h);},[]);
  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:'var(--z-modal)',padding:isMob?'0 16px':'0 28px',height:60,display:'flex',alignItems:'center',gap:16,
      background:scrolled?'color-mix(in okl, var(--bg) 85%, transparent)':'transparent',
      backdropFilter:scrolled?'blur(16px) saturate(180%)':'none',WebkitBackdropFilter:scrolled?'blur(16px) saturate(180%)':'none',
      borderBottom:`1px solid ${scrolled?'var(--border)':'transparent'}`,transition:'all var(--t-slow)'}}>
      <Logo/>
      {!isMob&&<div style={{display:'flex',gap:2,marginInlineStart:8}}>
        {[t.features,t.pricing].map((l,i)=>(
          <button key={i} onClick={()=>setPage(i===0?'dashboard':'pricing')} style={{padding:'6px 12px',borderRadius:'var(--r-md)',fontSize:'var(--text-sm)',color:'var(--text-2)',background:'transparent',border:'none',cursor:'pointer',fontFamily:'var(--font)',transition:'color var(--t-fast)'}}
            onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-2)'}>{l}</button>
        ))}
      </div>}
      <div style={{flex:1}}/>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{display:'flex',gap:2,background:'var(--bg-3)',borderRadius:'var(--r-md)',border:'1px solid var(--border)',padding:2}}>
          {['en','nl','fa'].map(l=>(
            <button key={l} onClick={()=>setLang(l)} style={{padding:'3px 8px',borderRadius:'var(--r-sm)',fontSize:'var(--text-xs)',fontWeight:lang===l?700:500,background:lang===l?'var(--bg-hover)':'transparent',color:lang===l?'var(--text)':'var(--text-3)',cursor:'pointer',border:'none',fontFamily:'var(--font)',transition:'all var(--t-fast)'}}>{l.toUpperCase()}</button>
          ))}
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setTheme(x=>x==='dark'?'light':'dark')} style={{width:32,padding:0,justifyContent:'center'}}>
          {theme==='dark'?<IC.sun style={{color:'var(--text-2)'}}/>:<IC.moon style={{color:'var(--text-2)'}}/>}
        </Btn>
        {!isMob&&<Btn variant="ghost" size="sm" onClick={()=>setPage('dashboard')}>{t.signin}</Btn>}
        <Btn size="sm" onClick={()=>setPage('dashboard')} style={{background:'var(--blue)',color:'#fff',border:'none'}}>{t.cta}<IC.arrow style={{color:'#fff'}}/></Btn>
      </div>
    </nav>
  );
}

function HeroDemo(){
  const [typed,setTyped]=React.useState('');
  const [showAns,setShowAns]=React.useState(false);
  const fullQ='Am I eligible for zelfstandigenaftrek?';
  React.useEffect(()=>{
    let i=0;const ti=setInterval(()=>{i++;setTyped(fullQ.slice(0,i));if(i>=fullQ.length){clearInterval(ti);setTimeout(()=>setShowAns(true),450);}},42);
    return()=>clearInterval(ti);
  },[]);
  return(
    <div style={{background:'var(--bg-3)',border:'1px solid var(--border-2)',borderRadius:'var(--r-xl)',padding:18,boxShadow:'var(--sh-lg)',animation:'floatY 6s ease-in-out infinite'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:14,borderBottom:'1px solid var(--border)',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:28,height:28,borderRadius:'var(--r-sm)',background:'var(--blue-subtle)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.spark style={{color:'var(--blue)',width:14,height:14}}/></div>
          <span style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}}>TaxWijs AI</span>
          <span style={{width:6,height:6,borderRadius:'50%',background:'var(--ok)',animation:'pulse 2s infinite'}}/>
        </div>
        <span style={{fontSize:'var(--text-xs)',color:'var(--text-4)',fontFamily:'var(--mono)'}}>2.1s</span>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
        <div style={{padding:'10px 14px',borderRadius:'14px 14px 4px 14px',background:'var(--blue)',color:'#fff',fontSize:'var(--text-sm)',maxWidth:260,lineHeight:1.5}}>
          {typed}{!showAns&&<span style={{display:'inline-block',width:2,height:13,background:'#fff',marginInlineStart:2,verticalAlign:'middle',animation:'pulse 1s infinite'}}/>}
        </div>
      </div>
      {showAns?(
        <div className="afu" style={{background:'var(--bg-4)',borderRadius:'4px 14px 14px 14px',padding:'13px 15px',border:'1px solid var(--border)'}}>
          <p style={{fontSize:'var(--text-sm)',color:'var(--text-2)',lineHeight:1.6,marginBottom:11}}>
            <span style={{color:'var(--ok-text)',fontWeight:600}}>Yes — you qualify.</span> With €72,000 revenue and 1,340 hours logged, you meet both the income and urencriterium thresholds.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:11}}>
            {[['Zelfstandigenaftrek','€3,750'],['MKB-vrijstelling','12.7%'],['Estimated saving','€3,847'],['Hours criterion','✓ met']].map(([k,v])=>(
              <div key={k} style={{background:'var(--bg-3)',borderRadius:'var(--r-md)',padding:'8px 10px'}}>
                <div style={{fontSize:10,color:'var(--text-3)',marginBottom:3}}>{k}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:'var(--text-xs)',color:'var(--text-4)'}}>
            <IC.info style={{width:12,height:12,flexShrink:0}}/> Source: belastingdienst.nl · zelfstandigenaftrek
          </div>
        </div>
      ):(
        <div style={{display:'flex',gap:5,padding:'12px 14px',alignItems:'center'}}>
          {[0,.15,.3].map((d,i)=><span key={i} style={{width:7,height:7,borderRadius:'50%',background:'var(--text-3)',animation:`dotBounce 1.2s ${d}s infinite`}}/>)}
        </div>
      )}
    </div>
  );
}

function Hero({setPage,lang}){
  const t=(LT[lang]||LT.en).hero;
  const isMob=useMediaQuery('(max-width:900px)');
  return(
    <section style={{minHeight:'100svh',display:'flex',flexDirection:'column',justifyContent:'center',padding:isMob?'90px 18px 50px':'80px 56px 70px',position:'relative',overflow:'hidden',
      background:'radial-gradient(ellipse 70% 60% at 12% 55%, var(--blue-subtle) 0%, transparent 55%), radial-gradient(ellipse 50% 50% at 88% 12%, color-mix(in oklab, var(--blue-subtle) 60%, transparent) 0%, transparent 50%)'}}>
      <div className="dot-grid" style={{position:'absolute',inset:0,opacity:.45,maskImage:'radial-gradient(ellipse 80% 80% at 50% 40%, #000 30%, transparent 75%)'}}/>
      <div style={{maxWidth:1180,margin:'0 auto',width:'100%',display:'grid',gridTemplateColumns:isMob?'1fr':'1.05fr .95fr',gap:isMob?40:64,alignItems:'center',position:'relative'}}>
        <div>
          <div className="afu" style={{animationDelay:'.05s',display:'inline-flex',alignItems:'center',gap:8,padding:'5px 14px',borderRadius:'var(--r-full)',background:'var(--blue-subtle)',border:'1px solid var(--blue-border)',marginBottom:22}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--blue)',flexShrink:0}}/>
            <span style={{fontSize:11,fontWeight:700,color:'var(--blue-text)',letterSpacing:'.05em'}}>{t.badge}</span>
          </div>
          <h1 className="afu" style={{animationDelay:'.14s',fontSize:isMob?'clamp(2.3rem,9vw,3.1rem)':'clamp(2.9rem,4.3vw,4.3rem)',lineHeight:1.06,fontWeight:800,letterSpacing:'-0.04em',color:'var(--text)',margin:0,textWrap:'balance'}}>
            <span style={{display:'block'}}>{t.h1a}</span>
            <span style={{display:'block',color:'var(--blue)'}}>{t.h1b}</span>
          </h1>
          <p className="afu" style={{animationDelay:'.26s',marginTop:20,fontSize:'var(--text-md)',lineHeight:1.7,color:'var(--text-2)',maxWidth:470,textWrap:'pretty'}}>{t.sub}</p>
          <div className="afu" style={{animationDelay:'.38s',marginTop:28,display:'flex',flexWrap:'wrap',gap:10}}>
            <Btn size="xl" onClick={()=>setPage('dashboard')} style={{background:'var(--blue)',color:'#fff',border:'none'}}>{t.cta1}<IC.arrow style={{color:'#fff'}}/></Btn>
            <Btn variant="secondary" size="xl" onClick={()=>setPage('chat')}><IC.spark style={{color:'var(--blue-text)'}}/>{t.cta2}</Btn>
          </div>
          <div className="afu" style={{animationDelay:'.50s',marginTop:22,display:'flex',flexWrap:'wrap',gap:'8px 20px',fontSize:'var(--text-sm)',color:'var(--text-3)'}}>
            {[t.t1,t.t2,t.t3].map((tr,i)=>(
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:6}}>
                <span style={{width:16,height:16,borderRadius:'50%',background:'var(--ok-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IC.check style={{width:9,height:9,color:'var(--ok)'}}/></span>{tr}
              </span>
            ))}
          </div>
        </div>
        {!isMob&&<div className="afu" style={{animationDelay:'.3s'}}><HeroDemo/></div>}
      </div>
    </section>
  );
}

function StatsBar({lang}){
  const T=(LT[lang]||LT.en);
  return(
    <section style={{padding:'0 24px 20px'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <Reveal><p style={{textAlign:'center',fontSize:'var(--text-sm)',color:'var(--text-3)',marginBottom:28,letterSpacing:'.01em'}}>{T.social}</p></Reveal>
        <Reveal delay={.08}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:1,background:'var(--border)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',overflow:'hidden'}}>
            {T.stats.map(([v,l],i)=>(
              <div key={i} style={{background:'var(--bg-2)',padding:'26px 20px',textAlign:'center'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:'clamp(1.6rem,3vw,2.1rem)',fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>{v}</div>
                <div style={{fontSize:'var(--text-sm)',color:'var(--text-3)',marginTop:7}}>{l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Features({lang,setPage}){
  const T=(LT[lang]||LT.en).feat;
  return(
    <section style={{padding:'90px 24px'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <Reveal><SecHead label={T.label} title={T.title} sub={T.sub} center/></Reveal>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}}>
          {T.items.map((it,i)=>{
            const IconComp=IC[it.ic]||IC.spark;
            return(
              <Reveal key={i} delay={(i%3)*.08}>
                <FeatureCard it={it} IconComp={IconComp} onClick={()=>setPage(['chat','calculator','deduction','expat','dashboard','accountant'][i])}/>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
function FeatureCard({it,IconComp,onClick}){
  const [hov,setHov]=React.useState(false);
  return(
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:'var(--bg-3)',border:`1px solid ${hov?'var(--blue-border)':'var(--border)'}`,borderRadius:'var(--r-lg)',padding:24,cursor:'pointer',transition:'all var(--t-base)',transform:hov?'translateY(-3px)':'none',boxShadow:hov?'var(--sh-md)':'none',height:'100%'}}>
      <div style={{width:42,height:42,borderRadius:'var(--r-md)',background:hov?'var(--blue)':'var(--blue-subtle)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16,transition:'background var(--t-base)'}}>
        <IconComp style={{width:20,height:20,color:hov?'#fff':'var(--blue-text)'}}/>
      </div>
      <h3 style={{fontSize:'var(--text-lg)',fontWeight:700,letterSpacing:'-0.02em',marginBottom:8,color:'var(--text)'}}>{it.title}</h3>
      <p style={{fontSize:'var(--text-base)',lineHeight:1.6,color:'var(--text-2)',textWrap:'pretty'}}>{it.sub}</p>
      <div style={{marginTop:14,display:'flex',alignItems:'center',gap:5,fontSize:'var(--text-sm)',fontWeight:600,color:'var(--blue-text)',opacity:hov?1:.6,transition:'opacity var(--t-base)'}}>
        Explore<IC.arrow style={{transform:hov?'translateX(3px)':'none',transition:'transform var(--t-base)'}}/>
      </div>
    </div>
  );
}

window.LandingNav=LandingNav;window.Hero=Hero;window.StatsBar=StatsBar;window.Features=Features;
