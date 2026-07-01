import { client } from './client'

export type DocType = 'rule' | 'qa' | 'scenario' | 'ib_field' | 'raw'

export type AiBehavior =
  | 'answer_directly'
  | 'answer_with_caveat'
  | 'ask_clarifying_question'
  | 'refer_to_advisor'

export type UserType = 'zzp'

export interface RetrievedContext {
  chunk_id: string
  source_id: string
  doc_type: DocType
  topic: string
  score: number
  text: string
  source_url: string
  ai_prompt_hint: string | null
  expected_ai_behavior: AiBehavior | null
  user_types: string[]
  is_cascade: boolean
}

export interface QueryInfo {
  question: string
  user_type: UserType | null
  result_count: number
  elapsed_ms: number
}

export interface RetrieveResponse {
  results: RetrievedContext[]
  query_info: QueryInfo
}

export interface RetrieveRequest {
  question: string
  user_type: UserType | null
}

export async function retrieveContexts(req: RetrieveRequest): Promise<RetrieveResponse> {
  const { data } = await client.post<RetrieveResponse>('/tax/phase2/retrieve/', req)
  return data
}
