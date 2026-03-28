import { useEffect, useState } from 'react'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import { TableSkeleton } from '../components/SkeletonLoader'
import { useToast } from '../components/Toast'
import { getUsers, register } from '../api'
import type { User } from '../types'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400',
  supervisor: 'bg-blue-500/20 text-blue-400',
  operator: 'bg-green-500/20 text-green-400',
}

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'supervisor' })

  const load = () => getUsers().then(setUsers).finally(() => setLoading(false))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(load)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await register(form)
      toast('User created', 'success'); setOpen(false); load()
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  const F = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''}`}
        action={
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add User
          </motion.button>
        }
      />

      <AnimatedCard delay={0.1} hover={false} className="overflow-hidden">
        {loading ? <div className="p-6"><TableSkeleton rows={4} cols={5} /></div> : (
          <DataTable
            data={users}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              { key: 'role', label: 'Role', render: r => <span className={`badge ${ROLE_COLORS[r.role]}`}>{r.role}</span> },
              { key: 'is_active', label: 'Status', render: r => <span className={`badge ${r.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>{r.is_active ? 'Active' : 'Inactive'}</span> },
              { key: 'created_at', label: 'Joined', render: r => new Date(r.created_at).toLocaleDateString() },
            ]}
          />
        )}
      </AnimatedCard>

      <Modal open={open} onClose={() => setOpen(false)} title="Add User" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Full Name</label>
            <input className="input-field" placeholder="Ravi Kumar" value={form.name} onChange={e => F('name', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Email</label>
            <input className="input-field" type="email" placeholder="ravi@poultryflow.com" value={form.email} onChange={e => F('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={form.password} onChange={e => F('password', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Role</label>
            <select className="input-field" value={form.role} onChange={e => F('role', e.target.value)}>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary flex-1">
              {saving ? 'Creating…' : 'Create User'}
            </motion.button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
