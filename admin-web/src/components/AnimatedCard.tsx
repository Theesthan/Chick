import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  delay?: number
  hover?: boolean
  onClick?: () => void
}

export default function AnimatedCard({ children, className = '', delay = 0, hover = true, onClick }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={hover ? {
        y: -2,
        boxShadow: '0 0 30px rgba(37,99,235,0.2)',
        borderColor: 'rgba(37,99,235,0.4)',
      } : undefined}
      onClick={onClick}
      className={`bg-surface border border-border rounded-2xl transition-colors duration-200 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  )
}
