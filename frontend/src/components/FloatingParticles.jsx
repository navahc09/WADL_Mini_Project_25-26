import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(0, 100),
    y: randomBetween(0, 100),
    size: randomBetween(2, 6),
    opacity: randomBetween(0.08, 0.35),
    duration: randomBetween(18, 40),
    delay: randomBetween(0, 12),
    dx: randomBetween(-30, 30),
    dy: randomBetween(-30, 30),
  }));
}

export default function FloatingParticles({ count = 28, color = "255,255,255", className = "" }) {
  const [particles] = useState(() => generateParticles(count));

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `rgba(${color}, ${p.opacity})`,
          }}
          animate={{
            x: [0, p.dx, -p.dx * 0.5, p.dx * 0.3, 0],
            y: [0, p.dy, -p.dy * 0.5, p.dy * 0.3, 0],
            opacity: [p.opacity, p.opacity * 1.8, p.opacity * 0.4, p.opacity * 1.4, p.opacity],
            scale: [1, 1.3, 0.8, 1.1, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function FloatingOrbs({ className = "", inverted = false }) {
  const base = inverted ? "255,255,255" : "74,144,198";
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {[
        { size: 340, x: -10, y: -10, dx: 15, dy: 20, dur: 22, op: inverted ? 0.06 : 0.08 },
        { size: 260, x: 60, y: 60, dx: -18, dy: -12, dur: 28, op: inverted ? 0.05 : 0.06 },
        { size: 180, x: 80, y: 10, dx: -12, dy: 25, dur: 18, op: inverted ? 0.08 : 0.1 },
        { size: 220, x: 20, y: 80, dx: 22, dy: -15, dur: 25, op: inverted ? 0.04 : 0.05 },
      ].map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            background: `radial-gradient(circle, rgba(${base},${orb.op * 2.5}) 0%, rgba(${base},0) 70%)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, orb.dx, -orb.dx * 0.6, orb.dx * 0.4, 0],
            y: [0, orb.dy, -orb.dy * 0.6, orb.dy * 0.4, 0],
          }}
          transition={{
            duration: orb.dur,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
