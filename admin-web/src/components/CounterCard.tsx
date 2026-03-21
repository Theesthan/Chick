import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'

interface CounterCardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  iconColor?: string
  delay?: number
  decimals?: number
}

function useCountUp(target: number, duration = 1200, decimals = 0) {
  const [count, setCount] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, decimals])

  return count
}

export default function CounterCard({
  label, value, prefix = '', suffix = '', icon: Icon,
  iconColor = 'text-blue-400', delay = 0, decimals = 0,
}: CounterCardProps) {
  const count = useCountUp(value, 1200, decimals)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -3, boxShadow: '0 0 30px rgba(37,99,235,0.2)' }}
      className="bg-surface border border-border rounded-2xl p-6 transition-all duration-200"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-100 tabular-nums">
            {prefix}{decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString()}{suffix}
          </p>
        </div>
        <div className={`p-3 rounded-xl bg-slate-800 ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}
