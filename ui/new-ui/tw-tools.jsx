// tw-tools.jsx — Deduction Checker + Expat Guide
function DeductionPage({setPage,lang}){
  const [answers,setAnswers]=React.useState({});
  const [done,setDone]=React.useState(false);
  const isMob=useMediaQuery('(max-width:768px)');
  const set=(k,v)=>setAnswers(a=>({...a,[k]:v}));

  const questions=[
    {id:'type',label:'What is your employment type?',options:['ZZP / Freelancer','Employee','DGA / BV owner','Expat']},
    {id:'hours',label:'Did you work ≥1,225 hours in your own business?',options:['Yes','No','N/A']},
    {id:'homeOffice',label:'Do you have a dedicated home office (separate room)?',options:['Yes','No']},
    {id:'car',label:'Do you use a car for business?',options:['Yes — own car','Yes — company car','No']},
    {id:'pension',label:'Did you make pension / lijfrente contributions?',options:['Yes','No']},
    {id:'education',label:'Did you pay for work-related education or training?',options:['Yes','No']},
    {id:'gifts',label:'Did you make charitable donations (giften)?',options:['Yes','No']},
    {id:'mortgage',label:'Do you have a mortgage on your main home?',options:['Yes','No']},
  ];

  const answered=Object.keys(answers).length;
  const progress=Math.round((answered/questions.length)*100);

  const results=React.useMemo(()=>{
    if(!done)return[];
    const r=[];
    const t=answers.type;
    const isZzp=t==='ZZP / Freelancer';
    const isDga=t==='DGA / BV owner';
    if((isZzp||isDga)&&answers.hours==='Yes')r.push({title:'Zelfstandigenaftrek',amount:'€3,750',sure:true,desc:'You meet the urencriterium. This deduction reduces your taxable profit directly.',tag:'High impact'});
    if(isZzp||isDga)r.push({title:'MKB-winstvrijstelling',amount:'12.7%',sure:true,desc:'An automatic 12.7% exemption on your remaining profit after other deductions.',tag:'Automatic'});
    if(answers.homeOffice==='Yes')r.push({title:'Werkruimte thuis',amount:'~€1,200',sure:false,desc:'Your home office may qualify if you use it ≥70% professionally and it can be rented to third parties.',tag:'Check required'});
    if(answers.car==='Yes — own car')r.push({title:'Reiskostenvergoeding',amount:'€0.23/km',sure:true,desc:'Deduct €0.23 per kilometre for business travel with your own vehicle.',tag:'Per km'});
    if(answers.pension==='Yes')r.push({title:'Lijfrente / pension contribution',amount:'Up to jaarruimte',sure:true,desc:'Contributions up to your annual jaarruimte are fully deductible from Box 1 income.',tag:'High impact'});
    if(answers.education==='Yes')r.push({title:'Scholingsuitgaven',amount:'Actual costs',sure:false,desc:'Course fees, books and exam costs may be deductible if the study improves your current or future income.',tag:'Receipt needed'});
    if(answers.gifts==='Yes')r.push({title:'Giftenaftrek',amount:'Threshold applies',sure:true,desc:'Gifts to ANBI-certified charities exceeding 1% of income (min €60) are deductible.',tag:'ANBI only'});
    if(answers.mortgage==='Yes')r.push({title:'Hypotheekrenteaftrek',amount:'Rate × interest',sure:true,desc:'Mortgage interest on your main home is deductible at your Box 1 tax rate.',tag:'Box 1'});
    r.push({title:'Algemene heffingskorting',amount:'Up to €3,362',sure:true,desc:'A general tax credit applied to everyone. Amount depends on your income level.',tag:'Universal'});
    if(answers.type==='Employee')r.push({title:'Arbeidskorting',amount:'Up to €5,052',sure:true,desc:'An employment tax credit for people with earned income.',tag:'Employees'});
    if(answers.type==='Expat')r.push({title:'30% ruling',amount:'30% tax-free',sure:false,desc:'If you were recruited from abroad, up to 30% of your salary may be paid tax-free.',tag:'Expat only'});
    return r;
  },[done,answers]);

  return(
    <div style={{maxWidth:780,margin:'0 auto'}}>
      <div style={{marginBottom:24}}>
        <div className="eyebrow eyebrow-blue" style={{marginBottom:8}}>DEDUCTION CHECKER</div>
        <h1 style={{fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Find every deduction you qualify for</h1>
        <p style={{marginTop:6,fontSize:'var(--text-base)',color:'var(--text-2)'}}>Answer 8 quick questions — we'll show you exactly what to claim.</p>
      </div>

      {!done?(
        <div>
          <div style={{marginBottom:20}}>
            <ProgressBar value={answered} max={questions.length} label={`${answered} of ${questions.length} answered`} showPct color="var(--blue)" height={6}/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {questions.map((q,i)=>(
              <div key={q.id} className="card" style={{padding:20,opacity:i>answered?0.45:1,transition:'opacity var(--t-base)'}}>
                <div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--text)',marginBottom:12}}>
                  <span style={{color:'var(--text-3)',fontFamily:'var(--mono)',marginInlineEnd:8,fontSize:'var(--text-xs)'}}>0{i+1}</span>{q.label}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {q.options.map(o=>(
                    <button key={o} onClick={()=>set(q.id,o)} style={{padding:'8px 16px',borderRadius:'var(--r-full)',border:`1.5px solid ${answers[q.id]===o?'var(--blue)':'var(--border-2)'}`,background:answers[q.id]===o?'var(--blue)':'var(--bg-3)',color:answers[q.id]===o?'#fff':'var(--text-2)',fontSize:'var(--text-sm)',fontWeight:500,cursor:'pointer',fontFamily:'var(--font)',transition:'all var(--t-fast)'}}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,display:'flex',gap:10}}>
            <Btn size="lg" onClick={()=>setDone(true)} disabled={answered<3} style={{background:'var(--blue)',color:'#fff',border:'none'}}>Show my deductions<IC.arrow style={{color:'#fff'}}/></Btn>
            <Btn variant="ghost" size="lg" onClick={()=>setAnswers({})}>Reset</Btn>
          </div>
        </div>
      ):(
        <div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:18,flexWrap:'wrap'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'var(--ok-subtle)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.checkCircle style={{width:22,height:22,color:'var(--ok)'}}/></div>
              <div><div style={{fontWeight:700,fontSize:'var(--text-lg)'}}>{results.length} deductions found</div><div style={{fontSize:'var(--text-sm)',color:'var(--text-3)'}}>{results.filter(r=>r.sure).length} confirmed · {results.filter(r=>!r.sure).length} need checking</div></div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <Btn size="sm" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.spark style={{color:'#fff'}}/>Ask AI</Btn>
              <Btn size="sm" variant="secondary" onClick={()=>{setDone(false);setAnswers({});}}>Re-check</Btn>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {results.map((r,i)=>(
              <div key={i} className="card" style={{padding:18,display:'flex',gap:14,alignItems:'flex-start'}}>
                <div style={{width:8,alignSelf:'stretch',borderRadius:99,background:r.sure?'var(--ok)':'var(--warn)',flexShrink:0,minHeight:20}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:5}}>
                    <span style={{fontWeight:700,fontSize:'var(--text-sm)',color:'var(--text)'}}>{r.title}</span>
                    <span className={`pill ${r.sure?'pill-ok':'pill-warn'}`}>{r.tag}</span>
                  </div>
                  <p style={{fontSize:'var(--text-sm)',color:'var(--text-2)',lineHeight:1.55,marginBottom:8}}>{r.desc}</p>
                  <div style={{fontFamily:'var(--mono)',fontWeight:700,color:r.sure?'var(--ok-text)':'var(--warn-text)',fontSize:'var(--text-sm)'}}>{r.amount}</div>
                </div>
                <button onClick={()=>setPage('chat')} style={{padding:'7px 12px',borderRadius:'var(--r-md)',border:'1px solid var(--border)',background:'transparent',color:'var(--text-2)',fontSize:'var(--text-xs)',fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',flexShrink:0}}>Details</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:20,display:'flex',gap:10,flexWrap:'wrap'}}>
            <Btn size="md" onClick={()=>setPage('calculator')} style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.calc/>Calculate with these</Btn>
            <Btn size="md" variant="secondary" onClick={()=>setPage('chat')}><IC.spark/>Ask about a deduction</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpatPage({setPage}){
  const isMob=useMediaQuery('(max-width:768px)');
  const [activeSection,setActiveSection]=React.useState(0);
  const sections=[
    {icon:'globe',title:'30% Ruling',sub:'The expat tax benefit that can save thousands',badge:'Most popular',content:<Ruling30/>,color:'var(--blue)'},
    {icon:'file',title:'First IB Return',sub:'Your first Dutch income tax declaration',badge:null,content:<FirstReturn/>,color:'var(--ok)'},
    {icon:'check',title:'Zorgtoeslag',sub:'Dutch healthcare allowance',badge:'€1,200/yr avg',content:<Zorgtoeslag/>,color:'var(--warn)'},
    {icon:'users',title:'DigiD & BSN',sub:'Getting set up in the Dutch system',badge:null,content:<DigiD/>,color:'var(--purple)'},
  ];
  return(
    <div style={{maxWidth:1020,margin:'0 auto'}}>
      <div style={{marginBottom:28}}>
        <div className="eyebrow eyebrow-blue" style={{marginBottom:8}}>EXPAT TAX GUIDE · 2026</div>
        <h1 style={{fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Tax in the Netherlands for expats</h1>
        <p style={{marginTop:6,fontSize:'var(--text-base)',color:'var(--text-2)',maxWidth:520}}>A practical guide covering the most important rules for people who have moved to the Netherlands.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'200px 1fr',gap:18}}>
        <div style={{display:'flex',flexDirection:isMob?'row':'column',gap:8,overflowX:isMob?'auto':'unset'}}>
          {sections.map((s,i)=>{
            const active=activeSection===i;
            const IconComp=IC[s.icon]||IC.spark;
            return(
              <button key={i} onClick={()=>setActiveSection(i)} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:'var(--r-md)',border:`1px solid ${active?'var(--blue-border)':'var(--border)'}`,background:active?'var(--blue-subtle)':'var(--bg-3)',cursor:'pointer',fontFamily:'var(--font)',textAlign:'start',transition:'all var(--t-fast)',flexShrink:0,minWidth:isMob?'auto':'unset',width:isMob?'auto':'100%'}}>
                <span style={{display:'flex',color:active?'var(--blue-text)':'var(--text-3)'}}><IconComp/></span>
                {!isMob&&<div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:active?'var(--blue-text)':'var(--text)'}} className="trunc">{s.title}</div></div>}
                {isMob&&<span style={{fontSize:'var(--text-sm)',fontWeight:600,color:active?'var(--blue-text)':'var(--text)',whiteSpace:'nowrap'}}>{s.title}</span>}
              </button>
            );
          })}
        </div>
        <div className="card" style={{padding:isMob?18:28}}>
          {sections[activeSection].badge&&<span className="pill pill-blue" style={{marginBottom:14,display:'inline-block'}}>{sections[activeSection].badge}</span>}
          <h2 style={{fontSize:'var(--text-2xl)',fontWeight:700,letterSpacing:'-0.02em',margin:'0 0 6px'}}>{sections[activeSection].title}</h2>
          <p style={{fontSize:'var(--text-base)',color:'var(--text-3)',marginBottom:22}}>{sections[activeSection].sub}</p>
          {sections[activeSection].content}
          <div style={{marginTop:24,paddingTop:18,borderTop:'1px solid var(--border)',display:'flex',gap:10,flexWrap:'wrap'}}>
            <Btn size="md" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.spark style={{color:'#fff'}}/>Ask AI about this</Btn>
            <Btn size="md" variant="secondary" onClick={()=>setPage('calculator')}><IC.calc/>Run calculator</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({label,value,mono}){
  return(
    <div style={{display:'flex',alignItems:'baseline',gap:12,padding:'11px 0',borderBottom:'1px solid var(--border)',justifyContent:'space-between'}}>
      <span style={{fontSize:'var(--text-sm)',color:'var(--text-2)',flex:1}}>{label}</span>
      <span style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--text)',fontFamily:mono?'var(--mono)':'var(--font)',textAlign:'end'}}>{value}</span>
    </div>
  );
}

function Ruling30(){
  return(<div>
    <p style={{fontSize:'var(--text-base)',lineHeight:1.7,color:'var(--text-2)',marginBottom:18}}>The 30% ruling allows employers to pay part of the salary of recruited foreign employees tax-free. It compensates for extraterritorial costs of relocating to the Netherlands.</p>
    <InfoRow label="Tax-free amount (first 20 months)" value="30% of salary" mono/>
    <InfoRow label="Tax-free amount (next 20 months)" value="20% of salary" mono/>
    <InfoRow label="Tax-free amount (final 20 months)" value="10% of salary" mono/>
    <InfoRow label="Minimum salary 2026" value="€46,107" mono/>
    <InfoRow label="Scientists / researchers" value="€35,048" mono/>
    <InfoRow label="Maximum duration" value="5 years" mono/>
    <InfoRow label="Distance rule" value="≥ 150km from NL border" mono/>
    <div style={{marginTop:16,padding:'14px 16px',background:'var(--blue-subtle)',border:'1px solid var(--blue-border)',borderRadius:'var(--r-md)',fontSize:'var(--text-sm)',color:'var(--blue-text)',lineHeight:1.55}}>
      <strong>Key change 2024+:</strong> The ruling now tapers (30%→20%→10%) instead of a flat 30% for the full 5 years. Workers who had the ruling before 2024 are partially grandfathered.
    </div>
  </div>);
}
function FirstReturn(){
  return(<div>
    <p style={{fontSize:'var(--text-base)',lineHeight:1.7,color:'var(--text-2)',marginBottom:18}}>If you lived or worked in the Netherlands during 2025, you may need to file an inkomstenbelasting (IB) return. As a partial-year resident, a <strong style={{color:'var(--text)'}}>M-form</strong> (migrant form) is required for your first year.</p>
    <InfoRow label="Deadline" value="1 May 2026" mono/>
    <InfoRow label="Extension request" value="Before 1 May" mono/>
    <InfoRow label="Extension with tax advisor" value="Up to 1 Sep 2027" mono/>
    <InfoRow label="Form type (first year in NL)" value="M-form (Migrant)" mono/>
    <InfoRow label="Filing method" value="Mijn Belastingdienst or paper" mono/>
    <InfoRow label="Refund timeline" value="6–12 weeks" mono/>
  </div>);
}
function Zorgtoeslag(){
  return(<div>
    <p style={{fontSize:'var(--text-base)',lineHeight:1.7,color:'var(--text-2)',marginBottom:18}}>Zorgtoeslag is a monthly government allowance to help cover the cost of Dutch health insurance (basisverzekering). You apply once via Mijn Toeslagen and receive it monthly.</p>
    <InfoRow label="Max amount (single, 2026)" value="≈ €127/month" mono/>
    <InfoRow label="Income limit (single)" value="≈ €36,800" mono/>
    <InfoRow label="Income limit (partners)" value="≈ €46,600" mono/>
    <InfoRow label="Apply via" value="Mijn Toeslagen" mono/>
    <InfoRow label="Apply from" value="Jan 1 — Dec 31" mono/>
    <InfoRow label="Retroactive" value="Up to 3 years" mono/>
  </div>);
}
function DigiD(){
  return(<div>
    <p style={{fontSize:'var(--text-base)',lineHeight:1.7,color:'var(--text-2)',marginBottom:18}}>DigiD is your digital identity for all Dutch government services. You'll need it to file taxes, access toeslagen and check your pension. Get a BSN (citizen number) first.</p>
    <InfoRow label="BSN from" value="Municipality (gemeente)" mono/>
    <InfoRow label="BSN processing time" value="1–3 working days" mono/>
    <InfoRow label="DigiD apply at" value="digid.nl" mono/>
    <InfoRow label="DigiD activation time" value="3–5 working days" mono/>
    <InfoRow label="Needed for" value="Tax, toeslagen, pension" mono/>
    <InfoRow label="If abroad" value="Dutch consulate" mono/>
  </div>);
}
window.DeductionPage=DeductionPage;window.ExpatPage=ExpatPage;
