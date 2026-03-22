import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getProcurements, createProcurement } from '../api'
import type { Procurement } from '../types'

const ITEM_COLORS: Record<string, string> = {
  feed: 'bg-amber-500/20 text-amber-400',
  medicine: 'bg-green-500/20 text-green-400',
  chicks: 'bg-blue-500/20 text-blue-400',
}

export default function ProcurementPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<Procurement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const UNITS: Record<string, string[]> = {
    feed:     ['kg', 'g', 'bags', 'tonnes'],
    medicine: ['ml', 'litres', 'bottles', 'vials'],
    chicks:   ['count', 'dozen'],
  }
  const [form, setForm] = useState({ item_type: 'feed', quantity: '', unit: 'kg', unit_price: '', supplier: '', purchased_at: '' })

  const load = () => getProcurements().then(setItems).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createProcurement({ ...form, quantity: Number(form.quantity), unit_price: Number(form.unit_price) })
      toast('Procurement recorded', 'success'); setOpen(false); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const totalCost = items.reduce((s, i) => s + i.total_cost, 0)

  return (
    <div>
      <PageHeader
        title="Procurement"
        subtitle={`Total spend: ₹${totalCost.toLocaleString()}`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Purchase
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
          <DataTable
            data={items}
            columns={[
              { key: 'item_type', label: 'Item', render: r => <span className={`badge ${ITEM_COLORS[r.item_type]}`}>{r.item_type}</span> },
              { key: 'quantity', label: 'Qty', render: r => `${r.quantity} ${r.unit}` },
              { key: 'unit_price', label: 'Unit Price', render: r => `₹${r.unit_price}` },
              { key: 'total_cost', label: 'Total Cost', render: r => `₹${r.total_cost.toLocaleString()}` },
              { key: 'supplier', label: 'Supplier', render: r => r.supplier ?? '—' },
              { key: 'purchased_at', label: 'Date', render: r => new Date(r.purchased_at).toLocaleDateString() },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Item Type</label>
              <select className="input-field" value={form.item_type} onChange={e => {
                const it = e.target.value
                setForm(p => ({ ...p, item_type: it, unit: (UNITS[it] ?? ['kg'])[0] }))
              }}>
                <option value="feed">Feed</option>
                <option value="medicine">Medicine</option>
                <option value="chicks">Chicks</option>
              </select>
              {/* reset unit when item type changes */}
              {form.item_type && (() => { /* handled via onChange below */ return null })()}
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Unit</label>
              <select className="input-field" value={form.unit} onChange={e => F('unit', e.target.value)} required>
                {(UNITS[form.item_type] ?? ['kg']).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input className="input-field" type="number" step="any" placeholder="1000" value={form.quantity} onChange={e => F('quantity', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Unit Price (₹)</label>
              <input className="input-field" type="number" step="any" placeholder="25.50" value={form.unit_price} onChange={e => F('unit_price', e.target.value)} required />
            </div>
          </div>
          {form.quantity && form.unit_price && (
            <div className="bg-slate-800 rounded-lg px-4 py-3 text-sm">
              <span className="text-muted">Total Cost: </span>
              <span className="text-slate-100 font-semibold">₹{(Number(form.quantity) * Number(form.unit_price)).toLocaleString()}</span>
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-300 mb-1">Supplier (optional)</label>
            <input className="input-field" placeholder="FeedCo Ltd." value={form.supplier} onChange={e => F('supplier', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Purchase Date & Time</label>
            <input className="input-field" type="datetime-local" value={form.purchased_at} onChange={e => F('purchased_at', e.target.value)} required />
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
