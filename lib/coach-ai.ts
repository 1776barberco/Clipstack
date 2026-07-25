import { generateText, streamText, type ModelMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

const DEFAULT_OPENAI_BASE_URL = 'https://openai.kainotomic.com/v1'
export const COACH_MODEL = (process.env.COACH_MODEL || 'gpt-5.4-mini').trim()

const FALLBACK_MODELS = (process.env.COACH_FALLBACK_MODELS || '')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

const models = Array.from(new Set([COACH_MODEL, ...FALLBACK_MODELS]))

function normalizeOpenAIBaseURL(value: string) {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  const trimmed = withProtocol.replace(/\/+$/, '')
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`
}

const openaiBaseURL = normalizeOpenAIBaseURL(process.env.OPENAI_BASE_URL || process.env.OPENAI_API_BASE_URL || DEFAULT_OPENAI_BASE_URL)
const openaiAPIKey = process.env.OPENAI_API_KEY

const coachProvider = createOpenAI({
  baseURL: openaiBaseURL,
  apiKey: openaiAPIKey,
  name: 'kainotomic-openai',
})

function getCoachModel(model: string) {
  return coachProvider(model.replace(/^openai\//, ''))
}

export function isCoachGatewayConfigured() {
  return Boolean(openaiAPIKey)
}

export function coachGatewayConfigError() {
  return 'OpenAI-compatible coach credentials are missing. Add OPENAI_API_KEY and optional OPENAI_BASE_URL in Vercel env.'
}

export function coachAIErrorMessage(error: unknown) {
  if (!isCoachGatewayConfigured()) {
    return coachGatewayConfigError()
  }

  const message = error instanceof Error ? error.message : String(error)
  if (/unauthorized|forbidden|api key|credential|authentication|oidc/i.test(message)) {
    return 'Coach provider rejected the request. Check OPENAI_API_KEY, OPENAI_BASE_URL, and model access.'
  }

  return 'Coach is temporarily unavailable.'
}

export async function generateCoachText({
  system,
  prompt,
  userId,
  signal,
}: {
  system: string
  prompt: string
  userId: string
  signal?: AbortSignal
}) {
  let lastError: unknown

  for (const model of models) {
    try {
      const result = await generateText({
        model: getCoachModel(model),
        system,
        prompt,
        temperature: 0.7,
        maxOutputTokens: 1000,
        abortSignal: signal,
        headers: {
          'X-TipJars-User': userId,
          'X-TipJars-Feature': 'coach-insights',
        },
      })

      return { text: result.text, model }
    } catch (error) {
      lastError = error
      console.error(`Coach model failed (${model}):`, {
        message: error instanceof Error ? error.message : String(error),
        hasOpenAIKey: Boolean(openaiAPIKey),
        openaiBaseURL,
      })
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Coach AI request failed')
}

export async function streamCoachText({
  system,
  messages,
  userId,
  signal,
}: {
  system: string
  messages: ModelMessage[]
  userId: string
  signal?: AbortSignal
}) {
  let lastError: unknown

  for (const model of models) {
    try {
      const result = streamText({
        model: getCoachModel(model),
        system,
        messages,
        temperature: 0.8,
        maxOutputTokens: 1000,
        abortSignal: signal,
        headers: {
          'X-TipJars-User': userId,
          'X-TipJars-Feature': 'coach-chat',
        },
      })

      return { textStream: result.textStream, model }
    } catch (error) {
      lastError = error
      console.error(`Coach stream model failed (${model}):`, error)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Coach AI stream failed')
}
