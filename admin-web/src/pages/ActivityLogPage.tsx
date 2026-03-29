import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Copy, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getActivityLogs, getDailySummary } from '../api'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import type { ActivityLog } from '../types'

const ACTION_COLORS: Record<string, string> = {
  submit_daily_report: 'bg-blue-500/20 text-blue-400',
  verify_report: 'bg-green-500/20 text-green-400',
  create_transport: 'bg-purple-500/20 text-purple-400',
  record_arrival: 'bg-teal-500/20 text-teal-400',
  create_procurement: 'bg-amber-500/20 text-amber-400',
  record_processing: 'bg-orange-500/20 text-orange-400',
  default: 'bg-slate-500/20 text-slate-400',
}

export default function ActivityLogPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = () => Promise.all([
    getActivityLogs(0, 200).then(setLogs),
    getDailySummary().then(r => setSummary(r.summary)),
  ]).finally(() => setLoading(false))

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(load)

  const copySummary = async () => {
    if (!summary) return
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    toast('Summary copied — paste into WhatsApp', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <PageHeader title="Activity Logs" subtitle="All actions performed across the system" />

      {/* WhatsApp daily summary */}
      <AnimatedCard delay={0.05} hover={false} className="p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-slate-200 text-sm">Today's WhatsApp Summary</h2>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={copySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-medium hover:bg-green-500/25 transition-colors">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy for WhatsApp'}
          </motion.button>
        </div>
        {loading ? (
          <div className="h-16 shimmer rounded-lg" />
        ) : (
          <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-800/60 rounded-lg p-3 max-h-40 overflow-y-auto">
            {summary ?? 'No activity today'}
          </pre>
        )}
      </AnimatedCard>

      {/* Log table */}
      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={8} cols={5} /></div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted text-sm">No activity logs yet</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log, i) => (
              <motion.div key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-start gap-4 px-5 py-3 hover:bg-slate-800/40 transition-colors">
                <span className={`badge text-xs mt-0.5 whitespace-nowrap ${ACTION_COLORS[log.action] ?? ACTION_COLORS.default}`}>
                  {log.action.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{log.detail ?? '—'}</p>
                  {log.entity && (
                    <p className="text-xs text-muted mt-0.5">{log.entity} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}` : ''}</p>
                  )}
                </div>
                <span className="text-xs text-muted whitespace-nowrap flex-shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatedCard>
    </div>
  )
}
