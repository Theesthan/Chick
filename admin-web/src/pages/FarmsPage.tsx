import { useEffect, useState } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getFarms, createFarm, updateFarm } from '../api'
import type { Farm } from '../types'

export default function FarmsPage() {
  const { toast } = useToast()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editFarm, setEditFarm] = useState<Farm | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ site_id: '', name: '', location: '', gps_lat: '', gps_lng: '', capacity: '' })

  const load = () => getFarms().then(setFarms).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditFarm(null); setForm({ site_id: '', name: '', location: '', gps_lat: '', gps_lng: '', capacity: '' }); setOpen(true) }
  const openEdit = (f: Farm) => { setEditFarm(f); setForm({ site_id: f.site_id, name: f.name, location: f.location, gps_lat: String(f.gps_lat), gps_lng: String(f.gps_lng), capacity: String(f.capacity) }); setOpen(true) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editFarm) {
        await updateFarm(editFarm.id, { name: form.name, location: form.location, capacity: Number(form.capacity) })
        toast('Farm updated', 'success')
      } else {
        await createFarm({ site_id: form.site_id, name: form.name, location: form.location, gps_lat: Number(form.gps_lat), gps_lng: Number(form.gps_lng), capacity: Number(form.capacity) })
        toast('Farm created', 'success')
      }
      setOpen(false); load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed'
      toast(msg, 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Farms"
        subtitle={`${farms.length} farm${farms.length !== 1 ? 's' : ''} registered`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={openCreate}
            className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Farm
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={5} /></div> : (
          <DataTable
            data={farms}
            columns={[
              { key: 'site_id', label: 'Site ID' },
              { key: 'name', label: 'Name' },
              { key: 'location', label: 'Location' },
              { key: 'capacity', label: 'Capacity', render: r => r.capacity.toLocaleString() + ' birds' },
              { key: 'created_at', label: 'Created', render: r => new Date(r.created_at).toLocaleDateString() },
              {
                key: 'actions', label: '',
                render: row => (
                  <button onClick={() => openEdit(row)} className="text-xs text-primary hover:underline">Edit</button>
                ),
              },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title={editFarm ? 'Edit Farm' : 'Add Farm'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editFarm && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Site ID</label>
              <input className="input-field" placeholder="FARM-001" value={form.site_id} onChange={e => F('site_id', e.target.value)} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input className="input-field" placeholder="Green Valley Farm" value={form.name} onChange={e => F('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Capacity (birds)</label>
              <input className="input-field" type="number" placeholder="5000" value={form.capacity} onChange={e => F('capacity', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Location</label>
            <input className="input-field" placeholder="123 Farm Road, City" value={form.location} onChange={e => F('location', e.target.value)} required />
          </div>
          {!editFarm && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">GPS Lat</label>
                <input className="input-field" type="number" step="any" placeholder="12.9716" value={form.gps_lat} onChange={e => F('gps_lat', e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">GPS Lng</label>
                <input className="input-field" type="number" step="any" placeholder="77.5946" value={form.gps_lng} onChange={e => F('gps_lng', e.target.value)} required />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Saving…' : editFarm ? 'Update' : 'Create'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
