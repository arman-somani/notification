import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare, Zap, Shield, Globe, ArrowRight, Sparkles, Users, Heart,
  Send, Smile, Lock, Star, ChevronDown, Layers, Cpu, Rocket,
  TrendingUp, Activity,
} from 'lucide-react';
import {
  RevealOnScroll, AnimatedGradientText, Counter, stagger, staggerItem,
  SpotlightCard, Marquee, AvatarStack,
} from '../components/ui/Animated';

const features = [
  { icon: <Shield size={24} strokeWidth={2} />, title: 'End-to-End Encryption', color: '#10b981', desc: 'Messages are encrypted so only you and the recipient can read them.' },
  { icon: <Zap size={24} strokeWidth={2} />, title: 'Real-Time Sync', color: '#6366f1', desc: 'Messages deliver instantly across all your devices with zero lag.' },
  { icon: <Users size={24} strokeWidth={2} />, title: 'Smart Friend System', color: '#a855f7', desc: 'Find friends by username and build your contact list in seconds.' },
  { icon: <Heart size={24} strokeWidth={2} />, title: 'Message Reactions', color: '#ec4899', desc: 'React with emojis and reply with context to keep conversations expressive.' },
  { icon: <Layers size={24} strokeWidth={2} />, title: 'Theme Customization', color: '#3b82f6', desc: 'Personalize colors, fonts, and wallpapers to match your style.' },
  { icon: <Rocket size={24} strokeWidth={2} />, title: 'Guest Access', color: '#f97316', desc: 'Jump in without an account and start chatting immediately.' },
];

const steps = [
  { step: '01', icon: <MessageSquare size={24} strokeWidth={2} />, color: '#a855f7', title: 'Create or Join', desc: 'Sign in with email or enter as a guest. Get started in under 10 seconds.' },
  { step: '02', icon: <Users size={24} strokeWidth={2} />, color: '#6366f1', title: 'Find Your People', desc: 'Search a username, add a friend, and start a conversation.' },
  { step: '03', icon: <Send size={24} strokeWidth={2} />, color: '#a855f7', title: 'Chat in Style', desc: 'Send messages, react, reply, and personalize every conversation.' },
];

const stats = [
  { label: 'Active Users', value: 15680, icon: <Users size={18} strokeWidth={2} /> },
  { label: 'Messages Sent', value: 2.4, suffix: 'M+', icon: <Send size={18} strokeWidth={2} />, decimals: 1 },
  { label: 'Countries', value: 94, icon: <Globe size={18} strokeWidth={2} /> },
  { label: 'Uptime', value: 99.99, suffix: '%', icon: <TrendingUp size={18} strokeWidth={2} />, decimals: 2 },
];

const techStack = ['React 19', 'Firebase', 'Framer Motion', 'Vite', 'Clean UI', 'Real-time Sync'];

const Landing = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('features');
  const items = activeTab === 'features' ? features : steps;

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Navbar */}
      <nav style={{
        padding: '1.5rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 40,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--radius)',
            background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '1.2rem',
            border: '1px solid var(--border)',
          }}>N</div>
          <span style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-display)', color: 'var(--text-heading)' }}>
            NexusChat
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
            Get Started <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, position: 'relative', zIndex: 1, padding: '5rem 3rem 7rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Hero */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'left' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="badge badge-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem', padding: '6px 14px', fontSize: '0.78rem' }}
            >
              <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              Clean messaging, rebuilt
            </motion.div>

            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
              <AnimatedGradientText text="Messaging, rebuilt." />
            </h1>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-body)', lineHeight: 1.7, maxWidth: 460, marginBottom: '2rem' }}>
              A clean, fast messaging app. No clutter, no distractions — just
              conversations that work.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
                <MessageSquare size={18} strokeWidth={2} /> Start Messaging
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
                <Smile size={18} strokeWidth={2} /> Try as Guest
              </button>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <AvatarStack avatars={['👩‍💻', '🧑‍🚀', '👩‍🎨']} size={36} gap={-8} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600 }}>
                Loved by <Counter to={12400} duration={1.5} />+ people
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div className="surface-card" style={{ padding: '2rem', borderRadius: 'var(--radius-xl)', maxWidth: 420, margin: '0 auto', border: '1px solid var(--border)' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
                paddingBottom: '1rem', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.8 }} />
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', opacity: 0.8 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', color: 'var(--text-heading)' }}>Product Team</div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                  3 online
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: 150 }}>
                {[['Hey! Just found NexusChat 🚀', false], ['This UI is really clean ✨', true], ['Right? So smooth and focused.', false], ['Loads instantly too ⚡', true]].map(([text, me], i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.4, duration: 0.4 }}
                    style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '75%', padding: '0.65rem 1rem', fontSize: '0.88rem', fontWeight: 500,
                      borderRadius: me ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                      background: me ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: me ? 'white' : 'var(--text-heading)',
                      border: me ? '1px solid var(--primary)' : '1px solid var(--border)',
                    }}
                    >
                      {text}
                    </div>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2, duration: 0.4 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <div style={{
                    padding: '0.5rem 0.85rem', borderRadius: '10px 10px 10px 2px',
                    background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                    display: 'flex', gap: 5,
                  }}>
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: d * 0.15 }}
                        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-dim)', display: 'inline-block' }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Explore features</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <ChevronDown size={16} color="var(--text-muted)" />
          </motion.div>
        </motion.div>

        {/* Stats */}
        <RevealOnScroll direction="up" style={{ marginTop: '5rem' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1rem', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            padding: '2rem 0',
          }}>
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--accent)', fontSize: '1.5rem', marginBottom: '0.4rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-heading)', marginBottom: '0.25rem' }}>
                  <Counter to={s.value} decimals={s.decimals || 0} duration={1.2} />
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        {/* Features */}
        <RevealOnScroll direction="up" style={{ marginTop: '4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Built for modern teams</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              Everything you need for clear, fast communication — nothing you don't.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: '2.5rem' }}>
            {[
              { id: 'features', label: 'Features', icon: <Zap size={16} strokeWidth={2} /> },
              { id: 'how-it-works', label: 'How It Works', icon: <Activity size={16} strokeWidth={2} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{ width: 'auto', padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-lg)' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            layout
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}
          >
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <motion.div
                  key={activeTab + item.title}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <SpotlightCard className="surface-card" style={{ padding: '1.75rem 1.5rem', borderRadius: 'var(--radius-lg)', height: '100%', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 'var(--radius)',
                      background: 'rgba(99, 102, 241, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)', marginBottom: '1rem',
                    }}
                    >
                      {item.icon}
                    </div>
                    {item.step && (
                      <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'rgba(99,102,241,0.1)', position: 'absolute', top: 16, right: 20, fontFamily: 'var(--font-display)' }}>{item.step}</span>
                    )}
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-heading)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-body)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                  </SpotlightCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </RevealOnScroll>

        {/* Tech stack */}
        <RevealOnScroll direction="up" style={{ marginTop: '5rem' }}>
          <div style={{
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            padding: '1.5rem 0', overflow: 'hidden',
          }}>
            <Marquee speed={45}>
              {techStack.map((tech, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 700,
                  letterSpacing: '0.04em', textTransform: 'uppercase', padding: '0.25rem 1rem',
                }}>
                  <Cpu size={13} color="var(--accent)" /> {tech}
                </span>
              ))}
            </Marquee>
          </div>
        </RevealOnScroll>

        {/* Footer CTA */}
        <RevealOnScroll direction="scale" style={{ marginTop: '5rem', textAlign: 'center' }}>
          <div className="surface-card" style={{ padding: '3rem 2rem', borderRadius: 'var(--radius-xl)', maxWidth: 600, margin: '0 auto', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'inline-block' }}>🚀</div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Ready to start chatting?</h2>
            <p style={{ color: 'var(--text-body)', marginBottom: '1.75rem', fontSize: '1rem', lineHeight: 1.6 }}>
              Join thousands of conversations. Free forever. No credit card required.
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              Create Free Account <ArrowRight size={18} strokeWidth={2} />
            </button>
            <div style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} strokeWidth={2} /> No credit card</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: '1rem' }}><Star size={14} strokeWidth={2} /> Simple pricing</span>
            </div>
          </div>
        </RevealOnScroll>

        <footer style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, borderTop: '1px solid var(--border)' }}>
          NexusChat · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
};

export default Landing;
