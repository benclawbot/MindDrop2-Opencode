/**
 * MiniMax API client (browser).
 *
 * Routes requests through the local serverless proxy at /api/minimax. The
 * API key never reaches the browser — it lives in MINIMAX_API_KEY on the
 * server (set via `vercel env add MINIMAX_API_KEY`).
 *
 * In dev, Vite proxies /api to the same path so this works without extra
 * config. See vite.config.ts for the dev proxy.
 */

export const MODEL = 'MiniMax-M2.7'
export const PROXY_PATH = '/api/minimax'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatOptions {
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

export interface ChatResult {
  text: string
  raw: unknown
}

export const chat = async (
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResult> => {
  const body: Record<string, unknown> = {
    messages,
    temperature: options.temperature ?? 0.7,
  }
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (options.jsonMode) body.response_format = { type: 'json_object' }

  const res = await fetch(PROXY_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`MiniMax proxy error ${res.status}: ${errBody.slice(0, 200) || res.statusText}`)
  }

  const data = await res.json()
  const text: string = data?.choices?.[0]?.message?.content ?? ''
  return { text, raw: data }
}

export const chatJSON = async <T = unknown>(
  messages: ChatMessage[],
  options: Omit<ChatOptions, 'jsonMode'> = {}
): Promise<T> => {
  const result = await chat(messages, { ...options, jsonMode: true })
  const text = result.text.trim()
  try {
    return JSON.parse(text) as T
  } catch (e) {
    throw new Error(`MiniMax returned non-JSON: ${text.slice(0, 200)}`)
  }
}
