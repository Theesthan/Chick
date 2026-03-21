import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getSales, createSale, getBatches } from '../api'
import type { Sale, Batch } from '../types'

export default function SalesPage() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ batch_id: '', buyer_name: '', total_weight: '', price_per_kg: '', sold_at: '', notes: '' })

  const load = () => Promise.all([getSales(), getBatches()]).then(([s, b]) => { setSales(s); setBatches(b) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const totalRevenue = sales.reduce((s, x) => s + x.total_amount, 0)
  const preview = form.total_weight && form.price_per_kg ? Number(form.total_weight) * Number(form.price_per_kg) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createSale({ batch_id: form.batch_id, buyer_name: form.buyer_name, total_weight: Number(form.total_weight), price_per_kg: Number(form.price_per_kg), sold_at: form.sold_at, notes: form.notes || undefined })
      toast('Sale recorded', 'success'); setOpen(false); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle={`Total revenue: ₹${totalRevenue.toLocaleString()}`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Sale
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
          <DataTable
            data={sales}
            columns={[
              { key: 'batch_id', label: 'Batch', render: r => batches.find(b => b.id === r.batch_id)?.batch_code ?? r.batch_id.slice(0, 8) },
              { key: 'buyer_name', label: 'Buyer' },
              { key: 'total_weight', label: 'Weight', render: r => `${r.total_weight} kg` },
              { key: 'price_per_kg', label: 'Price/kg', render: r => `₹${r.price_per_kg}` },
              { key: 'total_amount', label: 'Total', render: r => <span className="font-semibold text-green-400">₹{r.total_amount.toLocaleString()}</span> },
              { key: 'sold_at', label: 'Date', render: r => new Date(r.sold_at).toLocaleDateString() },
              { key: 'notes', label: 'Notes', render: r => r.notes ?? '—' },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Sale">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Batch</label>
            <select className="input-field" value={form.batch_id} onChange={e => F('batch_id', e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Buyer Name</label>
            <input className="input-field" placeholder="Fresh Mart Ltd." value={form.buyer_name} onChange={e => F('buyer_name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Total Weight (kg)</label>
              <input className="input-field" type="number" step="any" placeholder="5000" value={form.total_weight} onChange={e => F('total_weight', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Price per kg (₹)</label>
              <input className="input-field" type="number" step="any" placeholder="120" value={form.price_per_kg} onChange={e => F('price_per_kg', e.target.value)} required />
            </div>
          </div>
          {preview !== null && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-green-950/50 border border-green-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-muted">Total Amount</p>
              <p className="text-2xl font-bold text-green-400">₹{preview.toLocaleString()}</p>
            </motion.div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Sale Date & Time</label>
            <input className="input-field" type="datetime-local" value={form.sold_at} onChange={e => F('sold_at', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
            <input className="input-field" value={form.notes} onChange={e => F('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Record Sale'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
