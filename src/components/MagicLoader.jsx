import { motion } from 'framer-motion'

const ORBITS = [40, 56, 72]
const BURST_PARTICLES = Array.from({ length: 44 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 44
  const distance = 120 + (index % 6) * 24
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    delay: (index % 8) * 0.015,
    color: index % 3 === 0 ? '#f5d27a' : index % 3 === 1 ? '#e6ad3f' : '#cf8f2c',
  }
})

function Sigil({ burst = false }) {
  const MotionSvg = motion.svg
  return (
    <MotionSvg
      width="170"
      height="170"
      viewBox="0 0 120 120"
      className="drop-shadow-[0_0_16px_rgba(232,179,84,0.55)]"
      initial={burst ? { scale: 0.9, opacity: 1 } : { scale: 1, opacity: 1 }}
      animate={
        burst
          ? {
              scale: [1, 1.35, 1.65],
              opacity: [1, 0.85, 0],
              rotate: [0, 12],
            }
          : {
              scale: [1, 1.03, 1],
              opacity: [0.85, 1, 0.85],
              rotate: [0, -2, 0],
            }
      }
      transition={burst ? { duration: 0.72, ease: 'easeOut' } : { repeat: Infinity, duration: 2.4 }}
    >
      <path d="M60 10L101 95H19L60 10Z" stroke="#d8a84a" strokeWidth="3.4" fill="none" />
      <circle cx="60" cy="60" r="20" stroke="#f2cf7a" strokeWidth="2.6" fill="none" />
      <path d="M44 76L60 44L76 76" stroke="#e9bb5a" strokeWidth="3" fill="none" />
      <path d="M47 54H73" stroke="#e7b14f" strokeWidth="2.4" />
    </MotionSvg>
  )
}

function OrbitingSparkles() {
  const MotionDiv = motion.div
  const MotionSpan = motion.span
  return (
    <>
      {ORBITS.map((radius, idx) => (
        <MotionDiv
          key={radius}
          className="absolute left-1/2 top-1/2"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 3.8 + idx * 1.1, ease: 'linear' }}
        >
          <MotionSpan
            className="absolute h-2 w-2 rounded-full bg-[#f5cf7b]"
            style={{ left: radius, top: -2 }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.2, 0.7] }}
            transition={{ repeat: Infinity, duration: 1.2 + idx * 0.3 }}
          />
        </MotionDiv>
      ))}
    </>
  )
}

function FairydustBurst() {
  const MotionSpan = motion.span
  return (
    <div className="pointer-events-none absolute inset-0">
      {BURST_PARTICLES.map((particle, index) => (
        <MotionSpan
          key={`${particle.x}-${particle.y}-${index}`}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
          style={{ backgroundColor: particle.color }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.2 }}
          animate={{ x: particle.x, y: particle.y, opacity: [0, 1, 0], scale: [0.2, 1.2, 0.2] }}
          transition={{ duration: 0.95, delay: particle.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

function MagicLoader({ burst = false }) {
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <Sigil burst={burst} />
      {!burst ? <OrbitingSparkles /> : <FairydustBurst />}
    </div>
  )
}

export default MagicLoader
