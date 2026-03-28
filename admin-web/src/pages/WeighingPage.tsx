import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getWeighings, createWeighing, getBatches } from '../api'
import type { Weighing, Batch } from '../types'

function toKg(value: number, unit: 'kg' | 'g'): number {
  return unit === 'g' ? value / 1000 : value
}

export default function WeighingPage() {
  const { toast } = useToast()
  const [weighings, setWeighings] = useState<Weighing[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ batch_id: '', gross_weight: '', tare_weight: '', unit: 'kg' as 'kg' | 'g', mortality: '0', notes: '' })

  const load = () => Promise.all([getWeighings(), getBatches()])
    .then(([w, b]) => { setWeighings(w); setBatches(b) })
    .finally(() => setLoading(false))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(load)

  const grossKg = form.gross_weight ? toKg(Number(form.gross_weight), form.unit) : null
  const tareKg  = form.tare_weight  ? toKg(Number(form.tare_weight),  form.unit) : null
  const net = grossKg !== null && tareKg !== null ? grossKg - tareKg : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const gKg = toKg(Number(form.gross_weight), form.unit)
    const tKg = toKg(Number(form.tare_weight), form.unit)
    if (tKg >= gKg) { toast('Tare weight must be less than gross weight', 'error'); return }
    if (gKg <= 0 || tKg < 0) { toast('Weights must be positive', 'error'); return }
    const mortality = Number(form.mortality)
    if (mortality < 0) { toast('Mortality cannot be negative', 'error'); return }
    setSaving(true)
    try {
      await createWeighing({ batch_id: form.batch_id, gross_weight: gKg, tare_weight: tKg, mortality, notes: form.notes || undefined })
      toast('Weighing recorded', 'success'); setOpen(false); reset(); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const reset = () => setForm({ batch_id: '', gross_weight: '', tare_weight: '', unit: 'kg', mortality: '0', notes: '' })

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
              { key: 'mortality', label: 'Mortality', render: r => r.mortality > 0 ? <span className="text-red-400 font-medium">{r.mortality} birds</span> : <span className="text-slate-500">—</span> },
              { key: 'notes', label: 'Notes', render: r => r.notes ?? '—' },
              { key: 'created_at', label: 'Date', render: r => new Date(r.created_at).toLocaleDateString() },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Weighing">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1" htmlFor="weigh-batch">Batch</label>
            <select id="weigh-batch" className="input-field" value={form.batch_id} onChange={e => F('batch_id', e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
            </select>
          </div>

          {/* Unit selector */}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Weight Unit</label>
            <div className="flex gap-2">
              {(['kg', 'g'] as const).map(u => (
                <button key={u} type="button"
                  onClick={() => setForm(p => ({ ...p, unit: u }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.unit === u ? 'bg-primary/20 border-primary text-primary' : 'border-border text-slate-400 hover:border-slate-500'}`}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Gross Weight ({form.unit})</label>
              <input className="input-field" type="number" step="any" min="0.001" placeholder={form.unit === 'kg' ? '6500' : '6500000'}
                value={form.gross_weight} onChange={e => F('gross_weight', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Tare / Cage Weight ({form.unit})</label>
              <input className="input-field" type="number" step="any" min="0" placeholder={form.unit === 'kg' ? '500' : '500000'}
                value={form.tare_weight} onChange={e => F('tare_weight', e.target.value)} required />
            </div>
          </div>
          {net !== null && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className={`border rounded-xl p-4 text-center ${net < 0 ? 'bg-red-950/50 border-red-500/30' : 'bg-green-950/50 border-green-500/30'}`}>
              <p className="text-sm text-muted">Net Weight</p>
              <p className={`text-3xl font-bold ${net < 0 ? 'text-red-400' : 'text-green-400'}`}>
                {net < 0 ? '⚠ Invalid' : `${net.toFixed(3)} kg`}
              </p>
              {net < 0 && <p className="text-xs text-red-400 mt-1">Tare must be less than gross</p>}
            </motion.div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mortality (birds)</label>
            <input className="input-field" type="number" min="0" placeholder="0" value={form.mortality} onChange={e => F('mortality', e.target.value)} />
            <p className="text-xs text-muted mt-1">Birds that died at harvest — auto-deducted from inventory</p>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
            <input className="input-field" placeholder="Harvest day 1…" value={form.notes} onChange={e => F('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving || (net !== null && net < 0)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Record'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
