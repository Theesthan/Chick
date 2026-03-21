import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getBatches, createBatch, updateBatch, getFarms } from '../api'
import type { Batch, Farm, BatchStatus } from '../types'

const STATUS_COLORS: Record<BatchStatus, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  harvested: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  closed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function BatchesPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [selected, setSelected] = useState<Batch | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ farm_id: '', batch_code: '', chick_count: '', start_date: '' })
  const [newStatus, setNewStatus] = useState<BatchStatus>('active')

  const load = () => Promise.all([getBatches(), getFarms()]).then(([b, f]) => { setBatches(b); setFarms(f) }).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createBatch({ farm_id: form.farm_id, batch_code: form.batch_code, chick_count: Number(form.chick_count), start_date: form.start_date })
      toast('Batch created', 'success'); setOpen(false); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const handleStatus = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selected) return; setSaving(true)
    try {
      await updateBatch(selected.id, newStatus)
      toast('Status updated', 'success'); setStatusOpen(false); load()
    } catch { toast('Failed', 'error') } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader
        title="Batches"
        subtitle={`${batches.length} batch${batches.length !== 1 ? 'es' : ''}`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Batch
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={5} /></div> : (
          <DataTable
            data={batches}
            columns={[
              { key: 'batch_code', label: 'Batch Code' },
              { key: 'farm_id', label: 'Farm', render: r => farms.find(f => f.id === r.farm_id)?.name ?? r.farm_id.slice(0, 8) },
              { key: 'chick_count', label: 'Chicks', render: r => r.chick_count.toLocaleString() },
              { key: 'start_date', label: 'Start Date' },
              { key: 'status', label: 'Status', render: r => <span className={`badge border ${STATUS_COLORS[r.status]}`}>{r.status}</span> },
              {
                key: 'actions', label: '',
                render: row => (
                  <button onClick={() => { setSelected(row); setNewStatus(row.status); setStatusOpen(true) }}
                    className="text-xs text-primary hover:underline">Update Status</button>
                ),
              },
            ]}
          />
        )}
      </AnimatedCard>

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Batch">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Farm</label>
            <select className="input-field" value={form.farm_id} onChange={e => setForm(p => ({ ...p, farm_id: e.target.value }))} required>
              <option value="">Select farm…</option>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name} ({f.site_id})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Batch Code</label>
              <input className="input-field" placeholder="BATCH-2026-001" value={form.batch_code} onChange={e => setForm(p => ({ ...p, batch_code: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Chick Count</label>
              <input className="input-field" type="number" placeholder="3000" value={form.chick_count} onChange={e => setForm(p => ({ ...p, chick_count: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Start Date</label>
            <input className="input-field" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create Batch'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Status Modal */}
      <Modal open={statusOpen} onClose={() => setStatusOpen(false)} title={`Update: ${selected?.batch_code}`} size="sm">
        <form onSubmit={handleStatus} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Status</label>
            <select className="input-field" value={newStatus} onChange={e => setNewStatus(e.target.value as BatchStatus)}>
              <option value="active">Active</option>
              <option value="harvested">Harvested</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStatusOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Update'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
