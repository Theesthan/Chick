import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Package, Bird, TrendingUp, Activity, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import CounterCard from '../components/CounterCard'
import AnimatedCard from '../components/AnimatedCard'
import { CardSkeleton } from '../components/SkeletonLoader'
import { getFarms, getBatches, getSales, getDailyReports } from '../api'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import type { Farm, Batch, Sale, DailyReport } from '../types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  harvested: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function DashboardPage() {
  const [farms, setFarms] = useState<Farm[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => Promise.all([getFarms(), getBatches(), getSales(), getDailyReports()])
    .then(([f, b, s, r]) => { setFarms(f); setBatches(b); setSales(s); setReports(r) })
    .finally(() => setLoading(false))

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(load)

  const totalRevenue = sales.reduce((s, x) => s + x.total_amount, 0)
  const activeBatches = batches.filter(b => b.status === 'active').length
  const totalChicks = batches.reduce((s, b) => s + b.chick_count, 0)
  const pendingReports = reports.filter(r => r.status === 'pending').length

  // Build sales chart data (last 7 sales)
  const chartData = [...sales].reverse().slice(-10).map(s => ({
    date: new Date(s.sold_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    revenue: s.total_amount,
  }))

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Farm to processing overview</p>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <CounterCard label="Total Farms" value={farms.length} icon={MapPin} iconColor="text-blue-400" delay={0} />
          <CounterCard label="Active Batches" value={activeBatches} icon={Package} iconColor="text-green-400" delay={0.08} />
          <CounterCard label="Total Chicks" value={totalChicks} icon={Bird} iconColor="text-yellow-400" delay={0.16} />
          <CounterCard label="Total Revenue" value={totalRevenue} prefix="₹" icon={TrendingUp} iconColor="text-purple-400" delay={0.24} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <AnimatedCard delay={0.3} className="xl:col-span-2 p-6">
          <h2 className="text-base font-semibold text-slate-200 mb-4">Revenue Trend</h2>
          {loading ? (
            <div className="h-48 shimmer rounded-xl" />
          ) : chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted text-sm">No sales data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#60a5fa' }}
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5}
                  dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </AnimatedCard>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Pending Alerts */}
          <AnimatedCard delay={0.35} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-slate-200">Pending Actions</h3>
            </div>
            <div className="space-y-2">
              {pendingReports > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Unverified reports</span>
                  <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">{pendingReports}</span>
                </div>
              )}
              {pendingReports === 0 && !loading && (
                <p className="text-sm text-muted">All clear! No pending actions.</p>
              )}
            </div>
          </AnimatedCard>

          {/* Recent Batches */}
          <AnimatedCard delay={0.4} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-slate-200">Recent Batches</h3>
            </div>
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 shimmer rounded" />)}</div>
            ) : (
              <div className="space-y-2">
                {batches.slice(0, 5).map(b => (
                  <div key={b.id} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300 font-medium">{b.batch_code}</span>
                    <span className={`badge border ${STATUS_COLORS[b.status]}`}>{b.status}</span>
                  </div>
                ))}
                {batches.length === 0 && <p className="text-sm text-muted">No batches yet</p>}
              </div>
            )}
          </AnimatedCard>
        </div>
      </div>
    </div>
  )
}
