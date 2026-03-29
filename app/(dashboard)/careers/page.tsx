import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import type { Job, SalaryBenchmark, ConsultingFirm } from '@/lib/types/database'

export const metadata: Metadata = { title: 'Browse Careers' }

const SENIORITY_COLORS: Record<string, string> = {
  'Entry':   'bg-blue-50 text-blue-700',
  'Mid':     'bg-purple-50 text-purple-700',
  'Senior':  'bg-orange-50 text-orange-700',
  'Director':'bg-red-50 text-red-700',
  'UN NO':   'bg-sky-50 text-sky-700',
  'UN P3':   'bg-sky-100 text-sky-800',
}

export default async function CareersPage() {

  const supabase = await createClient()

  const [jobsRes, salariesRes, firmsRes] = await Promise.all([
    supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(30),
    supabase.from('salary_benchmarks').select('*').order('min_pkr', { ascending: true }),
    supabase.from('consulting_firms').select('name, trend, hiring_status').order('name'),
  ])

  const jobs: Job[] = jobsRes.data ?? []
  const salaries: SalaryBenchmark[] = salariesRes.data ?? []
  const firms: Pick<ConsultingFirm, 'name' | 'trend' | 'hiring_status'>[] = firmsRes.data ?? []

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Browse Careers</h1>
        <p className="text-sm text-ash mt-0.5 flex items-center gap-2">
          <span className="live-dot" />
          ReliefWeb · UN Jobs · DevNetJobs · Salary benchmarks
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open Roles', value: jobs.length, color: 'text-pine' },
          { label: 'Salary Benchmarks', value: salaries.length, color: 'text-pine' },
          { label: 'Firms Tracked', value: firms.length, color: 'text-pine' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-silver bg-card p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-ink">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Jobs */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-sm font-bold text-slate uppercase tracking-wide">Open Positions</h2>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-silver bg-card p-8 text-center">
              <div className="text-3xl mb-2">💼</div>
              <p className="text-sm text-ash">Scrapers will populate jobs from ReliefWeb, UN Jobs, and DevNetJobs</p>
            </div>
          ) : (
            jobs.map(job => (
              <div key={job.id} className="rounded-xl border border-silver bg-card p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-pine flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {job.organisation.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-ink">{job.title}</span>
                      {job.seniority && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SENIORITY_COLORS[job.seniority] ?? 'bg-fog text-ash'}`}>
                          {job.seniority}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ash flex flex-wrap gap-2">
                      <span className="font-medium text-slate">{job.organisation}</span>
                      {job.location && <span>· {job.location}</span>}
                      {job.sector && <span>· {job.sector}</span>}
                      {job.salary_label && <span className="font-semibold text-pine">· {job.salary_label}</span>}
                    </div>
                    {job.deadline && (
                      <div className="text-xs text-ash mt-1">Deadline: {formatDate(job.deadline)}</div>
                    )}
                    {job.apply_url && (
                      <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-pine hover:underline font-medium">
                        Apply ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right column — salary + firms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Salary Benchmarks */}
          {salaries.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">Salary Benchmarks (PKR/mo)</h2>
              <div className="rounded-xl border border-silver bg-card overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-silver bg-fog">
                      <th className="px-3 py-2 text-left text-ash font-semibold">Role</th>
                      <th className="px-3 py-2 text-right text-ash font-semibold">Range</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-silver">
                    {salaries.map(s => (
                      <tr key={s.id} className="hover:bg-fog/50">
                        <td className="px-3 py-2">
                          <div className="font-medium text-ink">{s.role}</div>
                          {s.level && <div className="text-ash text-[10px]">{s.level}</div>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="font-semibold text-pine">
                            {s.min_pkr && s.max_pkr
                              ? `PKR ${(s.min_pkr / 1000).toFixed(0)}K–${(s.max_pkr / 1000).toFixed(0)}K`
                              : '—'}
                          </div>
                          {s.notes && <div className="text-[10px] text-ash">{s.notes.split('.')[0]}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Firm hiring signals */}
          {firms.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate uppercase tracking-wide mb-3">Firm Hiring Signals</h2>
              <div className="space-y-2">
                {firms.map(f => (
                  <div key={f.name} className="rounded-lg border border-silver bg-card px-3 py-2.5 flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      f.trend === 'Growing' ? 'bg-fern' : f.trend === 'Contracting' ? 'bg-danger' : 'bg-amber-400'
                    }`} />
                    <span className="text-sm font-medium text-ink flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-ash truncate">{f.hiring_status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
