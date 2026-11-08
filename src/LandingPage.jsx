import { useEffect, useRef, useState } from 'react'
import './LandingPage.css'

const featureTabs = [
  { id: 'private', label: 'Private chats', eyebrow: 'ONE TO ONE', title: 'A conversation that feels personal.', copy: 'Pick up where you left off. Share messages, reply in context, and know when your words have reached the other side.', points: ['Read receipts', 'Reply to any message', 'Online presence'], stat: '01 / 06' },
  { id: 'groups', label: 'Group spaces', eyebrow: 'TOGETHER, BETTER', title: 'Your whole circle. One space.', copy: 'Bring people together around the conversations, plans, and little moments you share.', points: ['Group conversations', 'Member controls', 'Leave whenever you need'], stat: '02 / 06' },
  { id: 'voice', label: 'Voice messages', eyebrow: 'SAY IT YOUR WAY', title: 'Some things sound better out loud.', copy: 'Hold to record, preview your voice message, then send when it sounds just right.', points: ['Hold to record', 'Listen before sending', 'Live recording waveform'], stat: '03 / 06' },
  { id: 'reactions', label: 'Reactions & replies', eyebrow: 'MORE THAN WORDS', title: 'Make every message feel heard.', copy: 'React with expressive emojis or reply to the exact message you mean. Keep the conversation flowing.', points: ['Message reactions', 'Threaded context', 'Expressive emoji choices'], stat: '04 / 06' },
  { id: 'presence', label: 'Online & read status', eyebrow: 'IN THE MOMENT', title: 'Know when they are around.', copy: 'See who is online, spot typing indicators, and follow message delivery and read status.', points: ['Live online indicator', 'Typing feedback', 'Delivered and read states'], stat: '05 / 06' },
  { id: 'privacy', label: 'Privacy controls', eyebrow: 'YOUR SPACE, YOUR RULES', title: 'Stay in control of your space.', copy: 'Choose how people can reach you, see your activity, and add you to groups.', points: ['Who can message you', 'Last-seen visibility', 'Group invitation controls'], stat: '06 / 06' },
]

const demoMessages = [
  { from: 'them', text: 'The new space is looking good. What do you think?' },
  { from: 'you', text: 'Love how everything is in one place. ✨' },
  { from: 'them', text: 'Same here. Sending the voice note now.' },
]

function Brand() {
  return <a className="landing-brand" href="#top" aria-label="Notification home"><span className="landing-brand-mark">N</span><span>notification<span>.</span></span></a>
}

function Arrow({ children = '↗' }) {
  return <span aria-hidden="true">{children}</span>
}

function ChatWindow({ activeTab, setActiveTab }) {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState(demoMessages)
  const [reaction, setReaction] = useState('❤️')
  const inputRef = useRef(null)

  const sendMessage = (event) => {
    event.preventDefault()
    const clean = draft.trim()
    if (!clean) return
    setMessages((current) => [...current, { from: 'you', text: clean }].slice(-5))
    setDraft('')
    inputRef.current?.focus()
  }

  return (
    <div className="lp-chat-window">
      <div className="lp-chat-sidebar">
        <div className="lp-mini-logo">N</div>
        <span className="lp-side-active">▤</span><span>◎</span><span>♧</span><span className="lp-side-settings">⚙</span>
      </div>
      <div className="lp-chat-list">
        <div className="lp-chat-list-title">Messages <span>＋</span></div>
        <div className="lp-chat-search">⌕ &nbsp; Search conversations</div>
        <small className="lp-chat-label">PINNED</small>
        <button className={activeTab === 'private' ? 'lp-chat-person selected' : 'lp-chat-person'} onClick={() => setActiveTab('private')}><i className="lp-person-avatar ava-a">A</i><span><b>Alex Morgan</b><small>That sounds perfect!</small></span><em>10:42</em></button>
        <button className={activeTab === 'groups' ? 'lp-chat-person selected' : 'lp-chat-person'} onClick={() => setActiveTab('groups')}><i className="lp-person-avatar ava-b">S</i><span><b>Studio Circle</b><small>Mia: Added the files</small></span><em>10:18</em></button>
        <small className="lp-chat-label">RECENT</small>
        <button className="lp-chat-person" onClick={() => setActiveTab('private')}><i className="lp-person-avatar ava-c">O</i><span><b>Olivia Rhye</b><small>See you tomorrow ✨</small></span><em>Yesterday</em></button>
        <button className="lp-chat-person" onClick={() => setActiveTab('private')}><i className="lp-person-avatar ava-d">N</i><span><b>Noah Williams</b><small>Sent you the notes</small></span><em>Tue</em></button>
      </div>
      <div className="lp-chat-main">
        <div className="lp-chat-top"><i className="lp-person-avatar ava-a">{activeTab === 'groups' ? 'S' : 'A'}</i><span><b>{activeTab === 'groups' ? 'Studio Circle' : 'Alex Morgan'}</b><small><i></i>{activeTab === 'groups' ? '5 members' : 'Online now'}</small></span><div className="lp-chat-tools"><button aria-label="Search">⌕</button><button aria-label="More options">···</button></div></div>
        <div className="lp-chat-date">TODAY · 10:30 AM</div>
        <div className="lp-message-stack">
          {messages.map((message, index) => <div className={'lp-message ' + message.from} key={index}>{message.text}{index === 1 && <button className="lp-reaction-chip" onClick={() => setReaction(reaction === '❤️' ? '✨' : '❤️')} aria-label="Change reaction">{reaction} <small>1</small></button>}</div>)}
        </div>
        <div className="lp-typing"><span></span><span></span><span></span><small>Alex is typing</small></div>
        <form className="lp-chat-compose" onSubmit={sendMessage}><button type="button" aria-label="Add attachment">＋</button><input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message..." aria-label="Demo message" /><button className="lp-send" type="submit" aria-label="Send demo message"><Arrow>↑</Arrow></button></form>
        <div className="lp-demo-caption">INTERACTIVE PREVIEW · TRY SENDING A MESSAGE</div>
      </div>
    </div>
  )
}

function FeatureShowcase({ activeFeature, setActiveFeature }) {
  const active = featureTabs.find((item) => item.id === activeFeature) || featureTabs[0]
  return (
    <section className="lp-feature-section" id="features">
      <div className="lp-feature-heading lp-reveal"><div><span className="lp-eyebrow">MADE FOR EVERY KIND OF CONVERSATION</span><h2>Thoughtful details.<br/><em>Everyday magic.</em></h2></div><p>Everything you need to stay close, designed to stay out of your way.</p></div>
      <div className="lp-feature-layout">
        <div className="lp-feature-tabs lp-reveal" role="tablist" aria-label="Notification features">
          {featureTabs.map((feature) => <button key={feature.id} role="tab" aria-selected={activeFeature === feature.id} className={activeFeature === feature.id ? 'lp-feature-tab active' : 'lp-feature-tab'} onClick={() => setActiveFeature(feature.id)}><span>{feature.stat}</span><b>{feature.label}</b><Arrow /></button>)}
        </div>
        <div className="lp-feature-detail lp-reveal" role="tabpanel" key={active.id}>
          <span className="lp-eyebrow">{active.eyebrow}</span><span className="lp-feature-index">{active.stat}</span>
          <h3>{active.title}</h3><p>{active.copy}</p>
          <ul>{active.points.map((point) => <li key={point}><span>↗</span>{point}</li>)}</ul>
          <div className="lp-feature-visual" aria-hidden="true"><div className="lp-orbit orbit-one"></div><div className="lp-orbit orbit-two"></div><div className="lp-orbit-core">N</div><div className="lp-orbit-float float-one">✦</div><div className="lp-orbit-float float-two">•••</div><div className="lp-orbit-float float-three">↗</div></div>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage({ onGetStarted }) {
  const [activeFeature, setActiveFeature] = useState('private')
  const [activeDemo, setActiveDemo] = useState('private')
  const [menuOpen, setMenuOpen] = useState(false)
  const scrollRef = useRef(null)
  const progressRef = useRef(null)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return undefined
    const nodes = root.querySelectorAll('.lp-reveal')
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { root, threshold: 0.12 })
    nodes.forEach((node) => observer.observe(node))
    const updateProgress = () => {
      const max = root.scrollHeight - root.clientHeight
      const progress = max > 0 ? root.scrollTop / max : 0
      if (progressRef.current) progressRef.current.style.transform = 'scaleX(' + progress + ')'
      root.style.setProperty('--lp-scroll', String(progress))
    }
    root.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => {
      observer.disconnect()
      root.removeEventListener('scroll', updateProgress)
    }
  }, [])

  const jumpTo = (id) => {
    scrollRef.current?.querySelector('#' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMenuOpen(false)
  }

  return (
    <main className="landing-page lp-dark" id="top" ref={scrollRef}>
      <div className="lp-scroll-progress" ref={progressRef}></div>
      <header className="landing-header lp-header">
        <Brand />
        <nav className={menuOpen ? 'lp-nav open' : 'lp-nav'}><button onClick={() => jumpTo('features')}>Features</button><button onClick={() => jumpTo('experience')}>Experience</button><button onClick={() => jumpTo('privacy')}>Privacy</button></nav>
        <div className="lp-header-actions"><button className="lp-header-login" onClick={onGetStarted}>Sign in <Arrow /></button><button className="lp-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle navigation">{menuOpen ? '×' : '☰'}</button></div>
      </header>

      <section className="lp-hero" id="hero">
        <div className="lp-hero-copy lp-reveal">
          <span className="lp-eyebrow"><i></i> A MORE HUMAN WAY TO MESSAGE</span>
          <h1>Closer,<br/>even when<br/><em>apart.</em></h1>
          <p>Life happens between messages. Notification brings your people, your groups, and every little moment into one thoughtful space.</p>
          <div className="lp-hero-actions"><button className="lp-button-primary" onClick={onGetStarted}>Start a conversation <Arrow /></button><button className="lp-button-text" onClick={() => jumpTo('experience')}>Explore the experience <span>↓</span></button></div>
          <div className="lp-hero-footnote"><span className="lp-live-dot"></span> PRIVATE CONVERSATIONS · REAL CONNECTIONS</div>
        </div>
        <div className="lp-hero-art lp-reveal">
          <div className="lp-art-grid"></div><div className="lp-art-glow"></div>
          <div className="lp-floating-card lp-online-card"><span className="lp-live-dot"></span><span><b>Alex Morgan</b><small>Online now</small></span><span className="lp-online-pulse"></span></div>
          <div className="lp-floating-card lp-unread-card"><span className="lp-unread-icon">✳</span><span><b>New message</b><small>You have a moment waiting.</small></span><strong>01</strong></div>
          <div className="lp-hero-orb"><div className="lp-orb-ring ring-a"></div><div className="lp-orb-ring ring-b"></div><div className="lp-orb-ring ring-c"></div><div className="lp-orb-core"><span>N</span><i></i></div><div className="lp-orb-caption">YOUR WORLD<br/>IN ONE PLACE</div></div>
          <div className="lp-art-bottom-label"><span>01 / 06</span><span>CONNECTION, IN MOTION</span></div>
        </div>
        <button className="lp-scroll-cue" onClick={() => jumpTo('experience')}><span>SCROLL TO EXPLORE</span><i>↓</i></button>
      </section>

      <section className="lp-manifesto lp-reveal" id="experience">
        <div className="lp-manifesto-top"><span className="lp-eyebrow">NOT JUST ANOTHER INBOX</span><span>BUILT AROUND PEOPLE, NOT PINGS</span></div>
        <h2>The best conversations<br/>don't need <em>more noise.</em></h2>
        <p>They need room to happen. A quick hello, a group plan, a voice note you had to send — it all belongs here.</p>
        <div className="lp-manifesto-stamp">LESS NOISE<br/><i>✳</i><br/>MORE YOU</div>
      </section>

      <section className="lp-demo-section">
        <div className="lp-demo-heading lp-reveal"><span className="lp-eyebrow">TAKE A CLOSER LOOK</span><h2>Your conversations,<br/><em>in their element.</em></h2><p>A little preview of what staying connected can feel like.</p></div>
        <div className="lp-demo-tabs lp-reveal"><button className={activeDemo === 'private' ? 'active' : ''} onClick={() => setActiveDemo('private')}>01 &nbsp; One-to-one</button><button className={activeDemo === 'groups' ? 'active' : ''} onClick={() => setActiveDemo('groups')}>02 &nbsp; Groups</button></div>
        <div className="lp-demo-frame lp-reveal"><div className="lp-demo-frame-top"><span>NOTIFICATION / LIVE PREVIEW</span><span><i></i> INTERACTIVE DEMO</span></div><ChatWindow activeTab={activeDemo} setActiveTab={setActiveDemo}/></div>
      </section>

      <FeatureShowcase activeFeature={activeFeature} setActiveFeature={setActiveFeature}/>

      <section className="lp-privacy-section" id="privacy">
        <div className="lp-privacy-copy lp-reveal"><span className="lp-eyebrow">YOUR SPACE, YOUR RULES</span><h2>Connection<br/>without giving<br/><em>up control.</em></h2><p>Choose who can message you, who sees your last active time, and who can add you to groups. Your space should feel like yours.</p><button className="lp-button-outline" onClick={onGetStarted}>Make it yours <Arrow /></button></div>
        <div className="lp-privacy-visual lp-reveal"><div className="lp-privacy-panel"><div className="lp-privacy-panel-head"><span>◈</span><b>Privacy settings</b><small>YOUR ACCOUNT</small></div><div className="lp-setting-row"><span><b>Who can message me</b><small>Control who can start a chat</small></span><button onClick={(e) => e.currentTarget.textContent = e.currentTarget.textContent === 'Everyone' ? 'Contacts' : 'Everyone'}>Everyone <span>⌄</span></button></div><div className="lp-setting-row"><span><b>Last seen</b><small>Choose who sees your activity</small></span><button onClick={(e) => e.currentTarget.textContent = e.currentTarget.textContent === 'Contacts' ? 'Nobody' : 'Contacts'}>Contacts <span>⌄</span></button></div><div className="lp-setting-row"><span><b>Group invites</b><small>Decide who can add you</small></span><button onClick={(e) => e.currentTarget.textContent = e.currentTarget.textContent === 'Contacts' ? 'Everyone' : 'Contacts'}>Contacts <span>⌄</span></button></div><div className="lp-privacy-panel-foot"><span className="lp-live-dot"></span> Your preferences, your call.</div></div><div className="lp-privacy-orbit">N</div></div>
      </section>

      <section className="lp-final-cta lp-reveal" id="join"><div className="lp-cta-asterisk">✳</div><span className="lp-eyebrow">YOUR PEOPLE ARE ONE MESSAGE AWAY</span><h2>Make space for<br/><em>what matters.</em></h2><p>Start with a hello. See where the conversation goes.</p><button className="lp-button-light" onClick={onGetStarted}>Join Notification <Arrow /></button><div className="lp-cta-bottom"><span>NOTIFICATION © {new Date().getFullYear()}</span><span>MADE FOR THE MOMENTS IN BETWEEN.</span></div></section>

      <footer className="landing-footer lp-footer"><Brand/><span>A quieter place for your conversations.</span><button onClick={() => jumpTo('hero')}>Back to top ↑</button></footer>
    </main>
  )
}
