// tw-pricing.jsx — PricingTable + PricingPage
function PricingTable({lang,setPage,compact}){
  const [annual,setAnnual]=React.useState(true);
  const T=(LT[lang]||LT.en).price;
  const plans=[
    {name:lang==='nl'?'Starter':lang==='fa'?'رایگان':'Starter',mo:'€0',yr:'€0',sub:lang==='nl'?'Voor werknemers en eenvoudige aangiften':lang==='fa'?'برای کارمندان و اظهارنامه‌های ساده':'For employees and simple returns',
      features:['AI Tax Chat — 10 questions/mo','Basic deduction check','Box 1 calculator','Dutch, English & Farsi'],cta:lang==='nl'?'Gratis beginnen':lang==='fa'?'شروع رایگان':'Start free',accent:false},
    {name:'Pro',mo:'€12',yr:'€10',sub:lang==='nl'?'Voor ZZP, expats en zelfstandigen':lang==='fa'?'برای ZZP، مهاجران و خوداشتغالان':'For ZZP, expats & self-employed',
      features:['Unlimited AI Chat','Full deduction checker','Box 1, 2 & 3 calculator','30% ruling calculator','Complete expat guide','PDF tax report','Priority support'],cta:lang==='nl'?'14 dagen proberen':lang==='fa'?'۱۴ روز رایگان':'Start 14-day trial',accent:true},
    {name:lang==='nl'?'Accountant':lang==='fa'?'حسابدار':'Accountant',mo:'€49',yr:'€39',sub:lang==='nl'?'Voor adviseurs en kantoren':lang==='fa'?'برای مشاوران و شرکت‌ها':'For advisors & firms',
      features:['Everything in Pro','Unlimited clients','Client portal','Document management','Risk indicators','White-label reports','API access'],cta:lang==='nl'?'Demo boeken':lang==='fa'?'رزرو دمو':'Book a demo',accent:false},
  ];
  return(
    <div>
      <div style={{display:'flex',justifyContent:'center',marginBottom:36}}>
        <div style={{display:'flex',alignItems:'center',gap:4,background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--r-full)',padding:4}}>
          {[[false,T.mo],[true,T.yr]].map(([v,l])=>(
            <button key={String(v)} onClick={()=>setAnnual(v)} style={{padding:'7px 18px',borderRadius:'var(--r-full)',fontSize:'var(--text-sm)',fontWeight:600,border:'none',cursor:'pointer',fontFamily:'var(--font)',transition:'all var(--t-fast)',background:annual===v?'var(--blue)':'transparent',color:annual===v?'#fff':'var(--text-2)',display:'flex',alignItems:'center',gap:7}}>
              {l}{v&&<span style={{fontSize:10,padding:'2px 7px',borderRadius:'var(--r-full)',background:annual===v?'rgba(255,255,255,.22)':'var(--ok-subtle)',color:annual===v?'#fff':'var(--ok-text)',fontWeight:700}}>{T.save}</span>}
            </button>
          ))}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:16,alignItems:'stretch'}}>
        {plans.map((p,i)=>(
          <div key={i} style={{position:'relative',background:p.accent?'var(--bg-3)':'var(--bg-3)',border:`1.5px solid ${p.accent?'var(--blue)':'var(--border)'}`,borderRadius:'var(--r-xl)',padding:'28px 26px',display:'flex',flexDirection:'column',boxShadow:p.accent?'var(--sh-blue)':'none',transform:p.accent&&!compact?'scale(1.02)':'none'}}>
            {p.accent&&<div style={{position:'absolute',top:-11,insetInlineStart:'50%',transform:'translateX(-50%)',padding:'3px 14px',borderRadius:'var(--r-full)',background:'var(--blue)',color:'#fff',fontSize:11,fontWeight:700,letterSpacing:'.04em',whiteSpace:'nowrap'}}>MOST POPULAR</div>}
            <div style={{fontSize:'var(--text-lg)',fontWeight:700,color:'var(--text)',marginBottom:5}}>{p.name}</div>
            <div style={{fontSize:'var(--text-sm)',color:'var(--text-3)',marginBottom:18,minHeight:38}}>{p.sub}</div>
            <div style={{display:'flex',alignItems:'baseline',gap:5,marginBottom:20}}>
              <span style={{fontFamily:'var(--mono)',fontSize:'2.6rem',fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',lineHeight:1}}>{annual?p.yr:p.mo}</span>
              {p.mo!=='€0'&&<span style={{fontSize:'var(--text-sm)',color:'var(--text-3)'}}>/{lang==='nl'?'maand':lang==='fa'?'ماه':'mo'}</span>}
            </div>
            <Btn fullWidth size="lg" variant={p.accent?'primary':'secondary'} onClick={()=>setPage('dashboard')} style={p.accent?{background:'var(--blue)',color:'#fff',border:'none',marginBottom:22}:{marginBottom:22}}>{p.cta}</Btn>
            <div style={{display:'flex',flexDirection:'column',gap:11,flex:1}}>
              {p.features.map((f,j)=>(
                <div key={j} style={{display:'flex',gap:10,fontSize:'var(--text-sm)',color:'var(--text-2)',lineHeight:1.4}}>
                  <span style={{width:17,height:17,borderRadius:'50%',background:'var(--ok-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}><IC.check style={{width:10,height:10,color:'var(--ok)'}}/></span>{f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingPage({lang,setPage}){
  const compare=[
    ['AI Tax Chat','10 / month','Unlimited','Unlimited'],
    ['Tax calculator','Box 1','Box 1, 2 & 3','Box 1, 2 & 3'],
    ['Deduction checker','Basic','Full','Full'],
    ['30% ruling calculator','—','✓','✓'],
    ['Expat guide','—','✓','✓'],
    ['PDF reports','—','✓','White-label'],
    ['Client management','—','—','Unlimited'],
    ['Document vault','—','—','✓'],
    ['Risk indicators','—','—','✓'],
    ['API access','—','—','✓'],
    ['Support','Community','Priority','Dedicated'],
  ];
  const isMob=useMediaQuery('(max-width:768px)');
  return(
    <div style={{maxWidth:1080,margin:'0 auto'}}>
      <div style={{marginBottom:36}}>
        <div className="eyebrow eyebrow-blue" style={{marginBottom:10}}>PRICING</div>
        <h1 style={{fontSize:'clamp(1.7rem,3.5vw,2.3rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Pick a plan that fits</h1>
        <p style={{marginTop:10,fontSize:'var(--text-md)',color:'var(--text-2)',maxWidth:520}}>Start free, upgrade when you need more. Every plan includes Dutch, English and Farsi support.</p>
      </div>
      <PricingTable lang={lang} setPage={setPage}/>
      {!isMob&&<div className="card" style={{marginTop:48,overflow:'hidden'}}>
        <div style={{padding:'18px 22px',borderBottom:'1px solid var(--border)',fontWeight:700,fontSize:'var(--text-md)'}}>Compare all features</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr style={{background:'var(--bg-2)'}}>
            {['Feature','Starter','Pro','Accountant'].map((h,i)=><th key={i} style={{textAlign:i?'center':'start',padding:'12px 22px',fontSize:'var(--text-xs)',fontWeight:700,color:i===2?'var(--blue-text)':'var(--text-3)',letterSpacing:'.04em',textTransform:'uppercase'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {compare.map((row,i)=>(
              <tr key={i} style={{borderTop:'1px solid var(--border)'}}>
                {row.map((c,j)=>(
                  <td key={j} style={{padding:'13px 22px',fontSize:'var(--text-sm)',textAlign:j?'center':'start',color:j===0?'var(--text)':c==='—'?'var(--text-4)':'var(--text-2)',fontWeight:j===0?600:400,background:j===2?'var(--blue-subtle)':'transparent',fontFamily:c.includes('✓')||/\d/.test(c)?'var(--mono)':'var(--font)'}}>
                    {c==='✓'?<IC.check style={{width:15,height:15,color:'var(--ok)',margin:'0 auto'}}/>:c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </div>
  );
}
window.PricingTable=PricingTable;window.PricingPage=PricingPage;
