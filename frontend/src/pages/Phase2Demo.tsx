import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { retrieveContexts } from '../api/retrieve'
import type { RetrievedContext, UserType } from '../api/retrieve'

const DOC_TYPE_LABELS: Record<string, string> = {
  rule: 'Rule', qa: 'Q&A', scenario: 'Scenario', ib_field: 'IB Field', raw: 'Raw',
}

const BEHAVIOR_LABELS: Record<string, string> = {
  answer_directly: 'Answer directly',
  answer_with_caveat: 'Answer with caveat',
  ask_clarifying_question: 'Ask clarifying question',
  refer_to_advisor: 'Refer to advisor',
}

const DOC_TYPE_COLORS: Record<string, string> = {
  rule: 'bg-violet-100 text-violet-700 border-violet-200',
  qa: 'bg-blue-100 text-blue-700 border-blue-200',
  scenario: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  ib_field: 'bg-amber-100 text-amber-700 border-amber-200',
  raw: 'bg-gray-100 text-gray-600 border-gray-200',
}

const BEHAVIOR_COLORS: Record<string, string> = {
  answer_directly: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  answer_with_caveat: 'bg-amber-50 text-amber-700 border-amber-200',
  ask_clarifying_question: 'bg-blue-50 text-blue-700 border-blue-200',
  refer_to_advisor: 'bg-red-50 text-red-700 border-red-200',
}

const USER_TYPES: { value: UserType | null; labelKey: string }[] = [
  { value: null, labelKey: 'any' },
  { value: 'zzp', labelKey: 'zzp' },
  { value: 'employee', labelKey: 'employee' },
  { value: 'expat', labelKey: 'expat' },
  { value: 'dga', labelKey: 'dga' },
]

const EXAMPLE_QUESTIONS: { text: string; user_type: UserType }[] = [
  { text: 'Wat is de zelfstandigenaftrek in 2026?', user_type: 'zzp' },
  { text: 'Is 2026 het laatste jaar voor de startersaftrek?', user_type: 'zzp' },
  { text: 'Ik ben DGA. Wat is het gebruikelijk loon in 2026?', user_type: 'dga' },
  { text: 'How does the 30% ruling work for expats?', user_type: 'expat' },
  { text: 'اگر ZZP‌کار هستم چقدر مالیات می‌پردازم؟', user_type: 'zzp' },
]

function safeHostname(url: string): string {
  try { return new URL(url).hostname } catch { return url }
}

const TEXT_PREVIEW_LIMIT = 320

function ResultCard({ ctx }: { ctx: RetrievedContext }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = ctx.text.length > TEXT_PREVIEW_LIMIT
  const displayText = expanded || !isLong ? ctx.text : `${ctx.text.slice(0, TEXT_PREVIEW_LIMIT)}…`

  return (
    <article className={`bg-[var(--bg)] border rounded-xl p-5 flex flex-col gap-3 ${ctx.is_cascade ? "border-[var(--accent)] border-dashed" : "border-[var(--border)]"}`}>
      <header className="flex items-center gap-2 flex-wrap">
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${DOC_TYPE_COLORS[ctx.doc_type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {DOC_TYPE_LABELS[ctx.doc_type] ?? ctx.doc_type}
        </span>
        <span className="text-xs font-semibold font-mono text-[var(--text)] opacity-60">{ctx.source_id}</span>
        {ctx.score > 0 && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)]">
            {(ctx.score * 100).toFixed(1)}%
          </span>
        )}
        {ctx.is_cascade && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-200">
            cascade
          </span>
        )}
      </header>

      {ctx.topic && (
        <p className="text-xs font-semibold text-[var(--text)] opacity-50 uppercase tracking-widest m-0">{ctx.topic}</p>
      )}

      <div>
        <p className="text-[13px] text-[var(--text)] leading-relaxed m-0 font-mono whitespace-pre-wrap">{displayText}</p>
        {isLong && (
          <button
            className="mt-1.5 text-xs text-[var(--accent)] bg-none border-none cursor-pointer p-0 font-[inherit] hover:opacity-70 transition-opacity"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? 'Show less ↑' : 'Show more ↓'}
          </button>
        )}
      </div>

      <footer className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[var(--border)]">
        <div>
          {ctx.expected_ai_behavior && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${BEHAVIOR_COLORS[ctx.expected_ai_behavior] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
              {BEHAVIOR_LABELS[ctx.expected_ai_behavior] ?? ctx.expected_ai_behavior}
            </span>
          )}
        </div>
        {ctx.source_url && (
          <a href={ctx.source_url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-[var(--text)] opacity-45 no-underline hover:opacity-80 transition-opacity">
            {safeHostname(ctx.source_url)} ↗
          </a>
        )}
      </footer>

      {ctx.ai_prompt_hint && (
        <div className="p-2.5 px-3 bg-violet-50 border border-violet-200 rounded-lg text-[13px] text-violet-700">
          <span className="font-bold text-[11px] uppercase tracking-widest block mb-1 text-violet-500">AI instruction</span>
          {ctx.ai_prompt_hint}
        </div>
      )}
    </article>
  )
}

export default function Phase2Demo() {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [userType, setUserType] = useState<UserType | null>(null)

  const { mutate, data, isPending, error, reset } = useMutation({
    mutationFn: () => retrieveContexts({ question: question.trim(), user_type: userType }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isPending) return
    reset()
    mutate()
  }

  const applyExample = (q: { text: string; user_type: UserType }) => {
    setQuestion(q.text)
    setUserType(q.user_type)
  }

  const apiError = error instanceof Error ? error.message : error ? String(error) : null

  const pillCls = (active: boolean) =>
    `px-4 py-1.5 rounded-3xl border font-[inherit] text-[13px] font-semibold cursor-pointer transition-all ${
      active
        ? "bg-[var(--accent)] border-[var(--accent)] text-white"
        : "bg-transparent border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
    }`

  return (
    <div className="max-w-[820px] mx-auto px-12 py-12 pb-24 flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent)]">{t('phase2.meta')}</span>
        <h1 className="text-[32px] font-semibold text-[var(--text-h)] m-0 -tracking-wide">{t('phase2.title')}</h1>
        <p className="text-[15px] text-[var(--text)] opacity-70 m-0 leading-relaxed">{t('phase2.subtitle')}</p>
      </header>

      {/* Query form */}
      <form className="flex flex-col gap-5 p-7 bg-[var(--bg)] border border-[var(--border)] rounded-xl" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[var(--text-h)]" htmlFor="p2-question">
            {t('phase2.question_label')}
          </label>
          <textarea
            id="p2-question"
            className="w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] font-[inherit] text-sm outline-none transition-colors focus:border-[var(--accent)] resize-none"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={t('phase2.question_placeholder')}
            rows={4}
          />
          <div className="flex flex-wrap gap-2 mt-1">
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q.text}
                type="button"
                className="px-3 py-1 rounded-full border border-[var(--border)] bg-transparent text-[12px] text-[var(--text)] cursor-pointer hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors font-[inherit]"
                onClick={() => applyExample(q)}
                title={q.text}
              >
                {q.text.length > 52 ? q.text.slice(0, 52) + '…' : q.text}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-[var(--text-h)]">{t('phase2.user_type_label')}</label>
          <div className="flex gap-2 flex-wrap">
            {USER_TYPES.map(({ value, labelKey }) => {
              const label = value ? t(`user_types.${value}`) : t('phase2.any')
              return (
                <button
                  key={labelKey}
                  type="button"
                  className={pillCls(userType === value)}
                  onClick={() => setUserType(value)}
                  aria-pressed={userType === value}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2.5 px-7 py-3 bg-[var(--accent)] text-white border-none rounded-lg font-[inherit] text-[15px] font-medium cursor-pointer self-start hover:opacity-85 disabled:opacity-45 disabled:cursor-not-allowed transition-opacity"
          disabled={isPending || !question.trim()}
        >
          {isPending && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          )}
          {isPending ? t('phase2.retrieving') : t('phase2.retrieve')}
        </button>
      </form>

      {apiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" role="alert">
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {data && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[13px] text-[var(--text)] opacity-60">
            <span>{t('phase2.results_count', { count: data.query_info.result_count })}</span>
            <span>·</span>
            <span>{data.query_info.elapsed_ms} ms</span>
            {data.query_info.user_type && (
              <>
                <span>·</span>
                <span className="font-semibold text-[var(--accent)]">{data.query_info.user_type}</span>
              </>
            )}
          </div>

          {data.query_info.result_count === 0 ? (
            <p className="text-[var(--text)] opacity-50 text-center py-8">{t('phase2.no_results')}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.results.map(ctx => (
                <ResultCard key={ctx.chunk_id} ctx={ctx} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
