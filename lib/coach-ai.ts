import { generateText, streamText, type ModelMessage } from 'ai'

export const COACH_MODEL = (process.env.COACH_MODEL || 'anthropic/claude-sonnet-4.6').trim()

const FALLBACK_MODELS = (process.env.COACH_FALLBACK_MODELS || 'openai/gpt-5.4,google/gemini-2.5-flash')
  .split(',')
  .map((model) => model.trim())
  .filter(Boolean)

const models = Array.from(new Set([COACH_MODEL, ...FALLBACK_MODELS]))

export function isCoachGatewayConfigured() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
}

export function coachGatewayConfigError() {
  return 'AI Gateway credentials are missing. Add AI_GATEWAY_API_KEY in Vercel env or enable Vercel OIDC for AI Gateway.'
}

export function coachAIErrorMessage(error: unknown) {
  if (!isCoachGatewayConfigured()) {
    return coachGatewayConfigError()
  }

  const message = error instanceof Error ? error.message : String(error)
  if (/unauthorized|forbidden|api key|credential|authentication|oidc/i.test(message)) {
    return 'AI Gateway rejected the request. Check AI_GATEWAY_API_KEY or Vercel AI Gateway project access.'
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
        model,
        system,
        prompt,
        temperature: 0.7,
        maxOutputTokens: 1000,
        abortSignal: signal,
        providerOptions: {
          gateway: {
            user: userId,
            tags: ['app:tipjars', 'feature:coach-insights'],
          },
        },
      })

      return { text: result.text, model }
    } catch (error) {
      lastError = error
      console.error(`Coach model failed (${model}):`, {
        message: error instanceof Error ? error.message : String(error),
        hasGatewayKey: Boolean(process.env.AI_GATEWAY_API_KEY),
        hasOidcToken: Boolean(process.env.VERCEL_OIDC_TOKEN),
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
        model,
        system,
        messages,
        temperature: 0.8,
        maxOutputTokens: 1000,
        abortSignal: signal,
        providerOptions: {
          gateway: {
            user: userId,
            tags: ['app:tipjars', 'feature:coach-chat'],
          },
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
