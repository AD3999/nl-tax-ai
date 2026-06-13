// tw-chat.jsx — TaxWijs AI Chat (streaming, sources, suggested actions)
const CHAT_RESPONSES={
  default:{text:"Based on the 2026 Dutch tax rules, here's what applies to your situation. The standard income tax brackets for Box 1 are 36.97% up to €75,518 and 49.5% above that. Most freelancers also benefit from the MKB-winstvrijstelling, a 12.7% profit exemption applied after other deductions.",
    cards:[['Box 1 rate','36.97%'],['MKB exemption','12.7%'],['Threshold','€75,518']],source:'belastingdienst.nl · inkomstenbelasting 2026',
    actions:['Calculate my exact tax','Save to dashboard','What deductions apply?']},
};
function ChatPage({setPage,lang}){
  const isMob=useMediaQuery('(max-width:768px)');
  const isRtl=lang==='fa';
  const [messages,setMessages]=React.useState([
    {role:'ai',text:"Hi Alex 👋 I'm your TaxWijs assistant. Ask me anything about Dutch taxes — deductions, the 30% ruling, ZZP rules, VAT, you name it. I'll always cite my sources.",intro:true},
  ]);
  const [input,setInput]=React.useState('');
  const [streaming,setStreaming]=React.useState(false);
  const scrollRef=React.useRef(null);
  const suggestions=['Am I eligible for zelfstandigenaftrek?','How does the 30% ruling work?','What can I deduct as a ZZP\'er?','Calculate my 2026 income tax'];

  React.useEffect(()=>{if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight;},[messages,streaming]);

  const send=(text)=>{
    const q=(text||input).trim();if(!q||streaming)return;
    setMessages(m=>[...m,{role:'user',text:q}]);
    setInput('');setStreaming(true);
    setTimeout(()=>{
      const resp=buildResponse(q);
      setMessages(m=>[...m,{role:'ai',...resp,streaming:true}]);
      setStreaming(false);
    },1100);
  };

  return(
    <div dir={isRtl?'rtl':'ltr'} style={{maxWidth:860,margin:'0 auto',height:isMob?'calc(100svh - var(--topbar-h) - 64px)':'calc(100svh - var(--topbar-h) - 48px)',display:'flex',flexDirection:'column'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:11,paddingBottom:14,marginBottom:4,borderBottom:'1px solid var(--border)'}}>
        <div style={{width:36,height:36,borderRadius:'var(--r-md)',background:'var(--blue)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IC.spark style={{width:18,height:18,color:'#fff'}}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:7}}><span style={{fontWeight:700,fontSize:'var(--text-md)'}}>TaxWijs AI</span><span style={{width:7,height:7,borderRadius:'50%',background:'var(--ok)',animation:'pulse 2s infinite'}}/><span style={{fontSize:'var(--text-xs)',color:'var(--ok-text)'}}>Online</span></div>
          <div style={{fontSize:'var(--text-xs)',color:'var(--text-3)'}}>Trained on 2026 Dutch tax rules · Cites every source</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setMessages(m=>m.slice(0,1))} style={{flexShrink:0}}><IC.plus/>{!isMob&&'New chat'}</Btn>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{flex:1,overflowY:'auto',padding:'18px 2px',display:'flex',flexDirection:'column',gap:18}}>
        {messages.map((m,i)=><ChatMessage key={i} msg={m} send={send} setPage={setPage}/>)}
        {streaming&&(
          <div style={{display:'flex',gap:11}}>
            <div style={{width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--blue-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><IC.spark style={{width:14,height:14,color:'var(--blue)'}}/></div>
            <div style={{display:'flex',gap:5,alignItems:'center',padding:'12px 0'}}>{[0,.15,.3].map((d,j)=><span key={j} style={{width:7,height:7,borderRadius:'50%',background:'var(--text-3)',animation:`dotBounce 1.2s ${d}s infinite`}}/>)}</div>
          </div>
        )}
        {messages.length===1&&(
          <div className="afu" style={{marginTop:8}}>
            <div className="eyebrow" style={{marginBottom:10}}>TRY ASKING</div>
            <div style={{display:'grid',gridTemplateColumns:isMob?'1fr':'1fr 1fr',gap:8}}>
              {suggestions.map((s,i)=>(
                <button key={i} onClick={()=>send(s)} style={{display:'flex',alignItems:'center',gap:10,padding:'13px 15px',borderRadius:'var(--r-md)',background:'var(--bg-3)',border:'1px solid var(--border)',cursor:'pointer',fontFamily:'var(--font)',textAlign:'start',transition:'all var(--t-fast)'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--blue-border)';e.currentTarget.style.background='var(--bg-hover)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.background='var(--bg-3)'}}>
                  <IC.spark style={{width:14,height:14,color:'var(--blue-text)',flexShrink:0}}/><span style={{fontSize:'var(--text-sm)',color:'var(--text-2)'}}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div style={{paddingTop:14}}>
        <div style={{display:'flex',alignItems:'flex-end',gap:8,background:'var(--bg-3)',border:'1px solid var(--border-2)',borderRadius:'var(--r-lg)',padding:8,transition:'border-color var(--t-fast)'}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Ask about Dutch taxes…" rows={1}
            style={{flex:1,resize:'none',border:'none',background:'transparent',color:'var(--text)',fontSize:'var(--text-base)',fontFamily:'var(--font)',outline:'none',padding:'7px 8px',maxHeight:120,lineHeight:1.5}}
            onInput={e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,120)+'px';}}/>
          <Btn onClick={()=>send()} disabled={!input.trim()||streaming} style={{background:'var(--blue)',color:'#fff',border:'none',width:38,padding:0,justifyContent:'center',flexShrink:0}}><IC.send style={{color:'#fff'}}/></Btn>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:9,fontSize:'var(--text-xs)',color:'var(--text-4)'}}>
          <IC.info style={{width:12,height:12}}/> TaxWijs can make mistakes. Verify important figures with a registered advisor.
        </div>
      </div>
    </div>
  );
}

function ChatMessage({msg,send,setPage}){
  const [revealed,setRevealed]=React.useState(!msg.streaming);
  React.useEffect(()=>{if(msg.streaming){const t=setTimeout(()=>setRevealed(true),30);return()=>clearTimeout(t);}},[]);
  if(msg.role==='user'){
    return(
      <div className="afu" style={{display:'flex',justifyContent:'flex-end'}}>
        <div style={{padding:'11px 15px',borderRadius:'16px 16px 4px 16px',background:'var(--blue)',color:'#fff',fontSize:'var(--text-base)',maxWidth:'78%',lineHeight:1.55}}>{msg.text}</div>
      </div>
    );
  }
  return(
    <div className="afu" style={{display:'flex',gap:11}}>
      <div style={{width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--blue-subtle)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2}}><IC.spark style={{width:14,height:14,color:'var(--blue)'}}/></div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:'var(--text-base)',lineHeight:1.65,color:'var(--text)',marginBottom:msg.cards||msg.actions?12:0}}>
          {msg.streaming?<Typewriter text={msg.text}/>:msg.text}
        </div>
        {revealed&&msg.cards&&(
          <div className="afu" style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:12}}>
            {msg.cards.map(([k,v],i)=>(
              <div key={i} style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:'var(--r-md)',padding:'9px 13px',minWidth:90}}>
                <div style={{fontSize:10,color:'var(--text-3)',marginBottom:3}}>{k}</div>
                <div style={{fontFamily:'var(--mono)',fontSize:'var(--text-md)',fontWeight:700,color:'var(--text)'}}>{v}</div>
              </div>
            ))}
          </div>
        )}
        {revealed&&msg.source&&(
          <div className="afi" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:'var(--r-full)',background:'var(--bg-2)',border:'1px solid var(--border)',fontSize:'var(--text-xs)',color:'var(--text-3)',marginBottom:msg.actions?12:0}}>
            <IC.info style={{width:12,height:12,flexShrink:0}}/>{msg.source}
          </div>
        )}
        {revealed&&msg.actions&&(
          <div className="afi" style={{display:'flex',flexWrap:'wrap',gap:7}}>
            {msg.actions.map((a,i)=>{
              const isSave=a.toLowerCase().includes('save');const isCalc=a.toLowerCase().includes('calculate');
              return <button key={i} onClick={()=>{if(isCalc)setPage('calculator');else if(isSave)setPage('dashboard');else send(a);}}
                style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 13px',borderRadius:'var(--r-full)',border:`1px solid ${isSave?'var(--blue-border)':'var(--border-2)'}`,background:isSave?'var(--blue-subtle)':'var(--bg-3)',color:isSave?'var(--blue-text)':'var(--text-2)',fontSize:'var(--text-xs)',fontWeight:600,cursor:'pointer',fontFamily:'var(--font)',transition:'all var(--t-fast)'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--blue-border)'} onMouseLeave={e=>e.currentTarget.style.borderColor=isSave?'var(--blue-border)':'var(--border-2)'}>
                {isSave&&<IC.plus/>}{isCalc&&<IC.calc style={{width:13,height:13}}/>}{a}
              </button>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Typewriter({text}){
  const [shown,setShown]=React.useState('');
  React.useEffect(()=>{
    let i=0;const step=Math.max(1,Math.round(text.length/90));
    const ti=setInterval(()=>{i+=step;setShown(text.slice(0,i));if(i>=text.length)clearInterval(ti);},22);
    return()=>clearInterval(ti);
  },[text]);
  return <span>{shown}{shown.length<text.length&&<span style={{display:'inline-block',width:2,height:14,background:'var(--blue)',marginInlineStart:1,verticalAlign:'middle',animation:'pulse 1s infinite'}}/>}</span>;
}

function buildResponse(q){
  const l=q.toLowerCase();
  if(l.includes('zelfstandig')||l.includes('self-employ'))
    return{text:"Yes — you likely qualify for the zelfstandigenaftrek. To claim it you must meet the urencriterium: at least 1,225 hours spent on your business per year. With your logged 1,340 hours, you're over the threshold. For 2026 the deduction is €3,750, on top of the 12.7% MKB profit exemption.",
      cards:[['Zelfstandigenaftrek','€3,750'],['Hours needed','1,225'],['Your hours','1,340 ✓'],['Est. saving','€3,847']],source:'belastingdienst.nl · zelfstandigenaftrek 2026',actions:['Calculate my exact tax','Save to dashboard','What else can I deduct?']};
  if(l.includes('30%')||l.includes('ruling')||l.includes('expat'))
    return{text:"The 30% ruling lets eligible employees recruited from abroad receive 30% of their salary tax-free for up to 5 years, as compensation for relocation costs. From 2024 it tapers: 30% for the first 20 months, 20% for the next 20, then 10%. You must earn above €46,107 (2026) and have lived 150km+ from the NL border before starting.",
      cards:[['Tax-free','30% → 10%'],['Duration','5 years'],['Min. salary','€46,107']],source:'belastingdienst.nl · 30%-regeling',actions:['Am I eligible?','Calculate net salary','Save to dashboard']};
  if(l.includes('deduct')||l.includes('aftrek'))
    return{text:"As a ZZP'er you can deduct business expenses that are reasonable and necessary: workspace costs, equipment, professional insurance, travel (€0.23/km), training, and a portion of phone/internet. Larger investments may qualify for the kleinschaligheidsinvesteringsaftrek (KIA). You also get the 12.7% MKB profit exemption automatically.",
      cards:[['Mileage','€0.23/km'],['MKB exemption','12.7%'],['KIA','up to 28%']],source:'belastingdienst.nl · aftrekbare kosten',actions:['Run the deduction checker','Calculate my tax','Save to dashboard']};
  if(l.includes('vat')||l.includes('btw'))
    return{text:"The standard Dutch VAT (BTW) rate is 21%, with a reduced 9% rate for food, books, and some services. As a ZZP'er you file BTW quarterly. If your turnover is under €20,000/year you may use the kleineondernemersregeling (KOR) and be exempt from charging VAT.",
      cards:[['Standard rate','21%'],['Reduced rate','9%'],['KOR threshold','€20,000']],source:'belastingdienst.nl · btw-tarieven',actions:['Calculate my VAT','Save to dashboard','Am I eligible for KOR?']};
  return CHAT_RESPONSES.default;
}
window.ChatPage=ChatPage;
