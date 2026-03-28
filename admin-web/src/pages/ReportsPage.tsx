import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Search } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import { useToast } from '../components/Toast'
import { getBatches, getBatchPerformance, getBatchProfit } from '../api'
import type { Batch, BatchPerformance, BatchProfit } from '../types'
import { useEffect } from 'react'

export default function ReportsPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [batchId, setBatchId] = useState('')
  const [perf, setPerf] = useState<BatchPerformance | null>(null)
  const [profit, setProfit] = useState<BatchProfit | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { getBatches().then(setBatches) }, [])

  const handleLoad = async () => {
    if (!batchId) return
    setLoading(true); setPerf(null); setProfit(null)
    try {
      const [p, r] = await Promise.all([getBatchPerformance(batchId), getBatchProfit(batchId)])
      setPerf(p); setProfit(r)
    } catch { toast('Could not load report', 'error') }
    finally { setLoading(false) }
  }

  const radarData = perf ? [
    { metric: 'Survival %', value: perf.survival_rate_percent },
    { metric: 'FCR (inv)', value: perf.feed_conversion_ratio > 0 ? Math.max(0, 10 - perf.feed_conversion_ratio * 10) : 0 },
    { metric: 'Weight (norm)', value: Math.min(100, perf.total_net_weight_kg / 100) },
  ] : []

  const Metric = ({ label, value, unit = '', color = 'text-slate-100' }: { label: string; value: string | number; unit?: string; color?: string }) => (
    <div className="bg-slate-800/60 rounded-xl p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}<span className="text-sm font-normal text-muted ml-1">{unit}</span></p>
    </div>
  )

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Batch performance and profit analysis" />

      {/* Batch selector */}
      <AnimatedCard delay={0.1} className="p-6 mb-6" hover={false}>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm text-slate-300 mb-1">Select Batch</label>
            <select className="input-field" value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">Choose a batch to analyse…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(37,99,235,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleLoad}
            disabled={!batchId || loading}
            className="btn-primary flex items-center gap-2 h-10"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            Analyse
          </motion.button>
        </div>
      </AnimatedCard>

      {perf && profit && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Performance */}
          <AnimatedCard delay={0} className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold text-slate-200">Batch Performance</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <Metric label="Initial Chicks" value={perf.initial_chick_count.toLocaleString()} />
              <Metric label="Mortality" value={perf.total_mortality} unit="birds" color="text-red-400" />
              <Metric label="Survival Rate" value={perf.survival_rate_percent.toFixed(1)} unit="%" color="text-green-400" />
              <Metric label="Feed Conversion Ratio" value={perf.feed_conversion_ratio.toFixed(2)} />
              <Metric label="Total Feed" value={perf.total_feed_consumed_kg.toFixed(1)} unit="kg" />
              <Metric label="Total Net Weight" value={perf.total_net_weight_kg.toFixed(1)} unit="kg" color="text-blue-400" />
            </div>
            {radarData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </AnimatedCard>

          {/* Profit */}
          <AnimatedCard delay={0.1} className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="font-semibold text-slate-200">Profit Summary</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-green-950/50 border border-green-500/20 rounded-2xl p-6 text-center">
                <p className="text-sm text-muted mb-2">Net Profit</p>
                <motion.p
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-4xl font-bold ${profit.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  ₹{profit.net_profit.toLocaleString()}
                </motion.p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Total Revenue" value={`₹${profit.total_revenue.toLocaleString()}`} color="text-green-400" />
                <Metric label="Total Costs" value={`₹${profit.total_costs.toLocaleString()}`} color="text-red-400" />
                <Metric label="Chick Cost" value={`₹${profit.chick_procurement_cost.toLocaleString()}`} />
                <Metric label="Feed Cost" value={`₹${profit.feed_cost.toLocaleString()}`} />
                <Metric label="Medicine Cost" value={`₹${profit.medicine_cost.toLocaleString()}`} />
                <Metric label="Transport Cost" value={`₹${profit.transport_cost.toLocaleString()}`} />
              </div>
            </div>
          </AnimatedCard>
        </div>
      )}
    </div>
  )
}
