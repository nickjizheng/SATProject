import { motion } from 'motion/react';

const particles = [
  { x: -150, y: -120, rotate: -90, color: '#f59e0b' },
  { x: -105, y: -165, rotate: 80, color: '#14b8a6' },
  { x: -55, y: -135, rotate: 150, color: '#e96b4d' },
  { x: 0, y: -180, rotate: 220, color: '#f4d35e' },
  { x: 58, y: -145, rotate: 120, color: '#2a9d8f' },
  { x: 110, y: -165, rotate: 260, color: '#e76f51' },
  { x: 155, y: -115, rotate: 330, color: '#84a59d' },
  { x: -125, y: -65, rotate: 190, color: '#43aa8b' },
  { x: 130, y: -55, rotate: 70, color: '#f9c74f' },
];

export default function CorrectAnswerCelebration() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <motion.div
        initial={{ opacity: 0, scale: 0.65, y: 18 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.65, 1.05, 1, 0.96], y: [18, 0, 0, -8] }}
        transition={{ duration: 1.6, times: [0, 0.18, 0.72, 1], ease: 'easeOut' }}
        className="absolute left-1/2 top-28 -translate-x-1/2 rounded-full border border-emerald-700/10 bg-[#fffdf8]/95 px-6 py-3 text-center shadow-[0_18px_55px_rgba(23,60,57,.2)] backdrop-blur"
      >
        <strong className="block text-base font-extrabold text-emerald-800">Excellent work!</strong>
        <span className="text-xs font-semibold text-stone-500">One more concept secured.</span>
      </motion.div>

      {particles.map((particle, index) => (
        <motion.span
          key={`${particle.x}-${particle.y}`}
          initial={{ opacity: 0, x: 0, y: 20, rotate: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 1, 0], x: particle.x, y: particle.y, rotate: particle.rotate, scale: [0.4, 1, 0.9] }}
          transition={{ duration: 1.25, delay: index * 0.025, ease: [0.2, 0.8, 0.2, 1] }}
          className="absolute left-1/2 top-52 h-3 w-2 rounded-sm"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  );
}
