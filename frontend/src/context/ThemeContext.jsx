import React, { createContext, useState, useEffect, useCallback } from 'react';

export const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'nexuschat-theme';

export const FONT_OPTIONS = [
  { label: 'Inter', value: "'Inter', sans-serif", import: 'Inter:wght@300;400;500;600;700;800;900' },
  { label: 'Outfit', value: "'Outfit', sans-serif", import: 'Outfit:wght@300;400;500;600;700;800;900' },
  { label: 'Nunito', value: "'Nunito', sans-serif", import: 'Nunito:wght@400;500;600;700;800;900' },
  { label: 'Poppins', value: "'Poppins', sans-serif", import: 'Poppins:wght@300;400;500;600;700;800;900' },
  { label: 'JetBrains Mono', value: "'JetBrains Mono', monospace", import: 'JetBrains+Mono:wght@400;500;600;700;800' },
  { label: 'Fira Code', value: "'Fira Code', monospace", import: 'Fira+Code:wght@400;500;600;700' },
];

export const WALLPAPER_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Dots', value: 'dots' },
  { label: 'Grid', value: 'grid' },
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Waves', value: 'waves' },
  { label: 'Circles', value: 'circles' },
];

export const PRESETS = {
  midnight_purple: {
    name: 'Midnight Purple',
    emoji: '🟣',
    background: '#0a0a1a',
    primary: '#a855f7',
    secondary: '#6366f1',
    bubbleSent: '#7c3aed',
    textColor: '#e2e8f0',
    accent: '#c084fc',
    borderRadius: 16,
    font: "'Inter', sans-serif",
    wallpaper: 'none',
    wallpaperColor: '#a855f720',
    animationIntensity: 1,
  },
  ocean_blue: {
    name: 'Ocean Blue',
    emoji: '🔵',
    background: '#0c1222',
    primary: '#3b82f6',
    secondary: '#06b6d4',
    bubbleSent: '#2563eb',
    textColor: '#e0f2fe',
    accent: '#38bdf8',
    borderRadius: 20,
    font: "'Inter', sans-serif",
    wallpaper: 'waves',
    wallpaperColor: '#3b82f615',
    animationIntensity: 1,
  },
  rose_gold: {
    name: 'Rose Gold',
    emoji: '🌹',
    background: '#1a0a14',
    primary: '#f472b6',
    secondary: '#fb923c',
    bubbleSent: '#e11d48',
    textColor: '#fce7f3',
    accent: '#f9a8d4',
    borderRadius: 24,
    font: "'Poppins', sans-serif",
    wallpaper: 'dots',
    wallpaperColor: '#f472b612',
    animationIntensity: 1.2,
  },
  emerald_night: {
    name: 'Emerald Night',
    emoji: '🟢',
    background: '#0a1a14',
    primary: '#10b981',
    secondary: '#14b8a6',
    bubbleSent: '#059669',
    textColor: '#d1fae5',
    accent: '#34d399',
    borderRadius: 14,
    font: "'Outfit', sans-serif",
    wallpaper: 'grid',
    wallpaperColor: '#10b98112',
    animationIntensity: 0.8,
  },
  sunset_blaze: {
    name: 'Sunset Blaze',
    emoji: '🟠',
    background: '#1a0f0a',
    primary: '#f59e0b',
    secondary: '#ef4444',
    bubbleSent: '#d97706',
    textColor: '#fef3c7',
    accent: '#fbbf24',
    borderRadius: 18,
    font: "'Nunito', sans-serif",
    wallpaper: 'diagonal',
    wallpaperColor: '#f59e0b15',
    animationIntensity: 1.5,
  },
};

const DEFAULT_THEME = { ...PRESETS.midnight_purple };

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

function lighten(hex, amount = 30) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0x00ff) + amount);
  const b = Math.min(255, (num & 0x0000ff) + amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function darken(hex, amount = 30) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0x00ff) - amount);
  const b = Math.max(0, (num & 0x0000ff) - amount);
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

function getWallpaperCSS(pattern, color) {
  switch (pattern) {
    case 'dots':
      return `radial-gradient(circle, ${color} 1px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    case 'diagonal':
      return `repeating-linear-gradient(45deg, transparent, transparent 10px, ${color} 10px, ${color} 11px)`;
    case 'waves':
      return `radial-gradient(ellipse at 50% 0%, ${color} 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, ${color} 0%, transparent 60%)`;
    case 'circles':
      return `radial-gradient(circle at 25% 25%, ${color} 0%, transparent 50%), radial-gradient(circle at 75% 75%, ${color} 0%, transparent 50%)`;
    default:
      return 'none';
  }
}

function getWallpaperSize(pattern) {
  switch (pattern) {
    case 'dots': return '24px 24px';
    case 'grid': return '32px 32px';
    case 'diagonal': return '20px 20px';
    case 'waves': return '100% 200px';
    case 'circles': return '100px 100px';
    default: return 'auto';
  }
}

export function applyTheme(theme) {
  const root = document.documentElement;
  const t = { ...DEFAULT_THEME, ...theme };

  root.style.setProperty('--bg', t.background);
  root.style.setProperty('--bg-rgb', hexToRgb(t.background));
  root.style.setProperty('--bg-secondary', lighten(t.background, 12));
  root.style.setProperty('--bg-tertiary', lighten(t.background, 24));

  root.style.setProperty('--primary', t.primary);
  root.style.setProperty('--primary-rgb', hexToRgb(t.primary));
  root.style.setProperty('--primary-light', lighten(t.primary, 40));
  root.style.setProperty('--primary-dark', darken(t.primary, 40));

  root.style.setProperty('--secondary', t.secondary);
  root.style.setProperty('--secondary-rgb', hexToRgb(t.secondary));

  root.style.setProperty('--accent', t.accent);
  root.style.setProperty('--accent-rgb', hexToRgb(t.accent));

  root.style.setProperty('--bubble-sent', t.bubbleSent);
  root.style.setProperty('--bubble-sent-rgb', hexToRgb(t.bubbleSent));
  root.style.setProperty('--bubble-received', lighten(t.background, 20));
  root.style.setProperty('--bubble-received-rgb', hexToRgb(lighten(t.background, 20)));

  root.style.setProperty('--text-primary', t.textColor);
  root.style.setProperty('--text-secondary', darken(t.textColor, 60));
  root.style.setProperty('--text-muted', darken(t.textColor, 100));

  root.style.setProperty('--glow-color', `${t.primary}40`);
  root.style.setProperty('--glow-strong', `${t.primary}70`);

  root.style.setProperty('--border-radius', `${t.borderRadius}px`);
  root.style.setProperty('--border-radius-sm', `${Math.max(6, t.borderRadius - 8)}px`);
  root.style.setProperty('--border-radius-lg', `${t.borderRadius + 8}px`);
  root.style.setProperty('--border-radius-xl', `${t.borderRadius + 16}px`);

  root.style.setProperty('--font-family', t.font);

  root.style.setProperty('--animation-speed', `${t.animationIntensity}`);
  root.style.setProperty('--animation-duration', `${0.4 / Math.max(0.1, t.animationIntensity)}s`);

  root.style.setProperty('--glass-bg', `rgba(${hexToRgb(t.background)}, 0.4)`);
  root.style.setProperty('--glass-bg-light', `rgba(${hexToRgb(t.background)}, 0.2)`);
  root.style.setProperty('--glass-border', `rgba(${hexToRgb(t.textColor)}, 0.08)`);
  root.style.setProperty('--glass-border-hover', `rgba(${hexToRgb(t.primary)}, 0.3)`);

  // Wallpaper
  const wpCSS = getWallpaperCSS(t.wallpaper, t.wallpaperColor || `${t.primary}15`);
  const wpSize = getWallpaperSize(t.wallpaper);
  root.style.setProperty('--wallpaper-bg', wpCSS);
  root.style.setProperty('--wallpaper-size', wpSize);

  // Danger / Success
  root.style.setProperty('--danger', '#ef4444');
  root.style.setProperty('--success', '#22c55e');

  // Load font
  const fontOption = FONT_OPTIONS.find(f => f.value === t.font);
  if (fontOption) {
    const linkId = 'theme-font-link';
    let link = document.getElementById(linkId);
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = `https://fonts.googleapis.com/css2?family=${fontOption.import}&display=swap`;
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const setTheme = useCallback((newTheme) => {
    const merged = { ...DEFAULT_THEME, ...newTheme };
    setThemeState(merged);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(merged));
    applyTheme(merged);
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, [setTheme]);

  // Apply on mount
  useEffect(() => {
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, presets: PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
};
