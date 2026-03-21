import { useEffect, useState } from 'react'
import { Plus, ArrowDown, ArrowUp } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getInventory, getBalance, addInward, issueStock, getProcurements, getBatches } from '../api'
import type { InventoryTransaction, Procurement, Batch } from '../types'

const ITEMS = ['feed', 'medicine', 'chicks']

export default function InventoryPage() {
  const { toast } = useToast()
  const [txns, setTxns] = useState<InventoryTransaction[]>([])
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'inward' | 'issue' | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ item_type: 'feed', quantity: '', procurement_id: '', batch_id: '', notes: '' })

  const loadBalances = async () => {
    const results = await Promise.all(ITEMS.map(i => getBalance(i)))
    setBalances(Object.fromEntries(results.map((r, i) => [ITEMS[i], r.current_balance])))
  }

  const load = async () => {
    await Promise.all([
      getInventory().then(setTxns),
      getProcurements().then(setProcurements),
      getBatches().then(setBatches),
      loadBalances(),
    ])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (modal === 'inward') {
        await addInward({ item_type: form.item_type, quantity: Number(form.quantity), procurement_id: form.procurement_id, notes: form.notes || undefined })
        toast('Stock added', 'success')
      } else {
        await issueStock({ item_type: form.item_type, quantity: Number(form.quantity), batch_id: form.batch_id, notes: form.notes || undefined })
        toast('Stock issued', 'success')
      }
      setModal(null); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock balance and transactions"
        action={
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setForm(p => ({ ...p, quantity: '', procurement_id: '', notes: '' })); setModal('inward') }}
              className="btn-primary flex items-center gap-2 text-sm">
              <ArrowDown className="w-4 h-4" /> Add Stock
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setForm(p => ({ ...p, quantity: '', batch_id: '', notes: '' })); setModal('issue') }}
              className="btn-secondary flex items-center gap-2 text-sm">
              <ArrowUp className="w-4 h-4" /> Issue Stock
            </motion.button>
          </div>
        }
      />

      {/* Balance Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {ITEMS.map((item, i) => (
          <motion.div key={item} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-surface border border-border rounded-2xl p-5">
            <p className="text-sm text-muted capitalize mb-1">{item} balance</p>
            <p className="text-2xl font-bold text-slate-100">{loading ? '—' : (balances[item] ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted mt-0.5">units in stock</p>
          </motion.div>
        ))}
      </div>

      <AnimatedCard delay={0.3} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={5} cols={5} /></div> : (
          <DataTable
            data={txns}
            columns={[
              { key: 'item_type', label: 'Item' },
              { key: 'transaction_type', label: 'Type', render: r => (
                <span className={`badge ${r.transaction_type === 'inward' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {r.transaction_type === 'inward' ? '▲' : '▼'} {r.transaction_type}
                </span>
              )},
              { key: 'quantity', label: 'Qty', render: r => r.quantity.toLocaleString() },
              { key: 'balance_after', label: 'Balance After', render: r => r.balance_after.toLocaleString() },
              { key: 'notes', label: 'Notes', render: r => r.notes ?? '—' },
              { key: 'created_at', label: 'Date', render: r => new Date(r.created_at).toLocaleDateString() },
            ]}
          />
        )}
      </AnimatedCard>

      {/* Inward Modal */}
      <Modal open={modal === 'inward'} onClose={() => setModal(null)} title="Add Inward Stock">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Item Type</label>
              <select className="input-field" value={form.item_type} onChange={e => F('item_type', e.target.value)}>
                {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input className="input-field" type="number" step="any" placeholder="1000" value={form.quantity} onChange={e => F('quantity', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Procurement Record</label>
            <select className="input-field" value={form.procurement_id} onChange={e => F('procurement_id', e.target.value)} required>
              <option value="">Select procurement…</option>
              {procurements.filter(p => p.item_type === form.item_type).map(p => (
                <option key={p.id} value={p.id}>{p.item_type} — {p.quantity} {p.unit} — {new Date(p.purchased_at).toLocaleDateString()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
            <input className="input-field" placeholder="Initial stock…" value={form.notes} onChange={e => F('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Adding…' : 'Add Stock'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Issue Modal */}
      <Modal open={modal === 'issue'} onClose={() => setModal(null)} title="Issue Stock to Batch">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Item Type</label>
              <select className="input-field" value={form.item_type} onChange={e => F('item_type', e.target.value)}>
                {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quantity</label>
              <input className="input-field" type="number" step="any" value={form.quantity} onChange={e => F('quantity', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Batch</label>
            <select className="input-field" value={form.batch_id} onChange={e => F('batch_id', e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.filter(b => b.status === 'active').map(b => (
                <option key={b.id} value={b.id}>{b.batch_code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Notes (optional)</label>
            <input className="input-field" value={form.notes} onChange={e => F('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Issuing…' : 'Issue Stock'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
