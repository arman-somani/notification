import React, { useState, useContext } from 'react';
import { X, RotateCcw, Palette, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeContext, FONT_OPTIONS, WALLPAPER_OPTIONS, PRESETS } from '../context/ThemeContext';

const ColorPicker = ({ label, value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)' }}>{label}</span>
    <div style={{ position: 'relative' }}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 34, height: 34, border: 'none', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', background: 'transparent', padding: 0,
        }}
      />
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)', pointerEvents: 'none',
      }} />
    </div>
  </div>
);

const Slider = ({ label, value, onChange, min = 0, max = 30, suffix = 'px', displayValue }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)' }}>{label}</span>
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
        {displayValue || `${value}${suffix}`}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={suffix === 'x' ? 0.1 : 1}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: '100%', height: 5, borderRadius: 3,
        appearance: 'none', background: `linear-gradient(to right, var(--primary) ${((value - min) / (max - min)) * 100}%, rgba(99,102,241,0.15) ${((value - min) / (max - min)) * 100}%)`,
        outline: 'none', cursor: 'pointer',
      }}
    />
  </div>
);

const Section = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-heading)', fontFamily: 'var(--font-sans)',
          fontWeight: 700, fontSize: '0.9rem', padding: '0.5rem 0',
        }}
      >
        {title}
        {isOpen ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
      </button>
      {isOpen && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.5rem' }}>{children}</div>}
    </div>
  );
};

const ThemeCustomizer = ({ isOpen, onClose }) => {
  const { theme, setTheme, resetTheme } = useContext(ThemeContext);

  if (!isOpen) return null;

  const update = (key, value) => {
    setTheme({ ...theme, [key]: value });
  };

  const intensityLabel = (v) => {
    if (v === 0) return 'Off';
    if (v <= 0.5) return 'Subtle';
    if (v <= 1) return 'Normal';
    if (v <= 1.5) return 'High';
    return 'Intense';
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.2)',
        }}
      />

      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '330px', maxWidth: '90vw',
          zIndex: 9999,
          background: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'none',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Palette size={18} color="white" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)' }}>Theme</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>Customize appearance</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-body)', transition: 'all 0.15s',
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <Section title="Presets" defaultOpen={true}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {Object.entries(PRESETS).map(([key, preset]) => {
                const isActive = theme.name === preset.name;
                return (
                  <button
                    key={key}
                    onClick={() => setTheme(preset)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      background: isActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-heading)', fontSize: '0.8rem', fontWeight: 700,
                      position: 'relative',
                    }}
                  >
                    <span style={{ fontSize: '1rem' }}>{preset.emoji}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{preset.name}</span>
                    {isActive && <Check size={14} color="var(--primary)" strokeWidth={2} />}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section title="Colors" defaultOpen={true}>
            <ColorPicker label="Background" value={theme.background} onChange={(v) => update('background', v)} />
            <ColorPicker label="Primary" value={theme.primary} onChange={(v) => update('primary', v)} />
            <ColorPicker label="Secondary" value={theme.secondary} onChange={(v) => update('secondary', v)} />
            <ColorPicker label="Text" value={theme.textColor} onChange={(v) => update('textColor', v)} />
          </Section>

          <Section title="Typography" defaultOpen={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-body)' }}>Font</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => update('font', f.value)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.55rem 0.75rem',
                      background: theme.font === f.value ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      border: theme.font === f.value ? '1px solid var(--primary)' : '1px solid transparent',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontFamily: f.value,
                      color: 'var(--text-heading)', fontSize: '0.88rem', fontWeight: 600,
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                    {theme.font === f.value && <Check size={14} color="var(--primary)" strokeWidth={2} />}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Shape & Motion" defaultOpen={false}>
            <Slider label="Border Radius" value={theme.borderRadius} onChange={(v) => update('borderRadius', v)} min={0} max={24} suffix="px" />
            <Slider
              label="Animation Speed"
              value={theme.animationIntensity}
              onChange={(v) => update('animationIntensity', v)}
              min={0} max={2} suffix="x"
              displayValue={intensityLabel(theme.animationIntensity)}
            />
          </Section>

          <Section title="Wallpaper" defaultOpen={false}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
              {WALLPAPER_OPTIONS.map((wp) => {
                const isActive = theme.wallpaper === wp.value;
                return (
                  <button
                    key={wp.value}
                    onClick={() => update('wallpaper', wp.value)}
                    style={{
                      padding: '0.5rem',
                      background: isActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                      border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer', fontFamily: 'var(--font-sans)',
                      color: 'var(--text-heading)', fontSize: '0.8rem', fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >
                    {wp.label}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <button
            onClick={resetTheme}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              width: '100%', padding: '0.75rem',
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer', fontFamily: 'var(--font-sans)',
              color: 'var(--text-body)', fontSize: '0.85rem', fontWeight: 700,
              transition: 'all 0.15s',
            }}
          >
            <RotateCcw size={14} strokeWidth={2} />
            Reset to default
          </button>
        </div>
      </div>
    </>
  );
};

export default ThemeCustomizer;
