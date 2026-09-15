import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Zap, Shield, Globe } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Navbar */}
      <nav className="landing-nav" style={{
        padding: '1.5rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
            boxShadow: '0 4px 15px var(--accent-glow)' 
          }}>
            N
          </div>
          <span className="text-gradient" style={{ fontWeight: '800', fontSize: '1.5rem' }}>NexusChat</span>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="glass-item"
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 2rem',
        zIndex: 10
      }}>
        <div className="glass-panel landing-hero" style={{
          padding: '4rem',
          borderRadius: '32px',
          maxWidth: '800px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
          background: 'rgba(15, 15, 20, 0.4)',
          backdropFilter: 'blur(24px)'
        }}>
          <h1 className="landing-h1" style={{ 
            fontSize: '4rem', 
            fontWeight: '800', 
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Connect instantly.<br/>
            <span className="text-gradient">Chat endlessly.</span>
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-secondary)', 
            maxWidth: '600px', 
            margin: '0 auto 3rem',
            lineHeight: '1.6'
          }}>
            Experience the next generation of real-time messaging. Beautifully crafted, blazingly fast, and completely secure.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/login')}
              style={{
                padding: '1rem 2.5rem',
                borderRadius: '30px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                color: 'white',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 10px 30px var(--accent-glow)',
                transition: 'transform 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* Feature grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2rem', 
          maxWidth: '1000px', 
          marginTop: '4rem',
          width: '100%' 
        }}>
          {[
            { icon: <Zap size={24} color="var(--accent-primary)" />, title: "Lightning Fast", desc: "Real-time socket connections" },
            { icon: <Shield size={24} color="var(--success)" />, title: "Secure", desc: "End-to-end privacy focused" },
            { icon: <Globe size={24} color="#3b82f6" />, title: "Global", desc: "Connect from anywhere" }
          ].map((feature, i) => (
            <div key={i} className="glass-item" style={{
              padding: '2rem',
              borderRadius: '24px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}>
                {feature.icon}
              </div>
              <h3 style={{ margin: 0, color: 'white' }}>{feature.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Landing;
