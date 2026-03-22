import { useEffect, useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getBatches, createTransport, recordArrival } from '../api'
import { client } from '../api/client'
import type { Transport, Batch } from '../types'

function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function TransportPage() {
  const { toast } = useToast()
  const [transports, setTransports] = useState<Transport[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [arrivalOpen, setArrivalOpen] = useState(false)
  const [selected, setSelected] = useState<Transport | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ batch_id: '', vehicle_number: '', driver_name: '', origin: '', destination: '', dispatch_time: nowLocal() })
  const [arrivalTime, setArrivalTime] = useState(nowLocal())

  const load = async () => {
    try {
      const [bs, ts] = await Promise.all([
        getBatches(),
        client.get<Transport[]>('/transport/').then(r => r.data),
      ])
      setBatches(bs)
      setTransports(ts)
    } catch {
      // pass
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.batch_id) { toast('Select a batch', 'error'); return }
    if (!form.vehicle_number.trim()) { toast('Enter vehicle number', 'error'); return }
    if (!form.origin.trim() || !form.destination.trim()) { toast('Enter origin and destination', 'error'); return }
    setSaving(true)
    try {
      await createTransport({ ...form, driver_name: form.driver_name || undefined })
      toast('Transport dispatched', 'success')
      setOpen(false)
      setForm({ batch_id: '', vehicle_number: '', driver_name: '', origin: '', destination: '', dispatch_time: nowLocal() })
      load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const handleArrival = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    setSaving(true)
    try {
      await recordArrival(selected.id, arrivalTime)
      toast('Arrival recorded', 'success')
      setArrivalOpen(false)
      load()
    } catch { toast('Failed', 'error') } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const inTransit = transports.filter(t => !t.arrival_time).length

  return (
    <div>
      <PageHeader
        title="Transport"
        subtitle={`${inTransit} in transit`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Dispatch
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={6} /></div> : (
          <DataTable
            data={transports}
            columns={[
              { key: 'batch_id', label: 'Batch', render: r => batches.find(b => b.id === r.batch_id)?.batch_code ?? r.batch_id.slice(0, 8) },
              { key: 'vehicle_number', label: 'Vehicle' },
              { key: 'driver_name', label: 'Driver', render: r => r.driver_name ?? '—' },
              { key: 'origin', label: 'Origin' },
              { key: 'destination', label: 'Destination' },
              { key: 'dispatch_time', label: 'Dispatched', render: r => new Date(r.dispatch_time).toLocaleString() },
              {
                key: 'arrival_time', label: 'Status',
                render: r => r.arrival_time
                  ? <span className="badge bg-green-500/20 text-green-400">Arrived {new Date(r.arrival_time).toLocaleTimeString()}</span>
                  : <span className="badge bg-amber-500/20 text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" />In Transit</span>,
              },
              {
                key: 'actions', label: '',
                render: row => !row.arrival_time ? (
                  <button onClick={() => { setSelected(row); setArrivalTime(nowLocal()); setArrivalOpen(true) }}
                    className="text-xs text-primary hover:underline">Record Arrival</button>
                ) : null,
              },
            ]}
          />
        )}
      </AnimatedCard>

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Transport Dispatch">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Batch</label>
            <select className="input-field" value={form.batch_id} onChange={e => F('batch_id', e.target.value)} required>
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Vehicle Number</label>
              <input className="input-field" placeholder="KA-01-AB-1234" value={form.vehicle_number} onChange={e => F('vehicle_number', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Driver Name</label>
              <input className="input-field" placeholder="Optional" value={form.driver_name} onChange={e => F('driver_name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Origin</label>
              <input className="input-field" placeholder="Farm name" value={form.origin} onChange={e => F('origin', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Destination</label>
              <input className="input-field" placeholder="Processing plant" value={form.destination} onChange={e => F('destination', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Dispatch Time</label>
            <input className="input-field" type="datetime-local" value={form.dispatch_time} onChange={e => F('dispatch_time', e.target.value)} required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Dispatching…' : 'Dispatch'}
            </motion.button>
          </div>
        </form>
      </Modal>

      {/* Arrival Modal */}
      <Modal open={arrivalOpen} onClose={() => setArrivalOpen(false)} title="Record Arrival" size="sm">
        <form onSubmit={handleArrival} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Arrival Time</label>
            <input className="input-field" type="datetime-local" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setArrivalOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : 'Confirm Arrival'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
