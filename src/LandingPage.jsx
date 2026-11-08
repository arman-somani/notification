import './LandingPage.css'

const features = [
  { number: '01', title: 'Conversations that flow', copy: 'Keep one-to-one chats and group conversations close, clear, and easy to follow.' },
  { number: '02', title: 'A little more expressive', copy: 'React, reply, share voice messages, and send the moments that words cannot.' },
  { number: '03', title: 'Your space, your way', copy: 'Thoughtful privacy controls, a calm interface, and light or dark mode.' },
]

function Brand() {
  return <a className="landing-brand" href="#top" aria-label="Notification home"><span className="landing-brand-mark">N</span><span>notification<span>.</span></span></a>
}

function ChatPreview() {
  return (
    <div className="landing-preview" aria-label="Preview of the Notification chat interface">
      <div className="preview-sidebar">
        <div className="preview-side-brand"><span>N</span></div>
        <div className="preview-side-icon active">▤</div><div className="preview-side-icon">◎</div><div className="preview-side-icon">☆</div>
        <div className="preview-side-bottom">⚙</div>
      </div>
      <div className="preview-list">
        <div className="preview-list-heading"><span>Messages</span><i>＋</i></div>
        <div className="preview-search">⌕ &nbsp; Search conversations</div>
        <div className="preview-section-label">PINNED</div>
        <div className="preview-person selected"><span className="preview-avatar avatar-one">A</span><span><b>Alex Morgan</b><small>That sounds perfect!</small></span><time>10:42</time></div>
        <div className="preview-person"><span className="preview-avatar avatar-two">O</span><span><b>Olivia Rhye</b><small>See you tomorrow ✨</small></span><time>10:18</time></div>
        <div className="preview-section-label">ALL MESSAGES</div>
        <div className="preview-person"><span className="preview-avatar avatar-three">N</span><span><b>Noah Williams</b><small>Sent you the notes.</small></span><time>Yesterday</time></div>
        <div className="preview-person"><span className="preview-avatar avatar-four">E</span><span><b>Emma Thompson</b><small>Take a look when free?</small></span><time>Yesterday</time></div>
        <div className="preview-person"><span className="preview-avatar avatar-five">S</span><span><b>Studio Circle</b><small>Mia: Added the assets.</small></span><time>Tue</time></div>
      </div>
      <div className="preview-chat">
        <div className="preview-chat-head"><span className="preview-avatar avatar-one">A</span><span><b>Alex Morgan</b><small><i></i> Online</small></span><span className="preview-chat-actions">⌕　⋯</span></div>
        <div className="preview-date">TODAY, 10:30 AM</div>
        <div className="preview-bubble received">Hey! Have you had a chance to see the new designs?</div>
        <div className="preview-bubble sent">Just opened them. The direction looks really good.</div>
        <div className="preview-bubble received">Amazing. I wanted to keep everything simple and focused.</div>
        <div className="preview-bubble sent">You nailed it. Let's ship this ✨</div>
        <div className="preview-typing"><i></i><i></i><i></i></div>
        <div className="preview-composer"><span>Write a message...</span><b>↑</b></div>
      </div>
    </div>
  )
}

export default function LandingPage({ onGetStarted }) {
  return (
    <main className="landing-page" id="top">
      <header className="landing-header"><Brand /><nav><a href="#features">Features</a><a href="#about">About</a></nav><button className="landing-signin" onClick={onGetStarted}>Sign in <span>↗</span></button></header>
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-kicker"><span></span> A BETTER WAY TO STAY CLOSE</div>
          <h1>Good conversations.<br/><em>Better connections.</em></h1>
          <p className="landing-subtitle">A calmer space for the people who matter. Share a thought, catch up with your circle, and make every conversation feel a little more personal.</p>
          <div className="landing-actions"><button className="landing-primary" onClick={onGetStarted}>Get started <span>↗</span></button><a className="landing-secondary" href="#features">Explore features <span>↓</span></a></div>
          <div className="landing-note"><span>✳</span> Thoughtful by design. Made for everyday moments.</div>
        </div>
        <div className="landing-visual"><div className="landing-visual-glow"></div><div className="landing-floating-tag tag-top"><span className="tag-dot"></span> Alex is online</div><ChatPreview/><div className="landing-floating-tag tag-bottom">✦ &nbsp; Your conversations, all in one place</div></div>
      </section>
      <div className="landing-trust"><span>MADE FOR REAL CONNECTIONS</span><i></i><span>PRIVATE BY DEFAULT</span><i></i><span>DESIGNED TO FEEL SIMPLE</span></div>
      <section className="landing-features" id="features"><div className="landing-section-intro"><span className="landing-kicker">THE LITTLE THINGS MATTER</span><h2>Everything you need.<br/><em>Nothing in your way.</em></h2><p>All the essentials for staying connected, wrapped in an experience that feels effortless.</p></div><div className="landing-feature-grid">{features.map((feature) => <article className="landing-feature" key={feature.number}><span>{feature.number}</span><div><h3>{feature.title}</h3><p>{feature.copy}</p></div><b>↗</b></article>)}</div></section>
      <section className="landing-cta" id="about"><div><span className="landing-kicker">YOUR PEOPLE ARE ONE MESSAGE AWAY</span><h2>Make room for<br/><em>more meaningful moments.</em></h2></div><button className="landing-primary" onClick={onGetStarted}>Join Notification <span>↗</span></button></section>
      <footer className="landing-footer"><Brand/><span>© {new Date().getFullYear()} Notification. Made for the moments that matter.</span><a href="#top">Back to top ↑</a></footer>
    </main>
  )
}
