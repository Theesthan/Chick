import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getDailyReports, verifyReport } from '../api'
import { useAuthStore } from '../store/authStore'
import type { DailyReport, ReportStatus } from '../types'

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  verified: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function DailyReportsPage() {
  const { toast } = useToast()
  const user = useAuthStore(s => s.user)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DailyReport | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => getDailyReports().then(setReports).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleVerify = async (status: ReportStatus) => {
    if (!selected) return
    setSaving(true)
    try {
      await verifyReport(selected.id, status, status === 'rejected' ? rejectionReason : undefined)
      toast(`Report ${status}`, 'success')
      setSelected(null); setRejectionReason(''); load()
    } catch { toast('Failed', 'error') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Daily Reports" subtitle={`${reports.filter(r => r.status === 'pending').length} pending verification`} />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={5} cols={6} /></div> : (
          <DataTable
            data={reports}
            columns={[
              { key: 'report_date', label: 'Date' },
              { key: 'batch_id', label: 'Batch', render: r => r.batch_id.slice(0, 8) + '…' },
              { key: 'mortality', label: 'Mortality', render: r => r.mortality.toString() },
              { key: 'feed_consumed', label: 'Feed (kg)', render: r => r.feed_consumed + ' kg' },
              {
                key: 'gps_valid', label: 'GPS',
                render: r => (
                  <span className={`badge flex items-center gap-1 w-fit ${r.gps_valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    <MapPin className="w-3 h-3" /> {r.gps_valid ? 'Valid' : 'Invalid'}
                  </span>
                ),
              },
              { key: 'status', label: 'Status', render: r => <span className={`badge border ${STATUS_COLORS[r.status]}`}>{r.status}</span> },
              ...(user?.role === 'admin' ? [{
                key: 'actions', label: '',
                render: (row: DailyReport) => row.status === 'pending' ? (
                  <button onClick={() => setSelected(row)} className="text-xs text-primary hover:underline">Review</button>
                ) : null,
              }] : []),
            ]}
          />
        )}
      </AnimatedCard>

      {/* Review Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setRejectionReason('') }} title="Review Report" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Date</span><span>{selected.report_date}</span></div>
              <div className="flex justify-between"><span className="text-muted">Mortality</span><span>{selected.mortality} birds</span></div>
              <div className="flex justify-between"><span className="text-muted">Feed Consumed</span><span>{selected.feed_consumed} kg</span></div>
              <div className="flex justify-between"><span className="text-muted">GPS Valid</span>
                <span className={selected.gps_valid ? 'text-green-400' : 'text-red-400'}>{selected.gps_valid ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Rejection Reason (if rejecting)</label>
              <textarea className="input-field resize-none" rows={2} placeholder="Reason for rejection…"
                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} disabled={saving}
                onClick={() => handleVerify('rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-medium">
                <XCircle className="w-4 h-4" /> Reject
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} disabled={saving}
                onClick={() => handleVerify('verified')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Verify
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
