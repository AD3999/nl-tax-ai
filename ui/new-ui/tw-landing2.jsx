// tw-landing2.jsx — TaxWijs Landing showcases, testimonials, FAQ, footer + page

function ChatShowcase({lang,setPage}){
  const T=(LT[lang]||LT.en).chatShow;
  const isMob=useMediaQuery('(max-width:900px)');
  return(
    <section style={{padding:'70px 24px',background:'var(--bg-2)',borderBlock:'1px solid var(--border)'}}>
      <div style={{maxWidth:1180,margin:'0 auto',display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:isMob?40:64,alignItems:'center'}}>
        <Reveal>
          <SecHead label={T.label} title={T.title} sub={T.sub}/>
          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            {T.pts.map(([h,d],i)=>(
              <div key={i} style={{display:'flex',gap:14}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:'var(--blue-subtle)',border:'1px solid var(--blue-border)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}><IC.check style={{width:14,height:14,color:'var(--blue-text)'}}/></div>
                <div><div style={{fontWeight:600,color:'var(--text)',marginBottom:3}}>{h}</div><div style={{fontSize:'var(--text-base)',color:'var(--text-2)',lineHeight:1.55}}>{d}</div></div>
              </div>
            ))}
          </div>
          <Btn size="lg" onClick={()=>setPage('chat')} style={{marginTop:26,background:'var(--blue)',color:'#fff',border:'none'}}>Open AI Chat<IC.arrow style={{color:'#fff'}}/></Btn>
        </Reveal>
        <Reveal delay={.1}>
          <div style={{background:'var(--bg-3)',border:'1px solid var(--border-2)',borderRadius:'var(--r-xl)',padding:20,boxShadow:'var(--sh-lg)'}}>
            <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}>
              <div style={{padding:'9px 13px',borderRadius:'14px 14px 4px 14px',background:'var(--blue)',color:'#fff',fontSize:'var(--text-sm)',maxWidth:280}}>I have a BV and pay myself a salary. What's the DGA minimum for 2026?</div>
            </div>
            <div style={{display:'flex',gap:10,marginBottom:6}}>
              <div style={{width:28,height:28,borderRadius:'var(--r-sm)',background:'var(--blue-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IC.spark style={{width:13,height:13,color:'var(--blue)'}}/></div>
              <div style={{flex:1,fontSize:'var(--text-sm)',color:'var(--text-2)',lineHeight:1.6}}>
                For 2026 the DGA minimum salary (gebruikelijk loon) is <strong style={{color:'var(--text)'}}>€56,000</strong>, or the highest-earning employee's salary, whichever is higher. You can apply the 75% rule if you can demonstrate a lower market wage.
              </div>
            </div>
            <div style={{marginInlineStart:38,marginTop:10,display:'flex',flexWrap:'wrap',gap:7}}>
              {['📌 Save to dashboard','Calculate my salary','What about pension?'].map((a,i)=>(
                <button key={i} style={{padding:'6px 12px',borderRadius:'var(--r-full)',border:'1px solid var(--border-2)',background:'var(--bg-4)',color:'var(--text-2)',fontSize:'var(--text-xs)',cursor:'pointer',fontFamily:'var(--font)',fontWeight:500}}>{a}</button>
              ))}
            </div>
            <div style={{marginInlineStart:38,marginTop:12,display:'flex',alignItems:'center',gap:6,fontSize:'var(--text-xs)',color:'var(--text-4)',paddingTop:10,borderTop:'1px solid var(--border)'}}><IC.info style={{width:12,height:12}}/> belastingdienst.nl · gebruikelijkloonregeling</div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DashShowcase({lang,setPage}){
  const T=(LT[lang]||LT.en).dashShow;
  return(
    <section style={{padding:'90px 24px'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <Reveal><SecHead label={T.label} title={T.title} sub={T.sub} center/></Reveal>
        <Reveal delay={.1}>
          <div style={{background:'var(--bg-2)',border:'1px solid var(--border-2)',borderRadius:'var(--r-2xl)',padding:'clamp(12px,2vw,24px)',boxShadow:'var(--sh-lg)',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 50% 70% at 80% 0%, var(--blue-subtle) 0%, transparent 60%)',opacity:.6,pointerEvents:'none'}}/>
            <div style={{position:'relative',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:14}}>
              {[['Estimated refund','€3,847','var(--ok)',12],['Tax owed (Box 1)','€11,240','var(--text)',-4],['Deductions found','€6,120','var(--blue)',28],['Return progress','72%','var(--warn)',null]].map(([l,v,c,tr],i)=>(
                <div key={i} className="card" style={{padding:'16px 18px',background:'var(--bg-3)'}}>
                  <div className="eyebrow" style={{fontSize:10,marginBottom:8}}>{l}</div>
                  <div style={{fontFamily:'var(--mono)',fontSize:'var(--text-2xl)',fontWeight:700,color:c,letterSpacing:'-0.03em'}}>{v}</div>
                  {tr!=null&&<div style={{marginTop:6,fontSize:'var(--text-xs)',color:tr>0?'var(--ok)':'var(--danger)',display:'flex',alignItems:'center',gap:3}}>{tr>0?<IC.arrowUp/>:<IC.arrowDown/>}{Math.abs(tr)}% vs 2024</div>}
                </div>
              ))}
            </div>
            <div style={{position:'relative',display:'grid',gridTemplateColumns:'2fr 1fr',gap:14}}>
              <div className="card" style={{padding:18,background:'var(--bg-3)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}><span style={{fontWeight:600}}>Tax timeline 2026</span><span className="pill pill-warn">2 deadlines</span></div>
                <div style={{display:'flex',flexDirection:'column',gap:11}}>
                  {[['Provisional assessment','Mar 1','done'],['Income tax return (IB)','May 1','active'],['VAT Q2 filing','Jul 31','upcoming']].map(([n,d,s],i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',gap:11}}>
                      <span style={{width:9,height:9,borderRadius:'50%',background:s==='done'?'var(--ok)':s==='active'?'var(--warn)':'var(--border-3)',flexShrink:0}}/>
                      <span style={{flex:1,fontSize:'var(--text-sm)',color:s==='upcoming'?'var(--text-3)':'var(--text)'}}>{n}</span>
                      <span style={{fontFamily:'var(--mono)',fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{padding:18,background:'var(--blue-subtle)',border:'1px solid var(--blue-border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}><IC.spark style={{width:15,height:15,color:'var(--blue-text)'}}/><span style={{fontWeight:600,fontSize:'var(--text-sm)',color:'var(--blue-text)'}}>AI insight</span></div>
                <p style={{fontSize:'var(--text-sm)',lineHeight:1.55,color:'var(--text-2)'}}>You haven't logged hours this quarter. Logging 280 more could unlock the <strong style={{color:'var(--text)'}}>urencriterium</strong> and €3,750 in deductions.</p>
              </div>
            </div>
          </div>
        </Reveal>
        <div style={{textAlign:'center',marginTop:28}}><Btn size="lg" onClick={()=>setPage('dashboard')} style={{background:'var(--blue)',color:'#fff',border:'none'}}>Open dashboard<IC.arrow style={{color:'#fff'}}/></Btn></div>
      </div>
    </section>
  );
}

function AcctShowcase({lang,setPage}){
  const T=(LT[lang]||LT.en).acctShow;
  const isMob=useMediaQuery('(max-width:900px)');
  return(
    <section style={{padding:'70px 24px',background:'var(--bg-2)',borderBlock:'1px solid var(--border)'}}>
      <div style={{maxWidth:1180,margin:'0 auto',display:'grid',gridTemplateColumns:isMob?'1fr':'.9fr 1.1fr',gap:isMob?40:64,alignItems:'center'}}>
        <Reveal delay={.1} style={{order:isMob?2:1}}>
          <div style={{background:'var(--bg-3)',border:'1px solid var(--border-2)',borderRadius:'var(--r-xl)',overflow:'hidden',boxShadow:'var(--sh-lg)'}}>
            <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontWeight:600,fontSize:'var(--text-sm)'}}>Client portfolio</span><span className="pill pill-blue">24 active</span>
            </div>
            {[['Sarah Klein','ZZP · IB 2025','low','In review'],['Acme Holding BV','VPB · Q2','high','Action needed'],['Priya Menon','30% ruling','medium','Awaiting docs'],['De Jong Bouw','VAT · monthly','low','Filed']].map(([n,t,risk,st],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 18px',borderTop:i?'1px solid var(--border)':'none'}}>
                <Avatar name={n} size={32}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}} className="trunc">{n}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{t}</div></div>
                <span style={{width:8,height:8,borderRadius:'50%',background:risk==='high'?'var(--danger)':risk==='medium'?'var(--warn)':'var(--ok)',flexShrink:0}} title={risk+' risk'}/>
                <span className={`pill ${st==='Action needed'?'pill-danger':st==='Filed'?'pill-ok':'pill-blue'}`} style={{flexShrink:0}}>{st}</span>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal style={{order:isMob?1:2}}>
          <SecHead label={T.label} title={T.title} sub={T.sub}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24}}>
            {T.pts.map((p,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:9,fontSize:'var(--text-sm)',color:'var(--text-2)'}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:'var(--ok-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IC.check style={{width:11,height:11,color:'var(--ok)'}}/></span>{p}
              </div>
            ))}
          </div>
          <Btn size="lg" onClick={()=>setPage('accountant')} style={{background:'var(--blue)',color:'#fff',border:'none'}}>Explore portal<IC.arrow style={{color:'#fff'}}/></Btn>
        </Reveal>
      </div>
    </section>
  );
}

function Testimonials({lang}){
  const T=(LT[lang]||LT.en).testi;
  return(
    <section style={{padding:'90px 24px'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <Reveal><SecHead label={T.label} title={T.title} center/></Reveal>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:16}}>
          {T.items.map((it,i)=>(
            <Reveal key={i} delay={(i%3)*.08}>
              <div className="card" style={{padding:26,background:'var(--bg-3)',height:'100%',display:'flex',flexDirection:'column'}}>
                <div style={{display:'flex',gap:2,marginBottom:14}}>{[0,1,2,3,4].map(s=><span key={s} style={{color:'var(--warn)',fontSize:14}}>★</span>)}</div>
                <p style={{fontSize:'var(--text-base)',lineHeight:1.65,color:'var(--text)',flex:1,textWrap:'pretty'}}>"{it.q}"</p>
                <div style={{display:'flex',alignItems:'center',gap:11,marginTop:20,paddingTop:18,borderTop:'1px solid var(--border)'}}>
                  <Avatar name={it.n} size={38}/>
                  <div><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}}>{it.n}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{it.r}</div></div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({lang}){
  const T=(LT[lang]||LT.en).faq;
  const [open,setOpen]=React.useState(0);
  return(
    <section style={{padding:'70px 24px',background:'var(--bg-2)',borderBlock:'1px solid var(--border)'}}>
      <div style={{maxWidth:760,margin:'0 auto'}}>
        <Reveal><SecHead label={T.label} title={T.title} center/></Reveal>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {T.items.map((it,i)=>(
            <Reveal key={i} delay={(i%4)*.05}>
              <div className="card" style={{background:'var(--bg-3)',overflow:'hidden'}}>
                <button onClick={()=>setOpen(o=>o===i?-1:i)} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'17px 20px',background:'transparent',border:'none',cursor:'pointer',fontFamily:'var(--font)',textAlign:'start'}}>
                  <span style={{flex:1,fontSize:'var(--text-base)',fontWeight:600,color:'var(--text)'}}>{it.q}</span>
                  <span style={{transform:open===i?'rotate(180deg)':'none',transition:'transform var(--t-base)',color:'var(--text-3)',display:'flex',flexShrink:0}}><IC.chevDown/></span>
                </button>
                <div style={{maxHeight:open===i?260:0,overflow:'hidden',transition:'max-height var(--t-slow)'}}>
                  <p style={{padding:'0 20px 18px',fontSize:'var(--text-base)',lineHeight:1.65,color:'var(--text-2)'}}>{it.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({lang,setPage}){
  const T=(LT[lang]||LT.en).fcta;
  return(
    <section style={{padding:'90px 24px'}}>
      <Reveal>
        <div style={{maxWidth:1000,margin:'0 auto',borderRadius:'var(--r-2xl)',padding:'clamp(40px,7vw,72px) 32px',textAlign:'center',position:'relative',overflow:'hidden',
          background:'linear-gradient(135deg, var(--blue) 0%, oklch(0.46 0.20 280) 100%)',boxShadow:'var(--sh-lg)'}}>
          <div className="dot-grid" style={{position:'absolute',inset:0,opacity:.12,backgroundImage:'radial-gradient(circle, #fff 1px, transparent 1px)'}}/>
          <div style={{position:'relative'}}>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:800,letterSpacing:'-0.03em',color:'#fff',margin:0,textWrap:'balance',lineHeight:1.1}}>{T.title}</h2>
            <p style={{marginTop:14,fontSize:'var(--text-md)',color:'rgba(255,255,255,.85)'}}>{T.sub}</p>
            <div style={{marginTop:28,display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
              <Btn size="xl" onClick={()=>setPage('dashboard')} style={{background:'#fff',color:'var(--blue)',border:'none'}}>{T.b1}<IC.arrow style={{color:'var(--blue)'}}/></Btn>
              <Btn size="xl" onClick={()=>setPage('pricing')} style={{background:'rgba(255,255,255,.14)',color:'#fff',border:'1px solid rgba(255,255,255,.3)'}}>{T.b2}</Btn>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer({lang,setPage}){
  const T=(LT[lang]||LT.en).foot;
  const isMob=useMediaQuery('(max-width:768px)');
  return(
    <footer style={{padding:'56px 24px 32px',background:'var(--bg-2)',borderTop:'1px solid var(--border)'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1.6fr 1fr 1fr 1fr',gap:36,marginBottom:40}}>
          <div>
            <Logo/>
            <p style={{marginTop:14,fontSize:'var(--text-sm)',color:'var(--text-3)',maxWidth:260,lineHeight:1.6}}>{T.tag}</p>
          </div>
          {T.cols.map(([h,links],i)=>(
            <div key={i}>
              <div className="eyebrow" style={{marginBottom:14,fontSize:10}}>{h}</div>
              <div style={{display:'flex',flexDirection:'column',gap:9}}>
                {links.map((l,j)=><button key={j} onClick={()=>{if(l==='Pricing'||l==='Prijzen'||l==='قیمت‌ها')setPage('pricing');else if(l==='AI Chat'||l==='چت AI')setPage('chat');else if(l==='Calculator'||l==='ماشین حساب')setPage('calculator');}} style={{background:'none',border:'none',color:'var(--text-3)',fontSize:'var(--text-sm)',cursor:'pointer',fontFamily:'var(--font)',textAlign:'start',padding:0,transition:'color var(--t-fast)'}} onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-3)'}>{l}</button>)}
              </div>
            </div>
          ))}
        </div>
        <div style={{paddingTop:24,borderTop:'1px solid var(--border)',display:'flex',flexWrap:'wrap',gap:16,alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'var(--text-xs)',color:'var(--text-4)',maxWidth:560,lineHeight:1.5}}>{T.note}</span>
          <span style={{fontSize:'var(--text-xs)',color:'var(--text-4)'}}>© 2026 TaxWijs</span>
        </div>
      </div>
    </footer>
  );
}

function PricingPreview({lang,setPage}){
  const T=(LT[lang]||LT.en).price;
  return(
    <section style={{padding:'90px 24px 60px'}}>
      <div style={{maxWidth:1180,margin:'0 auto'}}>
        <Reveal><SecHead label={T.label} title={T.title} sub={T.sub} center/></Reveal>
        <Reveal delay={.08}><PricingTable lang={lang} setPage={setPage} compact/></Reveal>
      </div>
    </section>
  );
}

function LandingPage({setPage,theme,setTheme,lang,setLang}){
  const isRtl=lang==='fa';
  return(
    <div dir={isRtl?'rtl':'ltr'} style={{background:'var(--bg)',minHeight:'100svh'}}>
      <LandingNav setPage={setPage} theme={theme} setTheme={setTheme} lang={lang} setLang={setLang}/>
      <Hero setPage={setPage} lang={lang}/>
      <StatsBar lang={lang}/>
      <Features lang={lang} setPage={setPage}/>
      <ChatShowcase lang={lang} setPage={setPage}/>
      <DashShowcase lang={lang} setPage={setPage}/>
      <AcctShowcase lang={lang} setPage={setPage}/>
      <Testimonials lang={lang}/>
      <PricingPreview lang={lang} setPage={setPage}/>
      <FAQ lang={lang}/>
      <FinalCTA lang={lang} setPage={setPage}/>
      <Footer lang={lang} setPage={setPage}/>
    </div>
  );
}

window.LandingPage=LandingPage;window.ChatShowcase=ChatShowcase;window.DashShowcase=DashShowcase;window.AcctShowcase=AcctShowcase;window.Testimonials=Testimonials;window.FAQ=FAQ;window.FinalCTA=FinalCTA;window.Footer=Footer;
