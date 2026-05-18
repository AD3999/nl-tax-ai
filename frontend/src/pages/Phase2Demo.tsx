import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { retrieveContexts } from '../api/retrieve'
import type { RetrievedContext, UserType } from '../api/retrieve'
import styles from './Phase2Demo.module.css'

// ── Constants ─────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  rule: 'Rule',
  qa: 'Q&A',
  scenario: 'Scenario',
  ib_field: 'IB Field',
  raw: 'Raw',
}

const BEHAVIOR_LABELS: Record<string, string> = {
  answer_directly: 'Answer directly',
  answer_with_caveat: 'Answer with caveat',
  ask_clarifying_question: 'Ask clarifying question',
  refer_to_advisor: 'Refer to advisor',
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// ── ResultCard ────────────────────────────────────────────────────────────────

const TEXT_PREVIEW_LIMIT = 320

function ResultCard({ ctx }: { ctx: RetrievedContext }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = ctx.text.length > TEXT_PREVIEW_LIMIT
  const displayText = expanded || !isLong ? ctx.text : `${ctx.text.slice(0, TEXT_PREVIEW_LIMIT)}…`

  return (
    <article className={`${styles.card} ${ctx.is_cascade ? styles.cardCascade : ''}`}>
      <header className={styles.cardHeader}>
        <span className={`${styles.docBadge} ${styles[`docBadge_${ctx.doc_type}`]}`}>
          {DOC_TYPE_LABELS[ctx.doc_type] ?? ctx.doc_type}
        </span>
        <span className={styles.sourceId}>{ctx.source_id}</span>
        {ctx.score > 0 && (
          <span className={styles.scorePill}>{(ctx.score * 100).toFixed(1)}%</span>
        )}
        {ctx.is_cascade && <span className={styles.cascadePill}>cascade</span>}
      </header>

      {ctx.topic && <p className={styles.topic}>{ctx.topic}</p>}

      <div className={styles.textBlock}>
        <p className={styles.text}>{displayText}</p>
        {isLong && (
          <button className={styles.expandBtn} onClick={() => setExpanded(v => !v)}>
            {expanded ? 'Show less ↑' : 'Show more ↓'}
          </button>
        )}
      </div>

      <footer className={styles.cardFooter}>
        <div className={styles.footerLeft}>
          {ctx.expected_ai_behavior && (
            <span className={`${styles.behaviorBadge} ${styles[`behavior_${ctx.expected_ai_behavior}`]}`}>
              {BEHAVIOR_LABELS[ctx.expected_ai_behavior] ?? ctx.expected_ai_behavior}
            </span>
          )}
        </div>
        {ctx.source_url && (
          <a
            href={ctx.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.sourceLink}
          >
            {safeHostname(ctx.source_url)} ↗
          </a>
        )}
      </footer>

      {ctx.ai_prompt_hint && (
        <div className={styles.aiHint}>
          <span className={styles.aiHintLabel}>AI instruction</span>
          {ctx.ai_prompt_hint}
        </div>
      )}
    </article>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const apiError =
    error instanceof Error ? error.message : error ? String(error) : null

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <span className={styles.headerMeta}>{t('phase2.meta')}</span>
        <h1 className={styles.title}>{t('phase2.title')}</h1>
        <p className={styles.subtitle}>{t('phase2.subtitle')}</p>
      </header>

      {/* Query form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="p2-question">
            {t('phase2.question_label')}
          </label>
          <textarea
            id="p2-question"
            className={styles.textarea}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={t('phase2.question_placeholder')}
            rows={4}
          />
          <div className={styles.exampleRow} aria-label="Example questions">
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q.text}
                type="button"
                className={styles.examplePill}
                onClick={() => applyExample(q)}
                title={q.text}
              >
                {q.text.length > 52 ? q.text.slice(0, 52) + '…' : q.text}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('phase2.user_type_label')}</label>
          <div className={styles.pillRow} role="group" aria-label="User type">
            {USER_TYPES.map(({ value, labelKey }) => {
              const label = value
                ? t(`user_types.${value}`)
                : t('phase2.any')
              return (
                <button
                  key={labelKey}
                  type="button"
                  className={`${styles.pill} ${userType === value ? styles.pillActive : ''}`}
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
          className={styles.submitBtn}
          disabled={isPending || !question.trim()}
        >
          {isPending && <span className={styles.spinner} aria-hidden />}
          {isPending ? t('phase2.retrieving') : t('phase2.retrieve')}
        </button>
      </form>

      {/* Error state */}
      {apiError && (
        <div className={styles.errorBanner} role="alert">
          <strong>Error:</strong> {apiError}
        </div>
      )}

      {/* Results */}
      {data && (
        <section className={styles.results}>
          <div className={styles.statsBar}>
            <span className={styles.statsCount}>
              {t('phase2.results_count', { count: data.query_info.result_count })}
            </span>
            <span className={styles.statsSep}>·</span>
            <span className={styles.statsDuration}>{data.query_info.elapsed_ms} ms</span>
            {data.query_info.user_type && (
              <>
                <span className={styles.statsSep}>·</span>
                <span className={styles.statsUserType}>{data.query_info.user_type}</span>
              </>
            )}
          </div>

          {data.query_info.result_count === 0 ? (
            <p className={styles.emptyState}>{t('phase2.no_results')}</p>
          ) : (
            <div className={styles.resultList}>
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
