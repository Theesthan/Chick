import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, MapPin, Plus, LocateFixed, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getDailyReports, verifyReport, createDailyReport, getBatches, getFarms } from '../api'
import { useAuthStore } from '../store/authStore'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import type { DailyReport, ReportStatus, Batch, Farm } from '../types'

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
  verified: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

export default function DailyReportsPage() {
  const { toast } = useToast()
  const user = useAuthStore(s => s.user)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DailyReport | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [proximity, setProximity] = useState<{ ok: boolean; distance: number } | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    batch_id: '', report_date: todayStr(), mortality: '0',
    feed_consumed: '', gps_lat: '', gps_lng: '',
  })

  const load = () => Promise.all([
    getDailyReports().then(setReports),
    getBatches().then(setBatches),
    getFarms().then(setFarms),
  ]).finally(() => setLoading(false))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(load)

  const CF = (k: keyof typeof createForm, v: string) => setCreateForm(p => ({ ...p, [k]: v }))

  const checkProximity = (lat: number, lng: number, batchId: string) => {
    const batch = batches.find(b => b.id === batchId)
    if (!batch) { setProximity(null); return }
    const farm = farms.find(f => f.id === batch.farm_id)
    if (!farm) { setProximity(null); return }
    const dist = haversineMeters(lat, lng, farm.gps_lat, farm.gps_lng)
    setProximity({ ok: dist <= 200, distance: Math.round(dist) })
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { toast('GPS not supported in this browser', 'error'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        CF('gps_lat', String(lat))
        CF('gps_lng', String(lng))
        if (createForm.batch_id) checkProximity(lat, lng, createForm.batch_id)
        setLocating(false)
      },
      () => { toast('Location access denied or unavailable', 'error'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const handleBatchChange = (batchId: string) => {
    CF('batch_id', batchId)
    setProximity(null)
    const lat = Number(createForm.gps_lat)
    const lng = Number(createForm.gps_lng)
    if (batchId && lat && lng) checkProximity(lat, lng, batchId)
  }

  const handleVerify = async (status: ReportStatus) => {
    if (!selected) return
    setSaving(true)
    try {
      await verifyReport(selected.id, status, status === 'rejected' ? rejectionReason : undefined)
      toast(`Report ${status}`, 'success')
      setSelected(null); setRejectionReason(''); load()
    } catch { toast('Failed', 'error') } finally { setSaving(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const mortality = Number(createForm.mortality)
    const feed = Number(createForm.feed_consumed)
    const lat = Number(createForm.gps_lat)
    const lng = Number(createForm.gps_lng)
    if (mortality < 0) { toast('Mortality cannot be negative', 'error'); return }
    if (feed <= 0) { toast('Feed consumed must be positive', 'error'); return }
    if (!lat || !lng) { toast('GPS location is required — use "Detect Location"', 'error'); return }
    setSaving(true)
    try {
      await createDailyReport({ batch_id: createForm.batch_id, report_date: createForm.report_date, mortality, feed_consumed: feed, gps_lat: lat, gps_lng: lng })
      toast('Report submitted', 'success')
      setCreateOpen(false)
      setCreateForm({ batch_id: '', report_date: todayStr(), mortality: '0', feed_consumed: '', gps_lat: '', gps_lng: '' })
      setProximity(null)
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  return (
    <div>
      <PageHeader
        title="Daily Reports"
        subtitle={`${pendingCount} pending verification`}
        action={user?.role === 'supervisor' ? (
          <motion.button type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Submit Report
          </motion.button>
        ) : undefined}
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={5} cols={6} /></div> : (
          <DataTable
            data={reports}
            columns={[
              { key: 'report_date', label: 'Date' },
              { key: 'batch_id', label: 'Batch', render: r => batches.find(b => b.id === r.batch_id)?.batch_code ?? r.batch_id.slice(0, 8) + '…' },
              { key: 'mortality', label: 'Mortality', render: r => (
                <span className={r.mortality > 0 ? 'text-red-400 font-medium' : 'text-slate-400'}>
                  {r.mortality} birds
                </span>
              )},
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
                  <button type="button" onClick={() => setSelected(row)} className="text-xs text-primary hover:underline">Review</button>
                ) : null,
              }] : []),
            ]}
          />
        )}
      </AnimatedCard>

      {/* Submit Report Modal (supervisor) */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setProximity(null) }} title="Submit Daily Report">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1" htmlFor="dr-batch">Batch</label>
            <select id="dr-batch" className="input-field" value={createForm.batch_id} onChange={e => handleBatchChange(e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.filter(b => b.status === 'active').map(b => (
                <option key={b.id} value={b.id}>{b.batch_code}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1" htmlFor="dr-date">Report Date</label>
              <input id="dr-date" className="input-field" type="date" value={createForm.report_date} onChange={e => CF('report_date', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1" htmlFor="dr-mortality">Mortality (birds)</label>
              <input id="dr-mortality" className="input-field" type="number" min="0" placeholder="0" value={createForm.mortality} onChange={e => CF('mortality', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1" htmlFor="dr-feed">Feed Consumed (kg)</label>
            <input id="dr-feed" className="input-field" type="number" step="any" min="0.01" placeholder="250" value={createForm.feed_consumed} onChange={e => CF('feed_consumed', e.target.value)} required />
          </div>

          {/* GPS — auto-detect */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-slate-300">GPS Location</label>
              <button type="button" onClick={detectLocation} disabled={locating}
                className="flex items-center gap-1 text-xs text-primary hover:text-blue-300 disabled:opacity-50 transition-colors">
                <LocateFixed className="w-3 h-3" />
                {locating ? 'Detecting…' : 'Detect Location'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" type="number" step="any" placeholder="Latitude" aria-label="GPS Latitude"
                value={createForm.gps_lat} onChange={e => { CF('gps_lat', e.target.value); setProximity(null) }} required />
              <input className="input-field" type="number" step="any" placeholder="Longitude" aria-label="GPS Longitude"
                value={createForm.gps_lng} onChange={e => { CF('gps_lng', e.target.value); setProximity(null) }} required />
            </div>

            {/* Proximity feedback */}
            {proximity !== null && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                  proximity.ok
                    ? 'bg-green-950/50 border-green-500/30 text-green-400'
                    : 'bg-amber-950/50 border-amber-500/30 text-amber-400'
                }`}>
                {proximity.ok
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Within farm — {proximity.distance}m from farm location</>
                  : <><AlertTriangle className="w-3.5 h-3.5" /> {proximity.distance}m from farm — report will be flagged as GPS invalid</>
                }
              </motion.div>
            )}
            {!createForm.gps_lat && (
              <p className="text-xs text-muted mt-1">Use "Detect Location" to auto-fill and verify proximity to farm</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setCreateOpen(false); setProximity(null) }} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Submitting…' : 'Submit'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal open={!!selected} onClose={() => { setSelected(null); setRejectionReason('') }} title="Review Report" size="sm">
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Date</span><span>{selected.report_date}</span></div>
              <div className="flex justify-between"><span className="text-muted">Batch</span><span>{batches.find(b => b.id === selected.batch_id)?.batch_code ?? selected.batch_id.slice(0, 8)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Mortality</span>
                <span className={selected.mortality > 0 ? 'text-red-400 font-medium' : ''}>{selected.mortality} birds</span>
              </div>
              <div className="flex justify-between"><span className="text-muted">Feed Consumed</span><span>{selected.feed_consumed} kg</span></div>
              <div className="flex justify-between"><span className="text-muted">GPS Valid</span>
                <span className={selected.gps_valid ? 'text-green-400' : 'text-red-400'}>{selected.gps_valid ? 'Yes' : 'No'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1" htmlFor="rejection-reason">Rejection Reason (if rejecting)</label>
              <textarea id="rejection-reason" className="input-field resize-none" rows={2} placeholder="Reason for rejection…"
                value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={saving}
                onClick={() => handleVerify('rejected')}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm font-medium">
                <XCircle className="w-4 h-4" /> Reject
              </motion.button>
              <motion.button type="button" whileTap={{ scale: 0.97 }} disabled={saving}
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
