import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView, animate } from 'motion/react';

/* ============================================================
   RevealOnScroll — subtle fade-up on enter
   ============================================================ */
export const RevealOnScroll = ({ children, delay = 0, direction = 'up', className, style }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  const variants = {
    up: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.96 }, show: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      ref={ref} className={className} style={style}
      variants={variants[direction]}
      initial="hidden" animate={isInView ? 'show' : 'hidden'}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
};

/* ============================================================
   Stagger helpers
   ============================================================ */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
export const staggerItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

/* ============================================================
   AnimatedGradientText — restrained letter reveal
   ============================================================ */
export const AnimatedGradientText = ({ text, style }) => {
  const words = text.split(' ');
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        display: 'inline-flex', flexWrap: 'wrap', gap: '0 0.2em',
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        ...style,
      }}
    >
      {words.map((w, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03, duration: 0.3 }}
        >
          {w}
        </motion.span>
      ))}
    </motion.span>
  );
};

/* ============================================================
   Counter — animated number on view
   ============================================================ */
export const Counter = ({ to, from = 0, duration = 1.2, decimals = 0, suffix = '' }) => {
  const [val, setVal] = useState(from);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    const controls = animate(from, to, {
      duration, ease: [0.4, 0, 0.2, 1], onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [to, from, duration, isInView]);
  return <span ref={ref}>{val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

/* ============================================================
   TypingDots — subtle, chat only
   ============================================================ */
export const TypingDots = ({ color = 'currentColor', size = 6 }) => (
  <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'inline-block' }}
      />
    ))}
  </span>
);

/* ============================================================
   AvatarStack — small avatar pile
   ============================================================ */
export const AvatarStack = ({ avatars, size = 40, gap = -10 }) => (
  <div style={{ display: 'flex' }}>
    {avatars.map((em, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 + i * 0.06, duration: 0.3 }}
        whileHover={{ y: -4, scale: 1.1 }}
        style={{
          width: size, height: size, borderRadius: '50%', fontSize: size * 0.3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          marginLeft: i > 0 ? gap : 0, cursor: 'default', position: 'relative', zIndex: i,
        }}
      >{em}</motion.div>
    ))}
  </div>
);

/* ============================================================
   SpotlightCard — flat card, subtle lift
   ============================================================ */
export const SpotlightCard = ({ children, style, className, ...rest }) => (
  <motion.div
    className={className}
    whileHover={{ y: -2 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    style={{ ...style }}
    {...rest}
  >
    {children}
  </motion.div>
);

/* ============================================================
   Marquee — simple horizontal scroll
   ============================================================ */
export const Marquee = ({ children, speed = 40, direction = 'left' }) => (
  <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
    <motion.div
      animate={{ x: direction === 'left' ? [0, -1400] : [-1400, 0] }}
      transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      style={{ display: 'flex', gap: '2.5rem', whiteSpace: 'nowrap', width: 'fit-content' }}
    >
      {children}
      {children}
    </motion.div>
  </div>
);

/* ============================================================
   AnimatedIcon — subtle hover scale
   ============================================================ */
export const AnimatedIcon = ({ children, style }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
    style={{ display: 'inline-flex', ...style }}
  >
    {children}
  </motion.div>
);
