'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  createProject, updateProject, deleteProject, type ProjectFormData,
  createTender, updateTender, deleteTender, type TenderFormData,
  createDonor, updateDonor, deleteDonor, type DonorFormData,
  createJob, updateJob, deleteJob, type JobFormData,
  createNews, updateNews, deleteNews, type NewsFormData,
  createFirm, updateFirm, deleteFirm, type FirmFormData,
  createPsdpScheme, updatePsdpScheme, deletePsdpScheme, type PsdpSchemeFormData,
} from '@/app/actions/content'
import { Plus, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react'

// ─── Shared form primitives ───────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-bold text-ash uppercase tracking-wide">{label}</label>
      <div className="mt-0.5">{children}</div>
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded border border-silver px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: string[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded border border-silver px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-pine"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function Textarea({ value, onChange, placeholder, rows = 2 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded border border-silver px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-pine resize-none"
    />
  )
}

// ─── Modal shell ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, onSubmit, isPending, children }: {
  title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; isPending: boolean; children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-silver overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-silver shrink-0">
          <h3 className="font-bold text-ink">{title}</h3>
          <button type="button" onClick={onClose} className="text-ash hover:text-ink"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="grid grid-cols-2 gap-3">{children}</div>
        </div>
        <div className="flex gap-2 px-5 py-4 border-t border-silver shrink-0">
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 bg-pine text-white text-sm font-medium rounded-lg hover:bg-forest disabled:opacity-60"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-ash hover:text-ink">Cancel</button>
        </div>
      </form>
    </div>
  )
}

// ─── Delete confirm ──────────────────────────────────────────────────────────

function ConfirmDelete({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl border border-silver p-6 max-w-sm w-full text-center space-y-4">
        <AlertTriangle size={28} className="text-danger mx-auto" />
        <p className="font-semibold text-ink text-sm">Delete <span className="text-danger">{label}</span>?</p>
        <p className="text-xs text-ash">This cannot be undone.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onConfirm} className="px-4 py-1.5 bg-danger text-white text-sm font-medium rounded-lg hover:bg-red-700">Delete</button>
          <button onClick={onCancel} className="px-4 py-1.5 text-sm text-ash hover:text-ink border border-silver rounded-lg">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Table shell ─────────────────────────────────────────────────────────────

function DataTable({ cols, children, onAdd, count }: {
  cols: string[]; children: React.ReactNode; onAdd: () => void; count: number
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ash">{count} records</span>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 text-xs font-medium text-pine hover:text-forest px-3 py-1.5 rounded-lg border border-pine/30 hover:bg-pine/5"
        >
          <Plus size={12} /> Add New
        </button>
      </div>
      <div className="rounded-xl border border-silver bg-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-silver bg-fog">
              {cols.map(c => <th key={c} className="px-3 py-2 text-left text-ash font-semibold whitespace-nowrap">{c}</th>)}
              <th className="px-3 py-2 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-silver">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Projects tab ─────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>

const emptyProject: ProjectFormData = {
  title: '', donor: '', sector: '', province: '', amount_usd: '', status: 'active',
  instrument: '', start_date: '', end_date: '', implementer: '', context_note: '',
  opportunity_note: '', source_url: '', source: '', featured: false,
}

function ProjectsTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<ProjectFormData>(emptyProject)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const f = (k: keyof ProjectFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openCreate() { setForm(emptyProject); setModal('create') }
  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({
      title: String(row.title ?? ''), donor: String(row.donor ?? ''), sector: String(row.sector ?? ''),
      province: String(row.province ?? ''), amount_usd: String(row.amount_usd ?? ''),
      status: (row.status as ProjectFormData['status']) ?? 'active',
      instrument: String(row.instrument ?? ''), start_date: String(row.start_date ?? '').slice(0, 10),
      end_date: String(row.end_date ?? '').slice(0, 10), implementer: String(row.implementer ?? ''),
      context_note: String(row.context_note ?? ''), opportunity_note: String(row.opportunity_note ?? ''),
      source_url: String(row.source_url ?? ''), source: String(row.source ?? ''), featured: Boolean(row.featured),
    })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createProject(form)
      else if (modal === 'edit' && editing) await updateProject(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  async function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteProject(String(deleting.id))
      setRows(r => r.filter(x => x.id !== deleting.id))
      setDeleting(null)
    })
  }

  return (
    <>
      <DataTable cols={['Title', 'Donor', 'Sector', 'Status', 'Amount']} onAdd={openCreate} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink max-w-[200px] truncate">{String(r.title)}</td>
            <td className="px-3 py-2 text-ash">{String(r.donor)}</td>
            <td className="px-3 py-2 text-ash">{String(r.sector ?? '—')}</td>
            <td className="px-3 py-2"><span className="capitalize text-ash">{String(r.status)}</span></td>
            <td className="px-3 py-2 text-pine font-medium">{r.amount_usd ? `$${(Number(r.amount_usd)/1e6).toFixed(1)}M` : '—'}</td>
            <td className="px-3 py-2">
              <div className="flex gap-1.5">
                <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
                <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {modal && (
        <Modal title={modal === 'create' ? 'Add Project' : 'Edit Project'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <div className="col-span-2"><Field label="Title *"><Input value={form.title} onChange={f('title')} placeholder="Project title" required /></Field></div>
          <Field label="Donor *"><Input value={form.donor} onChange={f('donor')} placeholder="World Bank" required /></Field>
          <Field label="Source *"><Input value={form.source} onChange={f('source')} placeholder="WB" required /></Field>
          <Field label="Sector"><Input value={form.sector} onChange={f('sector')} placeholder="Health" /></Field>
          <Field label="Province"><Input value={form.province} onChange={f('province')} placeholder="Punjab" /></Field>
          <Field label="Amount (USD)"><Input value={form.amount_usd} onChange={f('amount_usd')} type="number" placeholder="50000000" /></Field>
          <Field label="Status"><Select value={form.status} onChange={f('status')} options={['active', 'closing', 'closed', 'frozen', 'pipeline']} /></Field>
          <Field label="Instrument"><Select value={form.instrument} onChange={v => f('instrument')(v)} options={['', 'Loan', 'Grant', 'TA', 'Humanitarian']} /></Field>
          <Field label="Implementer"><Input value={form.implementer} onChange={f('implementer')} /></Field>
          <Field label="Start Date"><Input value={form.start_date} onChange={f('start_date')} type="date" /></Field>
          <Field label="End Date"><Input value={form.end_date} onChange={f('end_date')} type="date" /></Field>
          <Field label="Source URL"><Input value={form.source_url} onChange={f('source_url')} placeholder="https://" /></Field>
          <div className="col-span-2"><Field label="Context Note"><Textarea value={form.context_note} onChange={f('context_note')} placeholder="Why this project matters" /></Field></div>
          <div className="col-span-2"><Field label="Opportunity Note"><Textarea value={form.opportunity_note} onChange={f('opportunity_note')} placeholder="TA needed, procurement imminent…" /></Field></div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="accent-pine" />
            <label className="text-sm text-ink">Featured</label>
          </div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.title)} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── Tenders tab ─────────────────────────────────────────────────────────────

const emptyTender: TenderFormData = {
  title: '', donor: '', sector: '', province: '', value_usd: '', deadline: '',
  status: 'open', instrument: '', implementer: '', positioning_note: '', source_url: '', source: '',
}

function TendersTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<TenderFormData>(emptyTender)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const f = (k: keyof TenderFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({
      title: String(row.title ?? ''), donor: String(row.donor ?? ''), sector: String(row.sector ?? ''),
      province: String(row.province ?? ''), value_usd: String(row.value_usd ?? ''),
      deadline: String(row.deadline ?? '').slice(0, 10),
      status: (row.status as TenderFormData['status']) ?? 'open',
      instrument: String(row.instrument ?? ''), implementer: String(row.implementer ?? ''),
      positioning_note: String(row.positioning_note ?? ''), source_url: String(row.source_url ?? ''),
      source: String(row.source ?? ''),
    })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createTender(form)
      else if (modal === 'edit' && editing) await updateTender(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  async function handleDelete() {
    if (!deleting) return
    startTransition(async () => {
      await deleteTender(String(deleting.id))
      setRows(r => r.filter(x => x.id !== deleting.id))
      setDeleting(null)
    })
  }

  return (
    <>
      <DataTable cols={['Title', 'Donor', 'Status', 'Value', 'Deadline']} onAdd={() => { setForm(emptyTender); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink max-w-[200px] truncate">{String(r.title)}</td>
            <td className="px-3 py-2 text-ash">{String(r.donor)}</td>
            <td className="px-3 py-2 capitalize text-ash">{String(r.status)}</td>
            <td className="px-3 py-2 text-pine font-medium">{r.value_usd ? `$${(Number(r.value_usd)/1e6).toFixed(1)}M` : '—'}</td>
            <td className="px-3 py-2 text-ash">{String(r.deadline ?? '—').slice(0, 10)}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Tender' : 'Edit Tender'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <div className="col-span-2"><Field label="Title *"><Input value={form.title} onChange={f('title')} required /></Field></div>
          <Field label="Donor *"><Input value={form.donor} onChange={f('donor')} required /></Field>
          <Field label="Source *"><Input value={form.source} onChange={f('source')} required /></Field>
          <Field label="Sector"><Input value={form.sector} onChange={f('sector')} /></Field>
          <Field label="Province"><Input value={form.province} onChange={f('province')} /></Field>
          <Field label="Value (USD)"><Input value={form.value_usd} onChange={f('value_usd')} type="number" /></Field>
          <Field label="Deadline"><Input value={form.deadline} onChange={f('deadline')} type="date" /></Field>
          <Field label="Status"><Select value={form.status} onChange={f('status')} options={['open', 'evaluation', 'awarded', 'cancelled']} /></Field>
          <Field label="Instrument"><Input value={form.instrument} onChange={f('instrument')} placeholder="Consulting / Works / Goods" /></Field>
          <Field label="Implementer"><Input value={form.implementer} onChange={f('implementer')} /></Field>
          <Field label="Source URL"><Input value={form.source_url} onChange={f('source_url')} /></Field>
          <div className="col-span-2"><Field label="Positioning Note"><Textarea value={form.positioning_note} onChange={f('positioning_note')} placeholder="Competitive intel for users" /></Field></div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.title)} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── Donors tab ──────────────────────────────────────────────────────────────

const emptyDonor: DonorFormData = { name: '', type: 'MDB', country: '', opportunity_note: '', pain_point: '', entry_path: '', website: '', procurement_model: '' }

function DonorsTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<DonorFormData>(emptyDonor)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const f = (k: keyof DonorFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({ name: String(row.name ?? ''), type: String(row.type ?? 'MDB'), country: String(row.country ?? ''), opportunity_note: String(row.opportunity_note ?? ''), pain_point: String(row.pain_point ?? ''), entry_path: String(row.entry_path ?? ''), website: String(row.website ?? ''), procurement_model: String(row.procurement_model ?? '') })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createDonor(form)
      else if (editing) await updateDonor(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  return (
    <>
      <DataTable cols={['Name', 'Type', 'Country', 'Entry Path']} onAdd={() => { setForm(emptyDonor); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink">{String(r.name)}</td>
            <td className="px-3 py-2 text-ash">{String(r.type ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.country ?? '—')}</td>
            <td className="px-3 py-2 text-ash max-w-[200px] truncate">{String(r.entry_path ?? '—')}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Donor' : 'Edit Donor'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <Field label="Name *"><Input value={form.name} onChange={f('name')} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={f('type')} options={['MDB', 'Bilateral', 'UN', 'Climate', 'Private']} /></Field>
          <Field label="Country"><Input value={form.country} onChange={f('country')} /></Field>
          <Field label="Website"><Input value={form.website} onChange={f('website')} /></Field>
          <Field label="Procurement Model"><Input value={form.procurement_model} onChange={f('procurement_model')} /></Field>
          <Field label="Entry Path"><Input value={form.entry_path} onChange={f('entry_path')} /></Field>
          <div className="col-span-2"><Field label="Opportunity Note"><Textarea value={form.opportunity_note} onChange={f('opportunity_note')} /></Field></div>
          <div className="col-span-2"><Field label="Pain Point"><Textarea value={form.pain_point} onChange={f('pain_point')} /></Field></div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.name)} onConfirm={async () => { startTransition(async () => { await deleteDonor(String(deleting.id)); setRows(r => r.filter(x => x.id !== deleting.id)); setDeleting(null) }) }} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── Jobs tab ────────────────────────────────────────────────────────────────

const emptyJob: JobFormData = { title: '', organisation: '', org_type: '', location: '', employment_type: '', seniority: '', sector: '', salary_label: '', apply_url: '', description: '', deadline: '', source: '' }

function JobsTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<JobFormData>(emptyJob)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const f = (k: keyof JobFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({ title: String(row.title ?? ''), organisation: String(row.organisation ?? ''), org_type: String(row.org_type ?? ''), location: String(row.location ?? ''), employment_type: String(row.employment_type ?? ''), seniority: String(row.seniority ?? ''), sector: String(row.sector ?? ''), salary_label: String(row.salary_label ?? ''), apply_url: String(row.apply_url ?? ''), description: String(row.description ?? ''), deadline: String(row.deadline ?? '').slice(0, 10), source: String(row.source ?? '') })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createJob(form)
      else if (editing) await updateJob(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  return (
    <>
      <DataTable cols={['Title', 'Organisation', 'Sector', 'Seniority', 'Deadline']} onAdd={() => { setForm(emptyJob); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink max-w-[160px] truncate">{String(r.title)}</td>
            <td className="px-3 py-2 text-ash">{String(r.organisation)}</td>
            <td className="px-3 py-2 text-ash">{String(r.sector ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.seniority ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.deadline ?? '—').slice(0, 10)}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Job' : 'Edit Job'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <div className="col-span-2"><Field label="Title *"><Input value={form.title} onChange={f('title')} required /></Field></div>
          <Field label="Organisation *"><Input value={form.organisation} onChange={f('organisation')} required /></Field>
          <Field label="Org Type"><Select value={form.org_type} onChange={f('org_type')} options={['', 'UN', 'INGO', 'Consulting', 'Local NGO', 'Government']} /></Field>
          <Field label="Location"><Input value={form.location} onChange={f('location')} /></Field>
          <Field label="Seniority"><Select value={form.seniority} onChange={f('seniority')} options={['', 'Entry', 'Mid', 'Senior', 'Director', 'UN NO', 'UN P3']} /></Field>
          <Field label="Sector"><Input value={form.sector} onChange={f('sector')} /></Field>
          <Field label="Salary Label"><Input value={form.salary_label} onChange={f('salary_label')} placeholder="PKR 350K-500K/mo" /></Field>
          <Field label="Apply URL"><Input value={form.apply_url} onChange={f('apply_url')} /></Field>
          <Field label="Deadline"><Input value={form.deadline} onChange={f('deadline')} type="date" /></Field>
          <Field label="Source"><Input value={form.source} onChange={f('source')} /></Field>
          <div className="col-span-2"><Field label="Description"><Textarea value={form.description} onChange={f('description')} rows={3} /></Field></div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.title)} onConfirm={async () => { startTransition(async () => { await deleteJob(String(deleting.id)); setRows(r => r.filter(x => x.id !== deleting.id)); setDeleting(null) }) }} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── News tab ────────────────────────────────────────────────────────────────

const emptyNews: NewsFormData = { title: '', source: '', topic: '', excerpt: '', url: '', featured: false, published_at: '' }

function NewsTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<NewsFormData>(emptyNews)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const f = (k: keyof NewsFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({ title: String(row.title ?? ''), source: String(row.source ?? ''), topic: String(row.topic ?? ''), excerpt: String(row.excerpt ?? ''), url: String(row.url ?? ''), featured: Boolean(row.featured), published_at: String(row.published_at ?? '').slice(0, 10) })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createNews(form)
      else if (editing) await updateNews(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  return (
    <>
      <DataTable cols={['Title', 'Source', 'Topic', 'Published', 'Featured']} onAdd={() => { setForm(emptyNews); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink max-w-[200px] truncate">{String(r.title)}</td>
            <td className="px-3 py-2 text-ash">{String(r.source)}</td>
            <td className="px-3 py-2 text-ash">{String(r.topic ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.published_at ?? '—').slice(0, 10)}</td>
            <td className="px-3 py-2">{r.featured ? <Check size={12} className="text-fern" /> : null}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Article' : 'Edit Article'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <div className="col-span-2"><Field label="Title *"><Input value={form.title} onChange={f('title')} required /></Field></div>
          <Field label="Source *"><Input value={form.source} onChange={f('source')} required /></Field>
          <Field label="Topic"><Input value={form.topic} onChange={f('topic')} /></Field>
          <Field label="URL"><Input value={form.url} onChange={f('url')} /></Field>
          <Field label="Published At"><Input value={form.published_at} onChange={f('published_at')} type="date" /></Field>
          <div className="col-span-2"><Field label="Excerpt"><Textarea value={form.excerpt} onChange={f('excerpt')} rows={3} /></Field></div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(p => ({ ...p, featured: e.target.checked }))} className="accent-pine" />
            <label className="text-sm text-ink">Featured</label>
          </div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.title)} onConfirm={async () => { startTransition(async () => { await deleteNews(String(deleting.id)); setRows(r => r.filter(x => x.id !== deleting.id)); setDeleting(null) }) }} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── Firms tab ───────────────────────────────────────────────────────────────

const emptyFirm: FirmFormData = { name: '', type: 'Consulting', trend: 'Stable', hiring_status: '', editorial_note: '', opportunity_note: '', risk_note: '', website: '' }

function FirmsTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<FirmFormData>(emptyFirm)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const f = (k: keyof FirmFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({ name: String(row.name ?? ''), type: String(row.type ?? 'Consulting'), trend: (row.trend as FirmFormData['trend']) ?? 'Stable', hiring_status: String(row.hiring_status ?? ''), editorial_note: String(row.editorial_note ?? ''), opportunity_note: String(row.opportunity_note ?? ''), risk_note: String(row.risk_note ?? ''), website: String(row.website ?? '') })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createFirm(form)
      else if (editing) await updateFirm(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  return (
    <>
      <DataTable cols={['Name', 'Type', 'Trend', 'Hiring Status']} onAdd={() => { setForm(emptyFirm); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink">{String(r.name)}</td>
            <td className="px-3 py-2 text-ash">{String(r.type ?? '—')}</td>
            <td className="px-3 py-2">
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', r.trend === 'Growing' ? 'bg-green-50 text-green-700' : r.trend === 'Contracting' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                {String(r.trend ?? '—')}
              </span>
            </td>
            <td className="px-3 py-2 text-ash max-w-[150px] truncate">{String(r.hiring_status ?? '—')}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add Firm' : 'Edit Firm'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <Field label="Name *"><Input value={form.name} onChange={f('name')} required /></Field>
          <Field label="Type"><Select value={form.type} onChange={f('type')} options={['INGO', 'Consulting', 'Local NGO', 'Research']} /></Field>
          <Field label="Trend"><Select value={form.trend} onChange={f('trend')} options={['Growing', 'Stable', 'Contracting']} /></Field>
          <Field label="Website"><Input value={form.website} onChange={f('website')} /></Field>
          <div className="col-span-2"><Field label="Hiring Status"><Input value={form.hiring_status} onChange={f('hiring_status')} placeholder="Actively hiring — senior roles in WASH and governance" /></Field></div>
          <div className="col-span-2"><Field label="Editorial Note"><Textarea value={form.editorial_note} onChange={f('editorial_note')} /></Field></div>
          <div className="col-span-2"><Field label="Opportunity Note"><Textarea value={form.opportunity_note} onChange={f('opportunity_note')} /></Field></div>
          <div className="col-span-2"><Field label="Risk Note"><Textarea value={form.risk_note} onChange={f('risk_note')} /></Field></div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.name)} onConfirm={async () => { startTransition(async () => { await deleteFirm(String(deleting.id)); setRows(r => r.filter(x => x.id !== deleting.id)); setDeleting(null) }) }} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── PSDP Schemes tab ────────────────────────────────────────────────────────

const emptyPsdp: PsdpSchemeFormData = {
  scheme_id: '', title: '', ministry: '', executing_agency: '', province: '',
  sector: '', sub_sector: '', source: 'federal_psdp', fiscal_year: '2024-25',
  allocation_bn: '', released_bn: '', utilized_bn: '', execution_pct: '', physical_progress_pct: '',
  implementation_stage: 'mobilization', risk_level: 'medium',
  is_slow_moving: false, is_revised: false, is_under_utilized: false,
  is_donor_linked: false, donor_name: '', donor_loan_pct: '',
  implementer: '', implementer_type: '', implementer_note: '',
  opportunity_type: 'none', opportunity_window: '', ta_value_estimate_m: '',
  donor_perspective: '', firm_perspective: '', implementer_perspective: '',
  warning_signals: '', source_url: '', featured: false,
}

function BoolField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="accent-pine" />
      <span className="text-ash">{label}</span>
    </label>
  )
}

function PsdpTab({ data }: { data: AnyRecord[] }) {
  const [rows, setRows] = useState(data)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [editing, setEditing] = useState<AnyRecord | null>(null)
  const [form, setForm] = useState<PsdpSchemeFormData>(emptyPsdp)
  const [deleting, setDeleting] = useState<AnyRecord | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const f = (k: keyof PsdpSchemeFormData) => (v: string) => setForm(p => ({ ...p, [k]: v }))
  const fb = (k: keyof PsdpSchemeFormData) => (v: boolean) => setForm(p => ({ ...p, [k]: v }))

  function openEdit(row: AnyRecord) {
    setEditing(row)
    setForm({
      scheme_id: String(row.scheme_id ?? ''), title: String(row.title ?? ''),
      ministry: String(row.ministry ?? ''), executing_agency: String(row.executing_agency ?? ''),
      province: String(row.province ?? ''), sector: String(row.sector ?? ''),
      sub_sector: String(row.sub_sector ?? ''), source: String(row.source ?? 'federal_psdp'),
      fiscal_year: String(row.fiscal_year ?? '2024-25'),
      allocation_bn: String(row.allocation_bn ?? ''), released_bn: String(row.released_bn ?? ''),
      utilized_bn: String(row.utilized_bn ?? ''), execution_pct: String(row.execution_pct ?? ''),
      physical_progress_pct: String(row.physical_progress_pct ?? ''),
      implementation_stage: String(row.implementation_stage ?? 'mobilization'),
      risk_level: String(row.risk_level ?? 'medium'),
      is_slow_moving: Boolean(row.is_slow_moving), is_revised: Boolean(row.is_revised),
      is_under_utilized: Boolean(row.is_under_utilized), is_donor_linked: Boolean(row.is_donor_linked),
      donor_name: String(row.donor_name ?? ''), donor_loan_pct: String(row.donor_loan_pct ?? ''),
      implementer: String(row.implementer ?? ''), implementer_type: String(row.implementer_type ?? ''),
      implementer_note: String(row.implementer_note ?? ''),
      opportunity_type: String(row.opportunity_type ?? 'none'),
      opportunity_window: String(row.opportunity_window ?? ''),
      ta_value_estimate_m: String(row.ta_value_estimate_m ?? ''),
      donor_perspective: String(row.donor_perspective ?? ''),
      firm_perspective: String(row.firm_perspective ?? ''),
      implementer_perspective: String(row.implementer_perspective ?? ''),
      warning_signals: Array.isArray(row.warning_signals) ? row.warning_signals.join(', ') : '',
      source_url: String(row.source_url ?? ''), featured: Boolean(row.featured),
    })
    setModal('edit')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (modal === 'create') await createPsdpScheme(form)
      else if (editing) await updatePsdpScheme(String(editing.id), form)
      setModal(null); router.refresh()
    })
  }

  return (
    <>
      <DataTable cols={['Title', 'Ministry', 'Sector', 'Province', 'Allocation (B)', 'Exec%', 'Risk', 'Opp']} onAdd={() => { setForm(emptyPsdp); setModal('create') }} count={rows.length}>
        {rows.map(r => (
          <tr key={String(r.id)} className="hover:bg-fog/50">
            <td className="px-3 py-2 font-medium text-ink max-w-[180px] truncate">{String(r.title)}</td>
            <td className="px-3 py-2 text-ash max-w-[120px] truncate">{String(r.ministry ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.sector ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{String(r.province ?? '—')}</td>
            <td className="px-3 py-2 text-ash">{r.allocation_bn != null ? Number(r.allocation_bn).toFixed(1) : '—'}</td>
            <td className="px-3 py-2 text-ash">{r.execution_pct != null ? `${Number(r.execution_pct).toFixed(0)}%` : '—'}</td>
            <td className="px-3 py-2 text-ash capitalize">{String(r.risk_level ?? '—')}</td>
            <td className="px-3 py-2 text-ash capitalize">{String(r.opportunity_type ?? '—').replace(/_/g, ' ')}</td>
            <td className="px-3 py-2"><div className="flex gap-1.5">
              <button onClick={() => openEdit(r)} className="text-ash hover:text-pine"><Pencil size={11} /></button>
              <button onClick={() => setDeleting(r)} className="text-ash hover:text-danger"><Trash2 size={11} /></button>
            </div></td>
          </tr>
        ))}
      </DataTable>
      {modal && (
        <Modal title={modal === 'create' ? 'Add PSDP Scheme' : 'Edit PSDP Scheme'} onClose={() => setModal(null)} onSubmit={handleSubmit} isPending={isPending}>
          <Field label="Title *"><Input value={form.title} onChange={f('title')} required /></Field>
          <Field label="Scheme ID"><Input value={form.scheme_id} onChange={f('scheme_id')} placeholder="PSDP-2024-001" /></Field>
          <Field label="Ministry"><Input value={form.ministry} onChange={f('ministry')} /></Field>
          <Field label="Executing Agency"><Input value={form.executing_agency} onChange={f('executing_agency')} /></Field>
          <Field label="Province"><Input value={form.province} onChange={f('province')} /></Field>
          <Field label="Sector"><Input value={form.sector} onChange={f('sector')} /></Field>
          <Field label="Sub-Sector"><Input value={form.sub_sector} onChange={f('sub_sector')} /></Field>
          <Field label="Source"><Select value={form.source} onChange={f('source')} options={['federal_psdp', 'provincial_adp', 'special_program']} /></Field>
          <Field label="Fiscal Year"><Input value={form.fiscal_year} onChange={f('fiscal_year')} placeholder="2024-25" /></Field>
          <Field label="Allocation (PKR Bn)"><Input value={form.allocation_bn} onChange={f('allocation_bn')} type="number" /></Field>
          <Field label="Released (PKR Bn)"><Input value={form.released_bn} onChange={f('released_bn')} type="number" /></Field>
          <Field label="Utilized (PKR Bn)"><Input value={form.utilized_bn} onChange={f('utilized_bn')} type="number" /></Field>
          <Field label="Execution % (financial)"><Input value={form.execution_pct} onChange={f('execution_pct')} type="number" /></Field>
          <Field label="Physical Progress %"><Input value={form.physical_progress_pct} onChange={f('physical_progress_pct')} type="number" /></Field>
          <Field label="Implementation Stage"><Select value={form.implementation_stage} onChange={f('implementation_stage')} options={['pre_award','mobilization','early_implementation','mid_implementation','completion','post_completion','suspended','cancelled']} /></Field>
          <Field label="Risk Level"><Select value={form.risk_level} onChange={f('risk_level')} options={['low','medium','high','critical']} /></Field>
          <Field label="Opportunity Type"><Select value={form.opportunity_type} onChange={f('opportunity_type')} options={['none','ta_opportunity','supervision','monitoring_evaluation','implementation']} /></Field>
          <Field label="Implementer"><Input value={form.implementer} onChange={f('implementer')} /></Field>
          <Field label="Implementer Type"><Input value={form.implementer_type} onChange={f('implementer_type')} placeholder="TA firm, contractor, govt dept" /></Field>
          <Field label="Donor Name"><Input value={form.donor_name} onChange={f('donor_name')} /></Field>
          <Field label="Donor Loan %"><Input value={form.donor_loan_pct} onChange={f('donor_loan_pct')} type="number" /></Field>
          <Field label="TA Value Est. (USD M)"><Input value={form.ta_value_estimate_m} onChange={f('ta_value_estimate_m')} type="number" /></Field>
          <Field label="Source URL"><Input value={form.source_url} onChange={f('source_url')} /></Field>
          <div className="col-span-2 flex flex-wrap gap-4">
            <BoolField label="Slow-Moving" value={form.is_slow_moving} onChange={fb('is_slow_moving')} />
            <BoolField label="Revised" value={form.is_revised} onChange={fb('is_revised')} />
            <BoolField label="Under-Utilized" value={form.is_under_utilized} onChange={fb('is_under_utilized')} />
            <BoolField label="Donor-Linked" value={form.is_donor_linked} onChange={fb('is_donor_linked')} />
            <BoolField label="Featured" value={form.featured} onChange={fb('featured')} />
          </div>
          <div className="col-span-2"><Field label="Opportunity Window"><Input value={form.opportunity_window} onChange={f('opportunity_window')} placeholder="Supervision contract expected Q3 2025" /></Field></div>
          <div className="col-span-2"><Field label="Warning Signals (comma-separated)"><Input value={form.warning_signals} onChange={f('warning_signals')} placeholder="slow_disbursement, land_acquisition" /></Field></div>
          <div className="col-span-2"><Field label="Firm Perspective"><Textarea value={form.firm_perspective} onChange={f('firm_perspective')} /></Field></div>
          <div className="col-span-2"><Field label="Donor Perspective"><Textarea value={form.donor_perspective} onChange={f('donor_perspective')} /></Field></div>
          <div className="col-span-2"><Field label="Implementer Perspective"><Textarea value={form.implementer_perspective} onChange={f('implementer_perspective')} /></Field></div>
          <div className="col-span-2"><Field label="Implementer Note"><Textarea value={form.implementer_note} onChange={f('implementer_note')} /></Field></div>
        </Modal>
      )}
      {deleting && <ConfirmDelete label={String(deleting.title)} onConfirm={async () => { startTransition(async () => { await deletePsdpScheme(String(deleting.id)); setRows(r => r.filter(x => x.id !== deleting.id)); setDeleting(null) }) }} onCancel={() => setDeleting(null)} />}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ['Projects', 'Tenders', 'Donors', 'Jobs', 'News', 'Firms', 'PSDP'] as const
type Tab = typeof TABS[number]

interface Props {
  projects: AnyRecord[]
  tenders:  AnyRecord[]
  donors:   AnyRecord[]
  jobs:     AnyRecord[]
  news:     AnyRecord[]
  firms:    AnyRecord[]
  psdp:     AnyRecord[]
}

export function ContentManager({ projects, tenders, donors, jobs, news, firms, psdp }: Props) {
  const [tab, setTab] = useState<Tab>('Projects')

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Content Manager</h1>
        <p className="text-sm text-ash mt-0.5">Add, edit, and delete data across all modules</p>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 border-b border-silver flex-wrap">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-pine text-pine'
                : 'border-transparent text-ash hover:text-ink'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Projects' && <ProjectsTab data={projects} />}
      {tab === 'Tenders'  && <TendersTab  data={tenders} />}
      {tab === 'Donors'   && <DonorsTab   data={donors} />}
      {tab === 'Jobs'     && <JobsTab     data={jobs} />}
      {tab === 'News'     && <NewsTab     data={news} />}
      {tab === 'Firms'    && <FirmsTab    data={firms} />}
      {tab === 'PSDP'     && <PsdpTab     data={psdp} />}
    </div>
  )
}
