// tw-dashboard.jsx — TaxWijs Dashboard
function DashboardPage({setPage,lang}){
  const isMob=useMediaQuery('(max-width:768px)');
  const [loading,setLoading]=React.useState(true);
  React.useEffect(()=>{const t=setTimeout(()=>setLoading(false),900);return()=>clearTimeout(t);},[]);
  const hr=new Date().getHours();
  const greet=hr<12?'Good morning':hr<18?'Good afternoon':'Good evening';
  return(
    <div style={{maxWidth:1240,margin:'0 auto',display:'flex',flexDirection:'column',gap:18}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>{greet}, Alex</h1>
          <p style={{marginTop:5,fontSize:'var(--text-base)',color:'var(--text-2)'}}>Here's where your 2026 tax return stands today.</p>
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn variant="secondary" size="md" onClick={()=>setPage('calculator')}><IC.calc/>Calculator</Btn>
          <Btn size="md" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.spark style={{color:'#fff'}}/>Ask AI</Btn>
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
        <KPICard label="Estimated refund" value="€3,847" trend={12} trendLabel="vs 2024" accent loading={loading} mono icon={<IC.euro/>}/>
        <KPICard label="Tax owed · Box 1" value="€11,240" trend={-4} trendLabel="vs 2024" loading={loading} mono icon={<IC.file/>}/>
        <KPICard label="Deductions found" value="€6,120" trend={28} trendLabel="this year" loading={loading} mono icon={<IC.check/>}/>
        <KPICard label="Hours logged" value="1,340" trend={8} trendLabel="urencriterium ✓" loading={loading} mono icon={<IC.clock/>}/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1.7fr 1fr',gap:18}}>
        {/* Left column */}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {/* Progress */}
          <div className="card" style={{padding:22}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
              <div><div style={{fontWeight:700,fontSize:'var(--text-md)'}}>2026 return progress</div><div style={{fontSize:'var(--text-sm)',color:'var(--text-3)',marginTop:2}}>3 of 5 sections complete</div></div>
              <ProgressRing value={72} size={64}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:13}}>
              {[['Personal details','done'],['Income & employment','done'],['ZZP / self-employment','done'],['Deductions & allowances','active'],['Review & submit','todo']].map(([n,s],i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                    background:s==='done'?'var(--ok)':s==='active'?'var(--blue-subtle)':'var(--bg-hover)',
                    border:s==='active'?'1.5px solid var(--blue)':'none'}}>
                    {s==='done'?<IC.check style={{width:12,height:12,color:'#fff'}}/>:s==='active'?<span style={{width:7,height:7,borderRadius:'50%',background:'var(--blue)'}}/>:<span style={{fontSize:11,color:'var(--text-4)',fontFamily:'var(--mono)'}}>{i+1}</span>}
                  </span>
                  <span style={{flex:1,fontSize:'var(--text-sm)',color:s==='todo'?'var(--text-3)':'var(--text)',fontWeight:s==='active'?600:400}}>{n}</span>
                  {s==='active'&&<Btn size="xs" variant="blue" onClick={()=>setPage('deduction')}>Continue<IC.arrow/></Btn>}
                  {s==='done'&&<span style={{fontSize:'var(--text-xs)',color:'var(--ok-text)'}}>Complete</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Savings opportunities */}
          <div className="card" style={{padding:22}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:'var(--text-md)'}}>Savings opportunities</div>
              <span className="pill pill-ok">€2,490 available</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[['Zelfstandigenaftrek','You meet the hours criterion — claim the full deduction.','€3,750','ok','high'],['Kleinschaligheidsinvesteringsaftrek','New laptop & desk may qualify for KIA.','€840','blue','medium'],['Zorgtoeslag','Your income may qualify you for healthcare allowance.','est. €1,200/yr','warn','check']].map(([t,d,amt,c,p],i)=>(
                <DashOpp key={i} title={t} desc={d} amount={amt} color={c} priority={p} setPage={setPage}/>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {/* AI insight */}
          <div className="card" style={{padding:20,background:'var(--blue-subtle)',border:'1px solid var(--blue-border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:'var(--r-sm)',background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.spark style={{width:14,height:14,color:'#fff'}}/></div>
              <span style={{fontWeight:700,fontSize:'var(--text-sm)',color:'var(--blue-text)'}}>AI recommendation</span>
            </div>
            <p style={{fontSize:'var(--text-sm)',lineHeight:1.6,color:'var(--text)',marginBottom:14}}>You're €60,000 in revenue with strong deductions. Switching €18,000 to a <strong>pension (lijfrente)</strong> contribution could lower your taxable income and save an estimated <strong style={{color:'var(--blue-text)'}}>€1,140</strong> this year.</p>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none'}}>Ask about this</Btn>
              <Btn size="sm" variant="ghost" style={{color:'var(--blue-text)'}}>Dismiss</Btn>
            </div>
          </div>

          {/* Deadlines */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:'var(--text-md)',marginBottom:14}}>Upcoming deadlines</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[['Income tax return (IB)','1 May 2026','22 days','warn'],['VAT Q2 filing','31 Jul 2026','83 days','ok'],['Provisional 2027','1 Nov 2026','—','ok']].map(([n,d,left,c],i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:12,paddingBottom:i<2?12:0,borderBottom:i<2?'1px solid var(--border)':'none'}}>
                  <div style={{width:38,height:38,borderRadius:'var(--r-md)',background:c==='warn'?'var(--warn-subtle)':'var(--bg-hover)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontFamily:'var(--mono)',fontSize:14,fontWeight:700,color:c==='warn'?'var(--warn-text)':'var(--text)',lineHeight:1}}>{d.split(' ')[0]}</span>
                    <span style={{fontSize:9,color:'var(--text-3)',textTransform:'uppercase'}}>{d.split(' ')[1]}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}} className="trunc">{n}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{d}</div></div>
                  {left!=='—'&&<span className={`pill ${c==='warn'?'pill-warn':'pill-ok'}`} style={{flexShrink:0}}>{left}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:'var(--text-md)',marginBottom:14}}>Quick actions</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[['chat','Ask AI','chat'],['calc','Calculate','calculator'],['check','Deductions','deduction'],['globe','Expat guide','expat']].map(([ic,l,pg],i)=>{
                const IconComp=IC[ic]||IC.spark;
                return <button key={i} onClick={()=>setPage(pg)} style={{display:'flex',flexDirection:'column',gap:8,padding:'14px 12px',borderRadius:'var(--r-md)',background:'var(--bg-2)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font)',transition:'all var(--t-fast)',alignItems:'flex-start'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue-border)';e.currentTarget.style.background='var(--bg-hover)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-2)'}}>
                  <IconComp style={{width:17,height:17,color:'var(--blue-text)'}}/><span style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}}>{l}</span></button>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashOpp({title,desc,amount,color,priority,setPage}){
  const [hov,setHov]=React.useState(false);
  const cmap={ok:'var(--ok)',blue:'var(--blue)',warn:'var(--warn)'};
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:'flex',alignItems:'center',gap:14,padding:'13px 15px',borderRadius:'var(--r-md)',background:'var(--bg-2)',border:`1px solid ${hov?'var(--border-2)':'var(--border)'}`,transition:'all var(--t-fast)'}}>
      <span style={{width:4,alignSelf:'stretch',borderRadius:99,background:cmap[color],flexShrink:0}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)',marginBottom:2}}>{title}</div>
        <div style={{fontSize:'var(--text-xs)',color:'var(--text-3)',lineHeight:1.45}}>{desc}</div>
      </div>
      <div style={{textAlign:'end',flexShrink:0}}>
        <div style={{fontFamily:'var(--mono)',fontSize:'var(--text-sm)',fontWeight:700,color:cmap[color]}}>{amount}</div>
        <button onClick={()=>setPage('chat')} style={{fontSize:'var(--text-xs)',color:'var(--blue-text)',background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font)',padding:0,marginTop:2,fontWeight:600}}>Claim →</button>
      </div>
    </div>
  );
}
window.DashboardPage=DashboardPage;
