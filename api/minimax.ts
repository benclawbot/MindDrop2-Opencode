/**
 * Serverless proxy for the MiniMax API.
 *
 * Vercel auto-detects files under /api as serverless functions. The key is
 * read from `MINIMAX_API_KEY` (server-side only — never bundled to the client)
 * and used to forward chat completion requests from the browser.
 *
 * Why this exists: VITE_* env vars get bundled into the client JS and shipped
 * to every visitor. A paid API key in a public bundle is a billing risk. This
 * proxy keeps the key server-side.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY
const MINIMAX_BASE_URL = process.env.MINIMAX_BASE_URL || 'https://api.MiniMax.chat/v1'
const MINIMAX_MODEL = process.env.MINIMAX_MODEL || 'MiniMax-M2.7'

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'

const setCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!MINIMAX_API_KEY) {
    return res.status(500).json({
      error:
        'MINIMAX_API_KEY is not configured on the server. Set it with: vercel env add MINIMAX_API_KEY',
    })
  }

  try {
    const body = req.body as {
      messages?: Array<{ role: string; content: string }>
      temperature?: number
      max_tokens?: number
      response_format?: { type: string }
    }

    if (!body?.messages || !Array.isArray(body.messages)) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    const upstream = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: MINIMAX_MODEL,
        messages: body.messages,
        temperature: body.temperature ?? 0.7,
        ...(body.max_tokens !== undefined ? { max_tokens: body.max_tokens } : {}),
        ...(body.response_format ? { response_format: body.response_format } : {}),
      }),
    })

    const text = await upstream.text()
    let data: unknown
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `MiniMax upstream ${upstream.status}`,
        details: data,
      })
    }

    return res.status(200).json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ error: 'Proxy failure', details: message })
  }
}
