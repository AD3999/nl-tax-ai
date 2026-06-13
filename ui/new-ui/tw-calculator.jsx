// tw-calculator.jsx — Guided multi-step Tax Calculator
const STEPS=['Profile','Income','Deductions','Results'];

function CalculatorPage({setPage,lang}){
  const isMob=useMediaQuery('(max-width:768px)');
  const [step,setStep]=React.useState(0);
  const [data,setData]=React.useState({type:'zzp',age:'',income:'',partner:false,hours:'',expenses:'',pension:'',car:false,homeOffice:false,workCosts:'',box3:'',box3debt:''});
  const [results,setResults]=React.useState(null);
  const set=(k,v)=>setData(d=>({...d,[k]:v}));
  const next=()=>{if(step===2){setResults(calc(data));}setStep(s=>Math.min(3,s+1));};
  const prev=()=>setStep(s=>Math.max(0,s-1));
  const restart=()=>{setStep(0);setResults(null);};

  return(
    <div style={{maxWidth:740,margin:'0 auto'}}>
      <div style={{marginBottom:28}}>
        <div className="eyebrow eyebrow-blue" style={{marginBottom:8}}>TAX CALCULATOR · 2026</div>
        <h1 style={{fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800,letterSpacing:'-0.03em',margin:0}}>Your 2026 income tax</h1>
        <p style={{marginTop:6,fontSize:'var(--text-base)',color:'var(--text-2)'}}>Answer a few questions — get a precise calculation with every deduction applied.</p>
      </div>

      {/* Stepper */}
      <div style={{display:'flex',gap:0,marginBottom:28,background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:4}}>
        {STEPS.map((s,i)=>(
          <button key={i} onClick={()=>i<step?setStep(i):null} disabled={i>step}
            style={{flex:1,padding:'9px 4px',borderRadius:'var(--r-md)',border:'none',cursor:i<step?'pointer':'default',fontFamily:'var(--font)',fontSize:'var(--text-sm)',fontWeight:i===step?700:500,transition:'all var(--t-fast)',
              background:i===step?'var(--bg)':'transparent',color:i===step?'var(--text)':i<step?'var(--blue-text)':'var(--text-3)',
              boxShadow:i===step?'var(--sh-sm)':'none'}}>
            <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <span style={{width:20,height:20,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,
                background:i===step?'var(--blue)':i<step?'var(--ok-subtle)':'var(--bg-hover)',color:i===step?'#fff':i<step?'var(--ok)':'var(--text-3)'}}>
                {i<step?<IC.check style={{width:10,height:10}}/>:i+1}
              </span>
              {!isMob&&s}
            </span>
          </button>
        ))}
      </div>

      <div className="card" style={{padding:isMob?18:28}}>
        {step===0&&<StepProfile data={data} set={set}/>}
        {step===1&&<StepIncome data={data} set={set}/>}
        {step===2&&<StepDeductions data={data} set={set}/>}
        {step===3&&results&&<StepResults results={results} data={data} restart={restart} setPage={setPage}/>}
        {step<3&&(
          <div style={{display:'flex',justifyContent:'space-between',marginTop:28,paddingTop:22,borderTop:'1px solid var(--border)'}}>
            <Btn variant="ghost" size="md" onClick={prev} disabled={step===0}><span style={{transform:'rotate(180deg)',display:'flex'}}><IC.arrow/></span>Back</Btn>
            <Btn size="md" onClick={next} style={{background:'var(--blue)',color:'#fff',border:'none'}}>{step===2?'Calculate':'Continue'}<IC.arrow style={{color:'#fff'}}/></Btn>
          </div>
        )}
      </div>

      {/* Live estimate bar */}
      {step<3&&step>0&&(
        <div className="card" style={{marginTop:14,padding:'14px 20px',background:'var(--blue-subtle)',border:'1px solid var(--blue-border)',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
          <IC.spark style={{color:'var(--blue)',flexShrink:0}}/>
          <span style={{fontSize:'var(--text-sm)',color:'var(--text-2)',flex:1}}>Live estimate — updating as you fill in the form</span>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {[['Gross income',data.income?'€'+Number(data.income).toLocaleString('nl-NL'):'—'],['Est. tax',data.income?'€'+Math.round(calcQuick(data)).toLocaleString('nl-NL'):'—'],['Est. refund',data.income&&Number(data.income)>20000?'€'+Math.round(calcRefund(data)).toLocaleString('nl-NL'):'—']].map(([k,v])=>(
              <div key={k}><div style={{fontSize:10,color:'var(--text-3)',marginBottom:2}}>{k}</div><div style={{fontFamily:'var(--mono)',fontSize:'var(--text-md)',fontWeight:700,color:'var(--blue-text)'}}>{v}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldGroup({children,label}){
  return <div style={{marginBottom:22}}>{label&&<div style={{fontSize:'var(--text-sm)',fontWeight:700,color:'var(--text)',marginBottom:12}}>{label}</div>}{children}</div>;
}

function RadioCard({value,current,onChange,label,sub,icon}){
  const active=value===current;
  return(
    <button onClick={()=>onChange(value)} style={{display:'flex',alignItems:'center',gap:13,padding:'14px 16px',borderRadius:'var(--r-md)',border:`1.5px solid ${active?'var(--blue)':'var(--border)'}`,background:active?'var(--blue-subtle)':'var(--bg-2)',cursor:'pointer',fontFamily:'var(--font)',textAlign:'start',transition:'all var(--t-fast)',width:'100%'}}>
      <div style={{width:18,height:18,borderRadius:'50%',border:`2px solid ${active?'var(--blue)':'var(--border-2)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{active&&<span style={{width:8,height:8,borderRadius:'50%',background:'var(--blue)'}}/>}</div>
      <div style={{flex:1,minWidth:0}}><div style={{fontSize:'var(--text-sm)',fontWeight:600,color:active?'var(--blue-text)':'var(--text)'}}>{label}</div>{sub&&<div style={{fontSize:'var(--text-xs)',color:'var(--text-3)',marginTop:1}}>{sub}</div>}</div>
    </button>
  );
}

function Toggle({label,sub,value,onChange}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:14,padding:'13px 0',borderBottom:'1px solid var(--border)'}}>
      <div style={{flex:1}}><div style={{fontSize:'var(--text-sm)',fontWeight:500,color:'var(--text)'}}>{label}</div>{sub&&<div style={{fontSize:'var(--text-xs)',color:'var(--text-3)',marginTop:2}}>{sub}</div>}</div>
      <button onClick={()=>onChange(!value)} style={{width:42,height:24,borderRadius:99,border:'none',cursor:'pointer',transition:'background var(--t-fast)',background:value?'var(--blue)':'var(--border-2)',position:'relative',flexShrink:0}}>
        <span style={{position:'absolute',top:3,left:value?21:3,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left var(--t-fast)',boxShadow:'0 1px 4px rgba(0,0,0,.2)'}}/>
      </button>
    </div>
  );
}

function StepProfile({data,set}){
  const types=[['zzp','ZZP / Freelancer','Self-employed, sole trader'],['employee','Employee','Employed on a contract'],['dga','DGA / BV owner','Director-shareholder'],['expat','Expat','Living in NL, foreign employer or 30% ruling']];
  return(
    <div>
      <div style={{marginBottom:22}}>
        <h2 style={{fontSize:'var(--text-xl)',fontWeight:700,letterSpacing:'-0.02em',margin:0}}>What best describes you?</h2>
        <p style={{marginTop:6,fontSize:'var(--text-sm)',color:'var(--text-3)'}}>This determines which rules and deductions apply.</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:22}}>
        {types.map(([v,l,s])=><RadioCard key={v} value={v} current={data.type} onChange={v=>set('type',v)} label={l} sub={s}/>)}
      </div>
      <TwInput label="Age" type="number" placeholder="e.g. 34" value={data.age} onChange={e=>set('age',e.target.value)} hint="Used to apply age-related tax credits"/>
      <div style={{marginTop:14}}><Toggle label="Do you have a fiscal partner?" sub="Affects certain deductions and tax credits" value={data.partner} onChange={v=>set('partner',v)}/></div>
    </div>
  );
}

function StepIncome({data,set}){
  const isZzp=data.type==='zzp';const isDga=data.type==='dga';
  return(
    <div>
      <h2 style={{fontSize:'var(--text-xl)',fontWeight:700,letterSpacing:'-0.02em',margin:0,marginBottom:20}}>{isZzp?'Business revenue':'Your income for 2026'}</h2>
      <FieldGroup label={isZzp?'Gross business revenue (€)':'Gross employment income (€)'}>
        <TwInput type="number" placeholder="e.g. 72000" value={data.income} onChange={e=>set('income',e.target.value)} prefix={<IC.euro/>} hint="Before tax, before deductions"/>
      </FieldGroup>
      {isZzp&&<FieldGroup label="Hours worked in your business">
        <TwInput type="number" placeholder="e.g. 1340" value={data.hours} onChange={e=>set('hours',e.target.value)} prefix={<IC.clock/>} hint="Needed for the urencriterium (min 1,225 hrs)"/>
      </FieldGroup>}
      {isDga&&<FieldGroup label="DGA salary (gebruikelijk loon)">
        <TwInput type="number" placeholder="Min. €56,000 in 2026" value={data.income} onChange={e=>set('income',e.target.value)} prefix={<IC.euro/>}/>
      </FieldGroup>}
      <FieldGroup label="Box 3 savings & investments (€)">
        <TwInput type="number" placeholder="e.g. 50000" value={data.box3} onChange={e=>set('box3',e.target.value)} prefix={<IC.euro/>} hint="Average balance on 1 Jan 2026"/>
      </FieldGroup>
      {data.box3>0&&<FieldGroup label="Box 3 debts (€)">
        <TwInput type="number" placeholder="e.g. 0" value={data.box3debt} onChange={e=>set('box3debt',e.target.value)} prefix={<IC.euro/>} hint="e.g. mortgage minus own home"/>
      </FieldGroup>}
    </div>
  );
}

function StepDeductions({data,set}){
  const isZzp=data.type==='zzp'||data.type==='dga';
  return(
    <div>
      <h2 style={{fontSize:'var(--text-xl)',fontWeight:700,letterSpacing:'-0.02em',margin:0,marginBottom:20}}>Deductions & allowances</h2>
      {isZzp&&<FieldGroup label="Business expenses (€)">
        <TwInput type="number" placeholder="e.g. 8500" value={data.expenses} onChange={e=>set('expenses',e.target.value)} prefix={<IC.euro/>} hint="Equipment, subscriptions, professional costs"/>
      </FieldGroup>}
      <FieldGroup label="Pension contribution / lijfrente (€)">
        <TwInput type="number" placeholder="e.g. 5000" value={data.pension} onChange={e=>set('pension',e.target.value)} prefix={<IC.euro/>} hint="Annual jaarruimte may allow up to 30% of profits"/>
      </FieldGroup>
      <FieldGroup label="Other deductible work costs (€)">
        <TwInput type="number" placeholder="e.g. 1200" value={data.workCosts} onChange={e=>set('workCosts',e.target.value)} prefix={<IC.euro/>}/>
      </FieldGroup>
      <div style={{display:'flex',flexDirection:'column'}}>
        <Toggle label="Home office (werkruimte)" sub="Must be separate room, used ≥70% professionally" value={data.homeOffice} onChange={v=>set('homeOffice',v)}/>
        <Toggle label="Business car (auto van de zaak)" sub="Adds bijtelling to income if personal use >500km/yr" value={data.car} onChange={v=>set('car',v)}/>
      </div>
    </div>
  );
}

function StepResults({results,data,restart,setPage}){
  const isMob=useMediaQuery('(max-width:768px)');
  const bars=[['Box 1 tax','var(--danger)',results.box1Tax,results.gross],['Deductions applied','var(--ok)',results.totalDeductions,results.gross],['Net take-home','var(--blue)',results.takeHome,results.gross]];
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
        <div style={{width:42,height:42,borderRadius:'50%',background:'var(--ok-subtle)',display:'flex',alignItems:'center',justifyContent:'center'}}><IC.checkCircle style={{width:22,height:22,color:'var(--ok)'}}/></div>
        <div><div style={{fontWeight:700,fontSize:'var(--text-lg)'}}>Your 2026 tax estimate</div><div style={{fontSize:'var(--text-sm)',color:'var(--text-3)'}}>Based on {data.type} profile · {new Date().getFullYear()} rules</div></div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:isMob?'1fr 1fr':'repeat(4,1fr)',gap:12,marginBottom:24}}>
        {[['Gross income','var(--text)','€'+results.gross.toLocaleString('nl-NL')],['Total deductions','var(--ok)','€'+results.totalDeductions.toLocaleString('nl-NL')],['Box 1 tax','var(--danger)','€'+results.box1Tax.toLocaleString('nl-NL')],['Net take-home','var(--blue)','€'+results.takeHome.toLocaleString('nl-NL')]].map(([l,c,v])=>(
          <div key={l} style={{background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'14px 16px'}}>
            <div style={{fontSize:10,color:'var(--text-3)',marginBottom:4}}>{l}</div>
            <div style={{fontFamily:'var(--mono)',fontSize:'var(--text-xl)',fontWeight:700,color:c,letterSpacing:'-0.02em'}}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:22}}>
        {bars.map(([l,c,val,total])=><ProgressBar key={l} label={l} value={val} max={total} color={c} height={8} showPct/>)}
      </div>
      {results.deductionList.length>0&&<div style={{marginBottom:20}}>
        <div style={{fontWeight:700,marginBottom:12}}>Deductions applied</div>
        {results.deductionList.map(([n,v],i)=>(
          <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:'var(--text-sm)'}}>
            <span style={{color:'var(--text)'}}>{n}</span><span style={{fontFamily:'var(--mono)',fontWeight:600,color:'var(--ok)'}}>−€{v.toLocaleString('nl-NL')}</span>
          </div>
        ))}
      </div>}
      {results.refund>0&&<div style={{marginBottom:20,padding:'16px 18px',borderRadius:'var(--r-md)',background:'var(--ok-subtle)',border:'1px solid var(--ok-border)',display:'flex',alignItems:'center',gap:12}}>
        <IC.checkCircle style={{color:'var(--ok)',flexShrink:0}}/>
        <div><div style={{fontWeight:700,color:'var(--ok-text)',fontSize:'var(--text-md)'}}>Estimated refund: €{results.refund.toLocaleString('nl-NL')}</div><div style={{fontSize:'var(--text-sm)',color:'var(--text-2)',marginTop:2}}>Based on standard voorlopige aanslag payments</div></div>
      </div>}
      <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
        <Btn size="md" onClick={()=>setPage('chat')} style={{background:'var(--blue)',color:'#fff',border:'none'}}><IC.spark style={{color:'#fff'}}/>Ask AI about this</Btn>
        <Btn size="md" variant="secondary" onClick={()=>setPage('deduction')}><IC.check/>Full deduction check</Btn>
        <Btn size="md" variant="ghost" onClick={restart}>Start over</Btn>
      </div>
    </div>
  );
}

function calcQuick(d){
  const inc=Number(d.income)||0;
  if(inc===0)return 0;
  const taxable=Math.max(0,inc*(d.type==='zzp'?0.88:1));
  return taxable<=75518?taxable*.3697:75518*.3697+(taxable-75518)*.495;
}
function calcRefund(d){return Math.max(0,calcQuick(d)*.12);}
function calc(d){
  const inc=Number(d.income)||0;
  const exp=Number(d.expenses)||0;
  const pen=Number(d.pension)||0;
  const wc=Number(d.workCosts)||0;
  const isZzp=d.type==='zzp';
  const hrs=Number(d.hours)||0;
  const zelf=isZzp&&hrs>=1225?3750:0;
  const mkb=isZzp?(inc-exp)*0.127:0;
  const hoc=d.homeOffice?1200:0;
  const gross=Math.round(inc);
  const totalDeductions=Math.round(exp+zelf+mkb+pen+wc+hoc);
  const taxable=Math.max(0,gross-totalDeductions);
  const box1Tax=Math.round(taxable<=75518?taxable*.3697:75518*.3697+(taxable-75518)*.495);
  const algemeen=Math.round(Math.min(3362,taxable>22660?3362-Math.max(0,(taxable-22660)*.1228):3362));
  const arb=isZzp?0:Math.round(Math.min(5052,taxable*.28273));
  const finalTax=Math.max(0,box1Tax-algemeen-arb);
  const deductionList=[[isZzp?'Business expenses':'Work expenses',Math.round(exp)],...(zelf?[['Zelfstandigenaftrek',zelf]]:[]),...(mkb?[['MKB-winstvrijstelling',Math.round(mkb)]]:[]),...(pen?[['Pension / lijfrente',Math.round(pen)]]:[]),...(hoc?[['Home office (werkruimte)',hoc]]:[]),...(wc?[['Other work costs',Math.round(wc)]]:[])].filter(([,v])=>v>0);
  const takeHome=gross-finalTax;
  const refund=Math.max(0,Math.round((box1Tax-finalTax)*.15));
  return{gross,totalDeductions,box1Tax:finalTax,takeHome:Math.round(takeHome),refund,deductionList};
}
window.CalculatorPage=CalculatorPage;
