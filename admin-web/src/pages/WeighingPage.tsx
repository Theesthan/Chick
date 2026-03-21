import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getWeighings, createWeighing, getBatches } from '../api'
import type { Weighing, Batch } from '../types'

export default function WeighingPage() {
  const { toast } = useToast()
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ batch_id: '', gross_weight: '', tare_weight: '', notes: '' })

  const load = () => Promise.all([getWeighings(), getBatches()]).then(([w, b]) => { setWeighings(w); setBatches(b) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const net = form.gross_weight && form.tare_weight ? Number(form.gross_weight) - Number(form.tare_weight) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createWeighing({ batch_id: form.batch_id, gross_weight: Number(form.gross_weight), tare_weight: Number(form.tare_weight), notes: form.notes || undefined })
      toast('Weighing recorded', 'success'); setOpen(false); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Weighing"
        subtitle="Harvest weight records"
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Weighing
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={5} /></div> : (
          <DataTable
            data={weighings}
            columns={[
              { key: 'batch_id', label: 'Batch', render: r => batches.find(b => b.id === r.batch_id)?.batch_code ?? r.batch_id.slice(0, 8) },
              { key: 'gross_weight', label: 'Gross (kg)', render: r => r.gross_weight.toFixed(2) },
              { key: 'tare_weight', label: 'Tare (kg)', render: r => r.tare_weight.toFixed(2) },
              { key: 'net_weight', label: 'Net (kg)', render: r => <span className="font-semibold text-green-400">{r.net_weight.toFixed(2)}</span> },
              { key: 'notes', label: 'Notes', render: r => r.notes ?? '—' },
              { key: 'created_at', label: 'Date', render: r => new Date(r.created_at).toLocaleDateString() },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Weighing">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Batch</label>
            <select className="input-field" value={form.batch_id} onChange={e => F('batch_id', e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Gross Weight (kg)</label>
              <input className="input-field" type="number" step="any" placeholder="6500" value={form.gross_weight} onChange={e => F('gross_weight', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tare Weight (kg)</label>
              <input className="input-field" type="number" step="any" placeholder="500" value={form.tare_weight} onChange={e => F('tare_weight', e.target.value)} required />
            </div>
          </div>
          {net !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-green-950/50 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-muted">Net Weight</p>
              <p className="text-3xl font-bold text-green-400">{net.toFixed(2)} <span className="text-base font-normal">kg</span></p>
            </motion.div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
            <input className="input-field" placeholder="Harvest day 1…" value={form.notes} onChange={e => F('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Record'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
