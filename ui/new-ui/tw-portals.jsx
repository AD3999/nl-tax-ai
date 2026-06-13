// tw-portals.jsx — Accountant Portal + Client Portal

// ── Accountant Portal ────────────────────────────────────────────────────────
const CLIENTS=[
  {id:1,name:'Sarah Klein',type:'ZZP',status:'In review',risk:'low',task:'IB 2025',docs:3,last:'2h ago',revenue:'€62,000'},
  {id:2,name:'Acme Holding BV',type:'DGA',status:'Action needed',risk:'high',task:'VPB Q2',docs:7,last:'1d ago',revenue:'€340,000'},
  {id:3,name:'Priya Menon',type:'Expat',status:'Awaiting docs',risk:'medium',task:'30% ruling',docs:1,last:'3d ago',revenue:'€88,000'},
  {id:4,name:'De Jong Bouw',type:'ZZP',status:'Filed',risk:'low',task:'VAT monthly',docs:5,last:'1w ago',revenue:'€127,000'},
  {id:5,name:'Luna Designs',type:'ZZP',status:'In review',risk:'medium',task:'IB 2025',docs:2,last:'4h ago',revenue:'€49,500'},
  {id:6,name:'Tech Start BV',type:'DGA',status:'Action needed',risk:'high',task:'VPB + BTW',docs:9,last:'2d ago',revenue:'€210,000'},
];

function AccountantPage({setPage}){
  const isMob=useMediaQuery('(max-width:768px)');
  const [tab,setTab]=React.useState('clients');
  const [search,setSearch]=React.useState('');
  const [filter,setFilter]=React.useState('all');
  const filtered=CLIENTS.filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.name.toLowerCase().includes(q)||c.type.toLowerCase().includes(q)||c.task.toLowerCase().includes(q);
    const matchF=filter==='all'||c.risk===filter||(filter==='action'&&c.status==='Action needed');
    return matchQ&&matchF;
  });

  return(
    <div style={{maxWidth:1240,margin:'0 auto'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:16,flexWrap:'wrap',marginBottom:20}}>
        <div>
          <div className="eyebrow eyebrow-blue" style={{marginBottom:6}}>ACCOUNTANT PORTAL</div>
          <h1 style={{fontSize:'clamp(1.3rem,3vw,1.8rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Client portfolio</h1>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <Btn variant="secondary" size="md"><IC.file/>Export</Btn>
          <Btn size="md" style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.plus/>Add client</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20}}>
        {[['Active clients','24',null,'var(--text)'],['Action needed','3','var(--danger)','var(--danger-text)'],['Pending docs','12',null,'var(--text)'],['Filed this month','8',null,'var(--ok-text)']].map(([l,v,bg,c],i)=>(
          <div key={i} style={{background:bg?'var(--danger-subtle)':'var(--bg-3)',border:`1px solid ${bg?'var(--danger-border)':'var(--border)'}`,borderRadius:'var(--r-lg)',padding:'16px 18px'}}>
            <div className="eyebrow" style={{marginBottom:6,fontSize:10}}>{l}</div>
            <div style={{fontFamily:'var(--mono)',fontSize:'1.8rem',fontWeight:700,color:c,lineHeight:1}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:2,background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:3,marginBottom:20,width:'fit-content'}}>
        {[['clients','Clients'],['tasks','Tasks'],['docs','Documents'],['workflows','Workflows']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:'7px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontFamily:'var(--font)',fontSize:'var(--text-sm)',fontWeight:tab===k?700:400,background:tab===k?'var(--bg)':'transparent',color:tab===k?'var(--text)':'var(--text-3)',transition:'all var(--t-fast)',boxShadow:tab===k?'var(--sh-sm)':'none'}}>{l}</button>
        ))}
      </div>

      {tab==='clients'&&(
        <div>
          {/* Filters */}
          <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
            <TwInput prefix={<IC.search/>} placeholder="Search clients…" value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,minWidth:180,maxWidth:300}} inputStyle={{height:36}}/>
            <div style={{display:'flex',gap:6}}>
              {[['all','All'],['low','Low risk'],['medium','Medium'],['high','High risk'],['action','Action needed']].map(([k,l])=>(
                <button key={k} onClick={()=>setFilter(k)} style={{padding:'6px 12px',borderRadius:'var(--r-full)',border:`1px solid ${filter===k?'var(--blue-border)':'var(--border)'}`,background:filter===k?'var(--blue-subtle)':'transparent',color:filter===k?'var(--blue-text)':'var(--text-2)',fontSize:'var(--text-xs)',fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',transition:'all var(--t-fast)',whiteSpace:'nowrap'}}>{l}</button>
              ))}
            </div>
          </div>
          {/* Table */}
          {isMob?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {filtered.map(c=><ClientCard key={c.id} c={c} setPage={setPage}/>)}
            </div>
          ):(
            <div className="card" style={{overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'var(--bg-2)'}}>
                  {['Client','Type','Revenue','Current task','Docs','Risk','Status',''].map((h,i)=><th key={i} style={{textAlign:i===0?'start':'center',padding:'12px 16px',fontSize:'var(--text-xs)',fontWeight:700,color:'var(--text-3)',letterSpacing:'.04em',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filtered.map(c=>(
                    <tr key={c.id} style={{borderTop:'1px solid var(--border)',cursor:'pointer',transition:'background var(--t-fast)'}}
                      onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <td style={{padding:'13px 16px'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Avatar name={c.name} size={32}/><div><div style={{fontSize:'var(--text-sm)',fontWeight:600}}>{c.name}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{c.last}</div></div></div></td>
                      <td style={{textAlign:'center',padding:'13px 16px'}}><span className="pill pill-blue">{c.type}</span></td>
                      <td style={{textAlign:'center',padding:'13px 16px',fontFamily:'var(--mono)',fontSize:'var(--text-sm)',color:'var(--text-2)'}}>{c.revenue}</td>
                      <td style={{textAlign:'center',padding:'13px 16px',fontSize:'var(--text-sm)',color:'var(--text-2)'}}>{c.task}</td>
                      <td style={{textAlign:'center',padding:'13px 16px',fontFamily:'var(--mono)',fontSize:'var(--text-sm)',color:'var(--text-2)'}}>{c.docs}</td>
                      <td style={{textAlign:'center',padding:'13px 16px'}}><span style={{width:10,height:10,borderRadius:'50%',background:c.risk==='high'?'var(--danger)':c.risk==='medium'?'var(--warn)':'var(--ok)',display:'inline-block'}} title={c.risk+' risk'}/></td>
                      <td style={{textAlign:'center',padding:'13px 16px'}}><span className={`pill ${c.status==='Action needed'?'pill-danger':c.status==='Filed'?'pill-ok':c.status==='Awaiting docs'?'pill-warn':'pill-blue'}`}>{c.status}</span></td>
                      <td style={{padding:'13px 16px',textAlign:'center'}}><Btn size="xs" variant="ghost" onClick={()=>setPage('client')}>Open<IC.chevRight/></Btn></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {tab==='tasks'&&<TasksView/>}
      {tab==='docs'&&<DocsView/>}
      {tab==='workflows'&&<WorkflowsView/>}
    </div>
  );
}

function ClientCard({c,setPage}){
  return(
    <div className="card" style={{padding:16,display:'flex',alignItems:'center',gap:12}}>
      <Avatar name={c.name} size={38}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:7,flexWrap:'wrap'}}><span style={{fontWeight:700,fontSize:'var(--text-sm)'}}>{c.name}</span><span className="pill pill-blue">{c.type}</span></div>
        <div style={{fontSize:'var(--text-xs)',color:'var(--text-3)',marginTop:2}}>{c.task} · {c.last}</div>
      </div>
      <span className={`pill ${c.status==='Action needed'?'pill-danger':c.status==='Filed'?'pill-ok':c.status==='Awaiting docs'?'pill-warn':'pill-blue'}`}>{c.status}</span>
      <Btn size="xs" variant="ghost" onClick={()=>setPage('client')}><IC.chevRight/></Btn>
    </div>
  );
}

function TasksView(){
  const tasks=[{n:'Priya Menon — request 30% ruling docs',d:'Today',c:'warn'},{n:'Acme BV — review VPB draft',d:'Tomorrow',c:'danger'},{n:'Tech Start BV — BTW reconciliation',d:'Jun 15',c:'danger'},{n:'Sarah Klein — confirm ZZP hours log',d:'Jun 18',c:'blue'},{n:'De Jong Bouw — VAT monthly sign-off',d:'Jun 30',c:'ok'}];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:640}}>
      {tasks.map((t,i)=>(
        <div key={i} className="card" style={{display:'flex',alignItems:'center',gap:13,padding:'14px 18px'}}>
          <span style={{width:4,height:'100%',minHeight:36,borderRadius:99,background:`var(--${t.c})`,flexShrink:0,alignSelf:'stretch'}}/>
          <div style={{flex:1,fontSize:'var(--text-sm)',color:'var(--text)',fontWeight:500}}>{t.n}</div>
          <span style={{fontFamily:'var(--mono)',fontSize:'var(--text-xs)',color:'var(--text-3)',flexShrink:0}}>{t.d}</span>
          <button style={{width:22,height:22,borderRadius:'50%',border:'1.5px solid var(--border)',background:'transparent',cursor:'pointer',flexShrink:0}}/>
        </div>
      ))}
    </div>
  );
}
function DocsView(){
  const docs=[{n:'Sarah Klein — bankafschriften 2025.pdf',s:'3.2 MB',d:'Jun 8',c:'ok'},{n:'Acme BV — jaarrekening Q1.xlsx',s:'1.1 MB',d:'Jun 5',c:'warn'},{n:'Priya Menon — 30% ruling application.pdf',s:'890 KB',d:'Jun 2',c:'blue'},{n:'Tech Start BV — BTW overzicht.csv',s:'450 KB',d:'Jun 1',c:'ok'}];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:10,maxWidth:640}}>
      {docs.map((d,i)=>(
        <div key={i} className="card" style={{display:'flex',alignItems:'center',gap:13,padding:'13px 18px'}}>
          <IC.file style={{color:'var(--text-3)',flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:'var(--text)'}} className="trunc">{d.n}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)',marginTop:1}}>{d.s} · {d.d}</div></div>
          <Btn size="xs" variant="ghost">Download</Btn>
        </div>
      ))}
    </div>
  );
}
function WorkflowsView(){
  const wf=[{n:'ZZP IB return',stages:['Intake','Docs collected','Reviewed','Filed'],active:2},{n:'DGA VPB filing',stages:['Intake','Docs','Draft','Approved','Filed'],active:1},{n:'30% ruling application',stages:['Eligibility','Docs','Submitted','Approved'],active:1}];
  return(
    <div style={{display:'flex',flexDirection:'column',gap:16,maxWidth:740}}>
      {wf.map((w,i)=>(
        <div key={i} className="card" style={{padding:20}}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:'var(--text-sm)'}}>{w.n}</div>
          <div style={{display:'flex',alignItems:'center',gap:0}}>
            {w.stages.map((s,j)=>(
              <React.Fragment key={j}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <div style={{width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                    background:j<w.active?'var(--ok)':j===w.active?'var(--blue)':'var(--bg-hover)',border:j===w.active?'2px solid var(--blue)':'none'}}>
                    {j<w.active?<IC.check style={{width:13,height:13,color:'#fff'}}/>:<span style={{width:8,height:8,borderRadius:'50%',background:j===w.active?'#fff':'var(--text-4)'}}/>}
                  </div>
                  <span style={{fontSize:10,color:j<=w.active?'var(--text-2)':'var(--text-4)',textAlign:'center',maxWidth:60,lineHeight:1.2}}>{s}</span>
                </div>
                {j<w.stages.length-1&&<div style={{flex:1,height:2,background:j<w.active?'var(--ok)':'var(--border)',marginTop:-12,marginInline:4}}/>}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Client Portal ─────────────────────────────────────────────────────────────
function ClientPortalPage({setPage}){
  const isMob=useMediaQuery('(max-width:768px)');
  return(
    <div style={{maxWidth:800,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div className="eyebrow eyebrow-blue" style={{marginBottom:6}}>CLIENT PORTAL</div>
        <h1 style={{fontSize:'clamp(1.3rem,3vw,1.8rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Welcome back, Sarah</h1>
        <p style={{marginTop:5,color:'var(--text-2)',fontSize:'var(--text-base)'}}>Your 2025 return is being reviewed by Jan Vermeulen.</p>
      </div>

      {/* Status card */}
      <div className="card" style={{padding:22,marginBottom:18,background:'var(--ok-subtle)',border:'1px solid var(--ok-border)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:44,height:44,borderRadius:'50%',background:'var(--ok)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.checkCircle style={{width:22,height:22,color:'#fff'}}/></div>
            <div><div style={{fontWeight:700,fontSize:'var(--text-md)',color:'var(--ok-text)'}}>IB 2025 — In review</div><div style={{fontSize:'var(--text-sm)',color:'var(--text-2)',marginTop:2}}>Expected completion: 15 June 2026 · Advisor: Jan Vermeulen</div></div>
          </div>
          <Btn size="sm" variant="secondary">Message advisor</Btn>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:18}}>
        {/* Checklist */}
        <div className="card" style={{padding:20}}>
          <div style={{fontWeight:700,fontSize:'var(--text-md)',marginBottom:14,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Your checklist</span><span className="pill pill-ok">3 / 5 done</span>
          </div>
          {[['done','Provide BSN number'],['done','Upload bank statements 2025'],['done','Confirm ZZP revenue'],['action','Upload receipts for business expenses'],['todo','Sign declaration form']].map(([s,l],i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:11,padding:'10px 0',borderBottom:i<4?'1px solid var(--border)':'none'}}>
              <span style={{width:22,height:22,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                background:s==='done'?'var(--ok)':s==='action'?'var(--warn-subtle)':'var(--bg-hover)',
                border:s==='action'?'1.5px solid var(--warn-border)':'none'}}>
                {s==='done'?<IC.check style={{width:12,height:12,color:'#fff'}}/>:s==='action'?<IC.warning style={{width:12,height:12,color:'var(--warn)'}}/>:<span/>}
              </span>
              <span style={{fontSize:'var(--text-sm)',color:s==='todo'?'var(--text-3)':'var(--text)',fontWeight:s==='action'?600:400,flex:1}}>{l}</span>
              {s==='action'&&<Btn size="xs" variant="blue">Upload</Btn>}
            </div>
          ))}
        </div>

        {/* Timeline & docs */}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:'var(--text-md)',marginBottom:14}}>Your documents</div>
            {[['Bank statements 2025','Jun 1','3.2 MB'],['KvK uittreksel','May 20','890 KB'],['Factuur overzicht','May 15','1.1 MB']].map(([n,d,s],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:i<2?10:0,borderBottom:i<2?'1px solid var(--border)':'none',marginBottom:i<2?10:0}}>
                <IC.file style={{color:'var(--text-3)',flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:500,color:'var(--text)'}} className="trunc">{n}</div><div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{d} · {s}</div></div>
                <Btn size="xs" variant="ghost">View</Btn>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:20}}>
            <div style={{fontWeight:700,fontSize:'var(--text-md)',marginBottom:14}}>Upcoming</div>
            {[['Deadline: sign return form','Jun 25','danger'],['VAT Q2 filing','Jul 31','blue']].map(([n,d,c],i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,paddingBottom:i<1?10:0,borderBottom:i<1?'1px solid var(--border)':'none',marginBottom:i<1?10:0}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:`var(--${c})`,flexShrink:0}}/>
                <span style={{flex:1,fontSize:'var(--text-sm)',color:'var(--text)'}}>{n}</span>
                <span style={{fontFamily:'var(--mono)',fontSize:'var(--text-xs)',color:'var(--text-3)'}}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginTop:18,padding:'16px 20px',background:'var(--blue-subtle)',border:'1px solid var(--blue-border)',borderRadius:'var(--r-lg)',display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
        <IC.spark style={{color:'var(--blue)',flexShrink:0}}/>
        <p style={{flex:1,fontSize:'var(--text-sm)',color:'var(--text)',lineHeight:1.5}}>Did you know? Your estimated refund this year is <strong style={{color:'var(--blue-text)'}}>€3,847</strong> — higher than average for your income bracket.</p>
        <Btn size="sm" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none',flexShrink:0}}>Ask AI</Btn>
      </div>
    </div>
  );
}
window.AccountantPage=AccountantPage;window.ClientPortalPage=ClientPortalPage;
