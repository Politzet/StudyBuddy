import { motion } from 'framer-motion'

const SPARKLE_PARTICLES = [
  { x: -42, y: -26, delay: 0, color: '#f2c35b' },
  { x: -22, y: -40, delay: 0.03, color: '#e7ad3e' },
  { x: 0, y: -44, delay: 0.05, color: '#f5d27a' },
  { x: 24, y: -38, delay: 0.08, color: '#efbc52' },
  { x: 42, y: -22, delay: 0.1, color: '#d79b31' },
  { x: 46, y: 0, delay: 0.12, color: '#f3c86c' },
  { x: 38, y: 24, delay: 0.15, color: '#e5aa40' },
  { x: 20, y: 40, delay: 0.18, color: '#f5d486' },
  { x: 0, y: 46, delay: 0.2, color: '#eeb84f' },
  { x: -22, y: 38, delay: 0.22, color: '#dca137' },
  { x: -40, y: 22, delay: 0.24, color: '#f4ca74' },
  { x: -46, y: 0, delay: 0.27, color: '#e8af47' },
]

function CreationSparkle() {
  const MotionDiv = motion.div
  const MotionSpan = motion.span
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      <MotionDiv
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.45, 0], scale: [0.4, 1.06, 1.25] }}
        transition={{ duration: 0.95, ease: 'easeOut' }}
        className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#e7ba58]/70 bg-[#f5d37a]/20"
      />
      {SPARKLE_PARTICLES.map((particle, index) => (
        <MotionSpan
          key={`${particle.x}-${particle.y}-${index}`}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0.15, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, particle.x],
            y: [0, particle.y],
            scale: [0.15, 1, 0.25],
            rotate: [0, 120],
          }}
          transition={{
            duration: 0.95,
            delay: particle.delay,
            ease: 'easeOut',
          }}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: particle.color }}
        />
      ))}
    </div>
  )
}

export default CreationSparkle
