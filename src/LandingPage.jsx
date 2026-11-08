import { useEffect, useRef, useState } from 'react'
import './LandingPage.css'

const features = [
  { n:'01', icon:'↗', title:'Private by nature', tag:'PRIVATE CHATS', tone:'mint', copy:'One-to-one conversations with read states, replies, and the little details that make a chat feel personal.' },
  { n:'02', icon:'◉', title:'Your people, together', tag:'GROUP SPACES', tone:'lilac', copy:'Bring your circle into one place. Create groups, share moments, and keep every plan moving.' },
  { n:'03', icon:'♫', title:'Hear the feeling', tag:'VOICE NOTES', tone:'peach', copy:'Hold to record, preview before sending, and let your voice say what a text cannot.' },
  { n:'04', icon:'✳', title:'A little more human', tag:'LIVE MOMENTS', tone:'yellow', copy:'React, reply, and see when someone is around. Conversations should feel alive.' },
]
const startingMessages = [
  {from:'them',text:'Are we still on for this weekend?'},
  {from:'you',text:'Absolutely. I’ll make a group for everyone ✨'},
  {from:'them',text:'Perfect — this is going to be fun!'},
]
function Brand(){return <a className="nx-brand" href="#nx-home" aria-label="Notification home"><span className="nx-brand-mark">n</span><span>notification<span className="nx-brand-period">.</span></span></a>}

const liveMessages = [
  {name:'Jamie Parker',avatar:'J',tone:'lime',text:'This made me think of you ✨',time:'now'},
  {name:'Mia Chen',avatar:'M',tone:'lilac',text:'Everyone is in! See you soon 💚',time:'just now'},
  {name:'Olivia Rhye',avatar:'O',tone:'peach',text:'Sending you a little voice note…',time:'1m ago'},
  {name:'Noah Williams',avatar:'N',tone:'blue',text:'That photo is everything 😂',time:'2m ago'},
]
function LiveMessageStack(){
  const [active,setActive]=useState(0)
  useEffect(()=>{const timer=window.setInterval(()=>setActive(value=>(value+1)%liveMessages.length),3200);return()=>window.clearInterval(timer)},[])
  const message=liveMessages[active]
  return <div className="nx-live-stack" aria-live="polite" aria-atomic="true">
    <div className="nx-live-stack-label"><span className="nx-live-pulse"/> MESSAGES COMING IN <b>LIVE</b></div>
    <div className="nx-live-card" key={active}>
      <span className={'nx-live-avatar '+message.tone}>{message.avatar}<i/></span>
      <span className="nx-live-copy"><b>{message.name}</b><span>{message.text}</span></span>
      <span className="nx-live-time">{message.time}</span>
    </div>
    <div className="nx-live-typing"><span><i/><i/><i/></span> Someone else is typing…</div>
    <div className="nx-live-reactions"><span>💚</span><span>✨</span><span>😂</span><small>little moments, arriving all day</small></div>
  </div>
}

function ProductPreview({onStart}){
  const [mode,setMode]=useState('direct'),[draft,setDraft]=useState(''),[messages,setMessages]=useState(startingMessages),[liked,setLiked]=useState(true),[playing,setPlaying]=useState(false)
  const inputRef=useRef(null)
  const send=(e)=>{e.preventDefault();const value=draft.trim();if(!value)return;setMessages(items=>[...items,{from:'you',text:value}].slice(-4));setDraft('');inputRef.current?.focus()}
  return <div className="nx-product-shell">
    <div className="nx-product-topbar"><div className="nx-window-dots"><i/><i/><i/></div><span>YOUR SPACE <b>•</b> LIVE PREVIEW</span><button onClick={onStart}>Open your space <span>↗</span></button></div>
    <div className="nx-product-ui">
      <aside className="nx-rail"><div className="nx-rail-logo">n</div><button className="active" aria-label="Messages">▤</button><button aria-label="Contacts">♧</button><button aria-label="Groups">◉</button><button className="nx-rail-bottom" aria-label="Settings">⚙</button><div className="nx-rail-avatar">A</div></aside>
      <aside className="nx-inbox"><div className="nx-inbox-heading"><div><small>GOOD AFTERNOON</small><h3>Your inbox<span>.</span></h3></div><button aria-label="New conversation">＋</button></div>
        <div className="nx-search"><span>⌕</span> Search messages</div><div className="nx-inbox-label">PINNED <span>•••</span></div>
        <button className={mode==='direct'?'nx-thread selected':'nx-thread'} onClick={()=>setMode('direct')}><span className="nx-avatar avatar-lime">J</span><span className="nx-thread-copy"><b>Jamie Parker</b><small>That sounds perfect!</small></span><time>Now</time><i className="nx-unread-dot"/></button>
        <button className={mode==='group'?'nx-thread selected':'nx-thread'} onClick={()=>setMode('group')}><span className="nx-avatar avatar-lilac">✳</span><span className="nx-thread-copy"><b>Weekend people</b><small>Mia: sent the details</small></span><time>2m</time></button>
        <div className="nx-inbox-label">RECENT</div><button className="nx-thread" onClick={()=>setMode('direct')}><span className="nx-avatar avatar-peach">O</span><span className="nx-thread-copy"><b>Olivia Rhye</b><small>See you tomorrow ☀️</small></span><time>1h</time></button><button className="nx-thread" onClick={()=>setMode('direct')}><span className="nx-avatar avatar-blue">N</span><span className="nx-thread-copy"><b>Noah Williams</b><small>Voice message</small></span><time>3h</time></button><div className="nx-inbox-footer"><span className="nx-online-indicator"/> 3 friends online</div>
      </aside>
      <section className="nx-conversation"><header className="nx-conversation-head"><span className={mode==='group'?'nx-avatar avatar-lilac':'nx-avatar avatar-lime'}>{mode==='group'?'✳':'J'}</span><div><b>{mode==='group'?'Weekend people':'Jamie Parker'}</b><small><i/> {mode==='group'?'6 members · 3 online':'Online now'}</small></div><div className="nx-conversation-actions"><button aria-label="Search chat">⌕</button><button aria-label="More options">···</button></div></header>
        <div className="nx-day-divider"><span/> TODAY, 10:42 AM <span/></div><div className="nx-chat-messages">{messages.map((m,i)=><div key={i} className={'nx-bubble '+m.from}><span>{m.text}</span>{i===1&&<button className="nx-message-reaction" onClick={()=>setLiked(!liked)}>{liked?'💚':'✨'} <small>1</small></button>}</div>)}</div>
        <div className="nx-typing"><span><i/><i/><i/></span> Jamie is typing</div><div className="nx-voice-preview"><button onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause voice preview':'Play voice preview'}>{playing?'Ⅱ':'▶'}</button><div className={playing?'nx-wave playing':'nx-wave'}>{Array.from({length:26},(_,i)=><i key={i} style={{height:(8+(i*13)%19)+'px'}}/>)}</div><small>{playing?'Playing':'0:08'}</small></div>
        <form className="nx-compose" onSubmit={send}><button type="button" aria-label="Add attachment">＋</button><input ref={inputRef} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write something lovely..." aria-label="Try sending a message"/><button type="button" className="nx-emoji" onClick={()=>setDraft(v=>v+' ✨')} aria-label="Add sparkle">☺</button><button className="nx-send" type="submit" aria-label="Send message">↑</button></form><div className="nx-preview-hint">A TINY PREVIEW — TRY SENDING A MESSAGE</div>
      </section>
    </div>
  </div>
}

export default function LandingPage({onGetStarted}){
  const [menuOpen,setMenuOpen]=useState(false),[activeFeature,setActiveFeature]=useState(0)
  const [privacy,setPrivacy]=useState({messages:'Contacts',lastSeen:'Nobody',groups:'Contacts'})
  const rootRef=useRef(null),progressRef=useRef(null)
  useEffect(()=>{
    const root=rootRef.current;if(!root)return undefined
    const nodes=root.querySelectorAll('.nx-reveal')
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{root,threshold:.12})
    nodes.forEach(node=>observer.observe(node))
    const onScroll=()=>{const max=root.scrollHeight-root.clientHeight;if(progressRef.current)progressRef.current.style.transform='scaleX('+(max>0?root.scrollTop/max:0)+')'}
    root.addEventListener('scroll',onScroll,{passive:true});onScroll()
    return()=>{observer.disconnect();root.removeEventListener('scroll',onScroll)}
  },[])
  const goTo=id=>{rootRef.current?.querySelector('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'});setMenuOpen(false)}
  const cycle=(key,values)=>setPrivacy(current=>{const i=values.indexOf(current[key]);return {...current,[key]:values[(i+1)%values.length]}})
  return <main className="nx-page" id="nx-home" ref={rootRef}>
    <div className="nx-progress" ref={progressRef}/>
    <header className="nx-header"><Brand/><nav className={menuOpen?'nx-nav open':'nx-nav'}><button onClick={()=>goTo('nx-features')}>Why Notification</button><button onClick={()=>goTo('nx-preview')}>The experience</button><button onClick={()=>goTo('nx-privacy')}>Your privacy</button></nav><div className="nx-header-actions"><button className="nx-signin" onClick={onGetStarted}>Sign in <span>↗</span></button><button className="nx-mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?'×':'☰'}</button></div></header>
    <section className="nx-hero" id="nx-hero"><div className="nx-hero-copy nx-reveal"><div className="nx-kicker"><span/> A LITTLE CLOSER, EVERY DAY</div><h1>Good chats.<br/><em>Great</em> people<span className="nx-heading-period">.</span></h1><p>Your people are your favorite part of life. Give every message, voice note, and shared moment a place that feels like yours.</p><div className="nx-hero-actions"><button className="nx-primary" onClick={onGetStarted}>Find your people <span>↗</span></button><button className="nx-watch" onClick={()=>goTo('nx-preview')}><span>▶</span> Take a quick look</button></div><div className="nx-social-proof"><div className="nx-avatar-stack"><i>J</i><i>M</i><i>A</i><i>+</i></div><span><b>Made for your circle.</b><small>Private chats · Group moments · Real connection</small></span></div></div>
      <div className="nx-hero-visual nx-reveal"><div className="nx-visual-sun"/><LiveMessageStack/><div className="nx-visual-orbit orbit-a"/><div className="nx-visual-orbit orbit-b"/><div className="nx-hero-sticker"><span>✳</span> your kind of space</div><div className="nx-hero-note"><span className="nx-note-icon">♫</span><span><b>A voice note for you</b><small>0:08 · from Jamie</small></span><span className="nx-note-play">▶</span></div><div className="nx-hero-message"><span className="nx-message-avatar">J</span><span><small>JAMIE · JUST NOW</small><b>“This made me think of you.”</b></span><span className="nx-message-heart">♥</span></div><div className="nx-visual-caption">A PLACE FOR THE EVERYDAY MAGIC <span>✳</span></div></div>
      <button className="nx-scroll-cue" onClick={()=>goTo('nx-intro')}>SCROLL TO FEEL THE DIFFERENCE <span>↓</span></button>
    </section>
    <section className="nx-intro nx-reveal" id="nx-intro"><span className="nx-section-label">A BETTER KIND OF INBOX</span><h2>Less scrolling.<br/><em>More belonging.</em></h2><p>Not another noisy feed. Just a thoughtful home for the people you actually want to hear from.</p><div className="nx-intro-mark">n<span>.</span></div></section>
    <section className="nx-preview-section" id="nx-preview"><div className="nx-section-heading nx-reveal"><div><span className="nx-section-label">COME ON IN</span><h2>Feels familiar.<br/><em>Works beautifully.</em></h2></div><p>Explore a little. Switch conversations, play a voice note, or send a message right here.</p></div><div className="nx-preview-wrap nx-reveal"><ProductPreview onStart={onGetStarted}/></div><div className="nx-preview-foot"><span>01 — YOUR INBOX, REIMAGINED</span><span>INTERACTIVE PRODUCT PREVIEW ↗</span></div></section>
    <section className="nx-features-section" id="nx-features"><div className="nx-section-heading nx-reveal"><div><span className="nx-section-label">THE GOOD STUFF</span><h2>Small details.<br/><em>Big feelings.</em></h2></div><p>Everything you need to stay close, without getting in the way of the moment.</p></div><div className="nx-feature-grid">{features.map((f,i)=><button key={f.n} className={'nx-feature-card '+f.tone+(activeFeature===i?' chosen':'')} onClick={()=>setActiveFeature(i)}><div className="nx-feature-card-top"><span>{f.n} / 04</span><span className="nx-feature-icon">{f.icon}</span></div><div><small>{f.tag}</small><h3>{f.title}</h3><p>{f.copy}</p></div><div className="nx-feature-card-bottom"><span>{activeFeature===i?'YOU’RE HERE':'EXPLORE THIS'}</span><b>↗</b></div></button>)}</div><div className="nx-feature-selected nx-reveal"><span>YOUR PICK</span><b>{features[activeFeature].title}</b><p>{features[activeFeature].copy}</p><span className="nx-selected-progress"><i style={{width:((activeFeature+1)/features.length*100)+'%'}}/></span></div></section>
    <section className="nx-privacy-section" id="nx-privacy"><div className="nx-privacy-copy nx-reveal"><span className="nx-section-label">COMFORT IS A FEATURE</span><h2>Your space.<br/><em>Your say.</em></h2><p>Choose who can reach you, who sees your activity, and who gets to add you to a group. Your boundaries belong in the design.</p><button className="nx-outline" onClick={onGetStarted}>Make it yours <span>↗</span></button></div><div className="nx-settings-card nx-reveal"><div className="nx-settings-head"><span className="nx-settings-symbol">⌘</span><div><b>Your privacy</b><small>A FEW WAYS TO MAKE IT YOURS</small></div><span className="nx-settings-lock">✳</span></div><div className="nx-setting"><div><b>Who can message me</b><small>Choose who can start a conversation</small></div><button onClick={()=>cycle('messages',['Everyone','Contacts','Nobody'])}>{privacy.messages}<span>⌄</span></button></div><div className="nx-setting"><div><b>Last seen</b><small>Keep your activity on your terms</small></div><button onClick={()=>cycle('lastSeen',['Everyone','Contacts','Nobody'])}>{privacy.lastSeen}<span>⌄</span></button></div><div className="nx-setting"><div><b>Group invitations</b><small>Decide who can add you to groups</small></div><button onClick={()=>cycle('groups',['Everyone','Contacts','Nobody'])}>{privacy.groups}<span>⌄</span></button></div><div className="nx-settings-foot"><span/> Your choices. Your comfort. Always.</div></div></section>
    <section className="nx-cta nx-reveal"><div className="nx-cta-spark">✳</div><span className="nx-section-label">YOUR PEOPLE ARE RIGHT THERE</span><h2>Start with<br/><em>a hello.</em></h2><p>The little moments deserve a lovely place to land.</p><button className="nx-primary nx-primary-dark" onClick={onGetStarted}>Get started — it’s free <span>↗</span></button><div className="nx-cta-bottom"><span>NOTIFICATION © {new Date().getFullYear()}</span><span>MADE FOR THE PEOPLE WHO MATTER.</span></div></section>
    <footer className="nx-footer"><Brand/><span>A little more human, one message at a time.</span><button onClick={()=>goTo('nx-home')}>Back to top ↑</button></footer>
  </main>
}
