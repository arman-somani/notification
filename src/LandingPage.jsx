import { useEffect, useRef, useState } from 'react'
import './LandingPage.css'

const features = [
  { n:'01', icon:'↗', title:'Private by nature', tag:'PRIVATE CHATS', tone:'mint', copy:'One-to-one conversations with read states, replies, and the little details that make a chat feel personal.' },
  { n:'02', icon:'◉', title:'Your people, together', tag:'GROUP SPACES', tone:'lilac', copy:'Bring your circle into one place. Create groups, share moments, and keep every plan moving.' },
  { n:'03', icon:'♫', title:'Hear the feeling', tag:'VOICE NOTES', tone:'peach', copy:'Hold to record, preview before sending, and let your voice say what a text cannot.' },
  { n:'04', icon:'✳', title:'A little more human', tag:'LIVE MOMENTS', tone:'yellow', copy:'React, reply, and see when someone is around. Conversations should feel alive.' },
]
function Brand(){return <a className="nx-brand" href="#nx-home" aria-label="Converly home"><span className="nx-brand-mark">c</span><span>converly<span className="nx-brand-period">.</span></span></a>}

function ProductPreview({onStart}){
  return <div className="nx-product-shell">
    <div className="nx-product-topbar"><div className="nx-window-dots"><i/><i/><i/></div><span>YOUR SPACE <b>•</b> REAL CONTACTS ONLY</span><button onClick={onStart}>Open your space <span>↗</span></button></div>
    <div className="nx-product-ui">
      <aside className="nx-rail"><div className="nx-rail-logo">c</div><button className="active" aria-label="Messages">▤</button><button aria-label="Contacts">♧</button><button aria-label="Groups">◉</button><button className="nx-rail-bottom" aria-label="Settings">⚙</button></aside>
      <aside className="nx-inbox">
        <div className="nx-inbox-heading"><div><small>YOUR SPACE</small><h3>Your inbox<span>.</span></h3></div><button aria-label="Add friends" onClick={onStart}>＋</button></div>
        <div className="nx-search"><span>⌕</span> Search people or messages</div>
        <div className="nx-inbox-label">CONVERSATIONS</div>
        <div className="nx-empty-inbox"><span className="nx-empty-mark">✳</span><b>No chats yet</b><small>Your accepted friends will appear here.</small></div>
        <div className="nx-inbox-footer">Only real contacts. No sample conversations.</div>
      </aside>
      <section className="nx-conversation">
        <header className="nx-conversation-head"><span className="nx-avatar avatar-lime">c</span><div><b>Converly</b><small><i/> Your private space</small></div></header>
        <div className="nx-day-divider"><span/> YOUR SPACE <span/></div>
        <div className="nx-chat-messages"><div className="nx-empty-conversation"><span>✳</span><b>Your conversations stay yours.</b><small>Find a real person by username and add them as a friend to start chatting.</small><button onClick={onStart}>Get started ↗</button></div></div>
        <div className="nx-preview-hint">MESSAGES APPEAR HERE AFTER YOU CONNECT WITH FRIENDS</div>
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
    <header className="nx-header"><Brand/><nav className={menuOpen?'nx-nav open':'nx-nav'}><button onClick={()=>goTo('nx-features')}>Why Converly</button><button onClick={()=>goTo('nx-preview')}>The experience</button><button onClick={()=>goTo('nx-privacy')}>Your privacy</button></nav><div className="nx-header-actions"><button className="nx-signin" onClick={onGetStarted}>Sign in <span>↗</span></button><button className="nx-mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen?'×':'☰'}</button></div></header>
    <section className="nx-hero" id="nx-hero"><div className="nx-hero-copy nx-reveal"><div className="nx-kicker"><span/> A LITTLE CLOSER, EVERY DAY</div><h1>Good chats.<br/><em>Great</em> people<span className="nx-heading-period">.</span></h1><p>Your people are your favorite part of life. Give every message, voice note, and shared moment a place that feels like yours.</p><div className="nx-hero-actions"><button className="nx-primary" onClick={onGetStarted}>Find your people <span>↗</span></button><button className="nx-watch" onClick={()=>goTo('nx-preview')}><span>▶</span> Take a quick look</button></div><div className="nx-social-proof"><span className="nx-proof-mark">✳</span><span><b>Made for real connections.</b><small>Private chats · Group moments · Real connection</small></span></div></div>
      <div className="nx-hero-visual nx-reveal"><div className="nx-visual-sun"/><div className="nx-visual-orbit orbit-a"/><div className="nx-visual-orbit orbit-b"/><div className="nx-hero-sticker"><span>✳</span> your kind of space</div><div className="nx-hero-note"><span className="nx-note-icon">♫</span><span><b>Voice notes</b><small>Share a moment in your own words</small></span><span className="nx-note-play">▶</span></div><div className="nx-hero-message"><span className="nx-message-avatar">c</span><span><small>CONVERLY · YOUR SPACE</small><b>Your people. Your conversations.</b></span><span className="nx-message-heart">♥</span></div><div className="nx-visual-caption">A PLACE FOR THE EVERYDAY MAGIC <span>✳</span></div></div>
      <button className="nx-scroll-cue" onClick={()=>goTo('nx-intro')}>SCROLL TO FEEL THE DIFFERENCE <span>↓</span></button>
    </section>
    <section className="nx-intro nx-reveal" id="nx-intro"><span className="nx-section-label">A BETTER KIND OF INBOX</span><h2>Less scrolling.<br/><em>More belonging.</em></h2><p>Not another noisy feed. Just a thoughtful home for the people you actually want to hear from.</p><div className="nx-intro-mark">c<span>.</span></div></section>
    <section className="nx-preview-section" id="nx-preview"><div className="nx-section-heading nx-reveal"><div><span className="nx-section-label">COME ON IN</span><h2>Feels familiar.<br/><em>Works beautifully.</em></h2></div><p>No invented contacts or sample chats. Your inbox fills with the people you choose to connect with.</p></div><div className="nx-preview-wrap nx-reveal"><ProductPreview onStart={onGetStarted}/></div><div className="nx-preview-foot"><span>01 — YOUR INBOX, BUILT AROUND YOUR PEOPLE</span><span>REAL-CONTACT EMPTY STATE ↗</span></div></section>
    <section className="nx-features-section" id="nx-features"><div className="nx-section-heading nx-reveal"><div><span className="nx-section-label">THE GOOD STUFF</span><h2>Small details.<br/><em>Big feelings.</em></h2></div><p>Everything you need to stay close, without getting in the way of the moment.</p></div><div className="nx-feature-grid">{features.map((f,i)=><button key={f.n} className={'nx-feature-card '+f.tone+(activeFeature===i?' chosen':'')} onClick={()=>setActiveFeature(i)}><div className="nx-feature-card-top"><span>{f.n} / 04</span><span className="nx-feature-icon">{f.icon}</span></div><div><small>{f.tag}</small><h3>{f.title}</h3><p>{f.copy}</p></div><div className="nx-feature-card-bottom"><span>{activeFeature===i?'YOU’RE HERE':'EXPLORE THIS'}</span><b>↗</b></div></button>)}</div><div className="nx-feature-selected nx-reveal"><span>YOUR PICK</span><b>{features[activeFeature].title}</b><p>{features[activeFeature].copy}</p><span className="nx-selected-progress"><i style={{width:((activeFeature+1)/features.length*100)+'%'}}/></span></div></section>
    <section className="nx-privacy-section" id="nx-privacy"><div className="nx-privacy-copy nx-reveal"><div className="nx-privacy-message-bubble"><div className="nx-privacy-message-meta"><span className="nx-privacy-message-avatar">c</span><span><b>CONVERLY</b><small> A NOTE ABOUT YOUR SPACE</small></span><time>now</time></div><span className="nx-section-label">COMFORT IS A FEATURE</span><h2>Your space.<br/><em>Your say.</em></h2><p>Choose who can reach you, who sees your activity, and who gets to add you to a group. Your boundaries belong in the design.</p><button className="nx-privacy-message-cta" onClick={onGetStarted}>Make it yours <span>↗</span></button><span className="nx-message-read-state">✓✓ &nbsp; delivered with care</span></div></div><div className="nx-settings-card nx-reveal"><div className="nx-settings-head"><span className="nx-settings-symbol">⌘</span><div><b>Your privacy</b><small>A FEW WAYS TO MAKE IT YOURS</small></div><span className="nx-settings-lock">✳</span></div><div className="nx-setting"><div><b>Who can message me</b><small>Choose who can start a conversation</small></div><button onClick={()=>cycle('messages',['Everyone','Contacts','Nobody'])}>{privacy.messages}<span>⌄</span></button></div><div className="nx-setting"><div><b>Last seen</b><small>Keep your activity on your terms</small></div><button onClick={()=>cycle('lastSeen',['Everyone','Contacts','Nobody'])}>{privacy.lastSeen}<span>⌄</span></button></div><div className="nx-setting"><div><b>Group invitations</b><small>Decide who can add you to groups</small></div><button onClick={()=>cycle('groups',['Everyone','Contacts','Nobody'])}>{privacy.groups}<span>⌄</span></button></div><div className="nx-settings-foot"><span/> Your choices. Your comfort. Always.</div></div></section>
    <section className="nx-cta nx-reveal"><div className="nx-cta-spark">✳</div><span className="nx-section-label">YOUR PEOPLE ARE RIGHT THERE</span><h2>Start with<br/><em>a hello.</em></h2><p>The little moments deserve a lovely place to land.</p><button className="nx-primary nx-primary-dark" onClick={onGetStarted}>Get started — it’s free <span>↗</span></button><div className="nx-cta-bottom"><span>CONVERLY © {new Date().getFullYear()}</span><span>MADE FOR THE PEOPLE WHO MATTER.</span></div></section>
    <footer className="nx-footer"><Brand/><span>A little more human, one message at a time.</span><button onClick={()=>goTo('nx-home')}>Back to top ↑</button></footer>
  </main>
}
