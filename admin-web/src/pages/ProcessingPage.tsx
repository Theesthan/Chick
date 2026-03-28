import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Factory, CheckCircle, AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AnimatedCard from '../components/AnimatedCard'
import { useToast } from '../components/Toast'
import { getBatches, createProcessing, getProcessing } from '../api'
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus'
import type { Batch, Processing } from '../types'

const BREAKDOWN_FIELDS = [
  { key: 'wings_kg',              label: 'Wings',               color: '#f59e0b' },
  { key: 'legs_kg',               label: 'Legs',                color: '#3b82f6' },
  { key: 'breast_kg',             label: 'Breast',              color: '#10b981' },
  { key: 'skinless_curry_cut_kg', label: 'Skinless Curry Cut',  color: '#06b6d4' },
  { key: 'lollipop_kg',           label: 'Lollipop',            color: '#8b5cf6' },
  { key: 'waste_kg',              label: 'Waste',               color: '#ef4444' },
] as const

type BreakdownKey = typeof BREAKDOWN_FIELDS[number]['key']

interface Form {
  batch_id: string
  inward_weight: string
  wings_kg: string
  legs_kg: string
  breast_kg: string
  skinless_curry_cut_kg: string
  lollipop_kg: string
  waste_kg: string
  shelf_life_days: string
}

function AnimatedBar({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium tabular-nums">{value.toFixed(1)} kg</span>
      </div>
      <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function ShelfLifeBanner({ processing }: { processing: Processing }) {
  const processedAt = new Date((processing as Processing & { processed_at?: string }).processed_at ?? processing.created_at)
  const shelfLife = (processing as Processing & { shelf_life_days?: number }).shelf_life_days ?? 3
  const expiresAt = new Date(processedAt)
  expiresAt.setDate(expiresAt.getDate() + shelfLife)
  const now = new Date()
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 86400000)
  const expired = daysLeft <= 0

  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${expired
        ? 'bg-red-950/50 border-red-500/40 text-red-400'
        : daysLeft <= 1
          ? 'bg-amber-950/50 border-amber-500/40 text-amber-400'
          : 'bg-green-950/40 border-green-500/30 text-green-400'
      }`}>
      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-sm">
          {expired ? '⚠ SHELF LIFE EXPIRED' : daysLeft === 1 ? '⚠ Expires Today' : `Shelf Life: ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`}
        </p>
        <p className="text-xs opacity-80 mt-0.5">
          Processed: {processedAt.toLocaleDateString()} · Expires: {expiresAt.toLocaleDateString()} · {shelfLife} day shelf life
        </p>
      </div>
    </motion.div>
  )
}

export default function ProcessingPage() {
  const { toast } = useToast()
  const [batches, setBatches] = useState<Batch[]>([])
  const [existing, setExisting] = useState<Processing | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form>({
    batch_id: '', inward_weight: '',
    wings_kg: '0', legs_kg: '0', breast_kg: '0', skinless_curry_cut_kg: '0', lollipop_kg: '0', waste_kg: '0',
    shelf_life_days: '3',
  })

  const loadBatches = () => getBatches().then(setBatches)
  useEffect(() => { loadBatches() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useRefreshOnFocus(loadBatches)

  const F = (k: keyof Form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleBatchChange = async (id: string) => {
    F('batch_id', id); setExisting(null); setSubmitted(false)
    if (!id) return
    try { const p = await getProcessing(id); setExisting(p) } catch { /* no processing yet */ }
  }

  const totalBreakdown = BREAKDOWN_FIELDS.reduce((s, f) => s + (Number(form[f.key]) || 0), 0)
  const inward = Number(form.inward_weight) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (inward <= 0) { toast('Inward weight must be positive', 'error'); return }
    if (totalBreakdown > inward + 0.01) {
      toast(`Breakdown total (${totalBreakdown.toFixed(2)} kg) exceeds inward weight (${inward} kg)`, 'error')
      return
    }
    const shelfDays = Number(form.shelf_life_days)
    if (shelfDays < 1 || shelfDays > 30) { toast('Shelf life must be 1–30 days', 'error'); return }
    setSaving(true)
    try {
      await createProcessing({
        batch_id: form.batch_id,
        inward_weight: inward,
        wings_kg: Number(form.wings_kg),
        legs_kg: Number(form.legs_kg),
        breast_kg: Number(form.breast_kg),
        skinless_curry_cut_kg: Number(form.skinless_curry_cut_kg),
        lollipop_kg: Number(form.lollipop_kg),
        waste_kg: Number(form.waste_kg),
        shelf_life_days: shelfDays,
      })
      setSubmitted(true)
      toast('Processing recorded!', 'success')
    } catch (err: unknown) {
      toast((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="Processing Panel" subtitle="Record plant processing and weight breakdown" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Form */}
        <AnimatedCard delay={0.1} className="p-6" hover={false}>
          <div className="flex items-center gap-2 mb-6">
            <Factory className="w-5 h-5 text-blue-400" />
            <h2 className="font-semibold text-slate-200">Processing Entry</h2>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
                  <CheckCircle className="w-16 h-16 text-green-400" />
                </motion.div>
                <p className="text-lg font-semibold text-slate-200">Processing Recorded!</p>
                <button onClick={() => { setSubmitted(false); setExisting(null); setForm({ batch_id: '', inward_weight: '', wings_kg: '0', legs_kg: '0', breast_kg: '0', skinless_curry_cut_kg: '0', lollipop_kg: '0', waste_kg: '0', shelf_life_days: '3' }) }}
                  className="btn-secondary mt-2">Record Another</button>
              </motion.div>
            ) : existing ? (
              <motion.div key="existing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-slate-300 text-sm">Processing already recorded for this batch.</p>
                </div>
                <div className="bg-slate-800/60 rounded-xl p-4 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted">Farm Weight</span><span>{existing.farm_weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-muted">Inward Weight</span><span>{existing.inward_weight} kg</span></div>
                  <div className="flex justify-between"><span className="text-muted">Transit Loss</span><span className="text-amber-400">{existing.loss.toFixed(2)} kg</span></div>
                </div>
                <ShelfLifeBanner processing={existing} />
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Batch */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Batch</label>
                  <select className="input-field" value={form.batch_id} onChange={e => handleBatchChange(e.target.value)} required>
                    <option value="">Select batch arriving at plant…</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batch_code} ({b.status})</option>)}
                  </select>
                </div>

                {/* Weights */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Inward Weight (kg)</label>
                  <input className="input-field" type="number" step="any" min="0.01" placeholder="5900" value={form.inward_weight} onChange={e => F('inward_weight', e.target.value)} required />
                  <p className="text-xs text-muted mt-1">Farm weight is auto-calculated from weighing records</p>
                </div>

                {/* Shelf Life */}
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Shelf Life (days)</label>
                  <input className="input-field" type="number" min="1" max="30" placeholder="3"
                    value={form.shelf_life_days} onChange={e => F('shelf_life_days', e.target.value)} required />
                  <p className="text-xs text-muted mt-1">Alert will show when shelf life is exceeded (default: 3 days for fresh poultry)</p>
                </div>

                {/* Breakdown */}
                <div>
                  <p className="text-sm text-slate-300 mb-3 font-medium">Breakdown (kg)</p>
                  <div className="grid grid-cols-2 gap-3">
                    {BREAKDOWN_FIELDS.map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs text-muted mb-1">{label}</label>
                        <input className="input-field text-sm" type="number" step="any" min="0" value={form[key]}
                          onChange={e => F(key, e.target.value)}
                          onFocus={e => e.target.select()} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown total */}
                <div className={`flex justify-between text-sm px-4 py-2.5 rounded-lg ${totalBreakdown > inward + 0.01 ? 'bg-red-950/50 text-red-400' : 'bg-slate-800/60 text-slate-300'}`}>
                  <span>Breakdown Total</span>
                  <span className="font-semibold">{totalBreakdown.toFixed(2)} / {inward || '—'} kg</span>
                </div>

                <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(37,99,235,0.4)' }} whileTap={{ scale: 0.98 }}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Factory className="w-4 h-4" />}
                  {saving ? 'Recording…' : 'Record Processing'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </AnimatedCard>

        {/* Breakdown Visual */}
        <AnimatedCard delay={0.2} className="p-6" hover={false}>
          <h2 className="font-semibold text-slate-200 mb-6">Weight Breakdown</h2>

          {(() => {
            // Use inward weight as the scale reference; fall back to total breakdown so
            // bars render as soon as the user starts entering values.
            const scale = Math.max(inward, totalBreakdown) || 1
            const hasAny = totalBreakdown > 0 || inward > 0
            return hasAny ? (
              <div className="space-y-5">
                {BREAKDOWN_FIELDS.map(({ key, label, color }) => (
                  <AnimatedBar key={key} value={Number(form[key as keyof typeof form]) || 0} max={scale} color={color} label={label} />
                ))}

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-muted mb-3">Distribution</p>
                  <div className="h-4 rounded-full overflow-hidden flex">
                    {BREAKDOWN_FIELDS.map(({ key, color }) => {
                      const pct = (Number(form[key as keyof typeof form]) / scale) * 100
                      return pct > 0 ? (
                        <motion.div key={key} style={{ backgroundColor: color, width: `${pct}%` }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                      ) : null
                    })}
                    {scale > totalBreakdown && (
                      <div style={{ width: `${((scale - totalBreakdown) / scale) * 100}%` }} className="bg-slate-600" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {BREAKDOWN_FIELDS.map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-1.5 text-xs text-muted">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-muted text-sm gap-2">
                <Factory className="w-8 h-8 opacity-30" />
                Enter inward weight and breakdown values to see visualisation
              </div>
            )
          })()}
        </AnimatedCard>
      </div>
    </div>
  )
}
