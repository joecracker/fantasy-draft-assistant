// Multi-provider AI key support.
// Lets the user bring their own key from any supported provider and has the
// app route analysis calls through whichever provider they chose.
// Keys are stored only on this device (localStorage) and never sent anywhere
// except the chosen provider's public API.

export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter';

export interface AiProviderInfo {
  id: AiProvider;
  label: string;
  /** Default model id used for this provider. */
  model: string;
  /** Short hint shown in the UI about where to get a key. */
  keyHint: string;
  keyPrefix: string;
}

export const AI_PROVIDERS: AiProviderInfo[] = [
  {
    id: 'gemini',
    label: 'Google Gemini',
    model: 'gemini-3.5-flash',
    keyHint: 'get one free at aistudio.google.com (your own key, saved only here)',
    keyPrefix: 'AIza',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    model: 'gpt-4o-mini',
    keyHint: 'get one at platform.openai.com → API keys',
    keyPrefix: 'sk-',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    model: 'claude-3-5-sonnet-latest',
    keyHint: 'get one at console.anthropic.com → API keys',
    keyPrefix: 'sk-ant-',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    model: 'deepseek/deepseek-v4-flash',
    keyHint: 'get one at openrouter.ai → keys',
    keyPrefix: 'sk-or-',
  },
];

const STORAGE_PROVIDER = 'td_ai_provider';
const STORAGE_KEY_PREFIX = 'td_ai_key_';

export function loadAiProvider(): AiProvider {
  try {
    const saved = localStorage.getItem(STORAGE_PROVIDER) as AiProvider | null;
    if (saved && AI_PROVIDERS.some((p) => p.id === saved)) return saved;
  } catch { /* ignore */ }
  return 'gemini';
}

export function saveAiProvider(provider: AiProvider): void {
  try { localStorage.setItem(STORAGE_PROVIDER, provider); } catch { /* ignore */ }
}

export function loadAiKey(provider: AiProvider): string {
  try { return localStorage.getItem(`${STORAGE_KEY_PREFIX}${provider}`) || ''; } catch { return ''; }
}

export function saveAiKey(provider: AiProvider, key: string): void {
  try {
    if (key.trim()) localStorage.setItem(`${STORAGE_KEY_PREFIX}${provider}`, key.trim());
    else localStorage.removeItem(`${STORAGE_KEY_PREFIX}${provider}`);
  } catch { /* ignore */ }
}

export interface AiCallOptions {
  provider: AiProvider;
  apiKey: string;
  userPrompt: string;
  systemInstruction?: string;
  /** Ask the model to return strict JSON. Providers that support it get a JSON
   *  response mode; the generic path strips fenced code blocks as a fallback. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

async function extractJsonText(text: string): Promise<string> {
  const t = text.trim();
  // Strip a markdown code block if the model wrapped it.
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : t;
  if (candidate.startsWith('{') || candidate.startsWith('[')) return candidate;
  return candidate;
}

/** Calls the chosen provider's API and returns plain text from the reply. */
export async function callAi(opts: AiCallOptions): Promise<string> {
  const info = AI_PROVIDERS.find((p) => p.id === opts.provider)!;
  const model = opts.model || info.model;
  const temperature = opts.temperature ?? 0.4;
  const maxTokens = opts.maxTokens ?? 1200;

  switch (opts.provider) {
    case 'gemini': {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(opts.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: opts.userPrompt }] }],
            ...(opts.systemInstruction ? { systemInstruction: { parts: [{ text: opts.systemInstruction }] } } : {}),
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              ...(opts.json ? { responseMimeType: 'application/json' } : {}),
            },
          }),
        }
      );
      if (!res.ok) {
        let detail = '';
        try { const e = await res.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `Gemini returned status ${res.status}.`);
      }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: unknown) => (p as { text?: string }).text).join('') || '';
      if (!text) throw new Error('Gemini returned an empty response.');
      return opts.json ? extractJsonText(text) : text;
    }

    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(opts.systemInstruction ? [{ role: 'system', content: opts.systemInstruction }] : []),
            { role: 'user', content: opts.userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      if (!res.ok) {
        let detail = '';
        try { const e = await res.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `OpenAI returned status ${res.status}.`);
      }
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content || '';
      if (!text) throw new Error('OpenAI returned an empty response.');
      return opts.json ? extractJsonText(text) : text;
    }

    case 'anthropic': {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': opts.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: opts.systemInstruction || undefined,
          messages: [{ role: 'user', content: opts.userPrompt }],
        }),
      });
      if (!res.ok) {
        let detail = '';
        try { const e = await res.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `Anthropic returned status ${res.status}.`);
      }
      const data = await res.json();
      const text: string = data?.content?.filter((b: { type?: string }) => b.type === 'text').map((b: { text?: string }) => b.text).join('') || '';
      if (!text) throw new Error('Anthropic returned an empty response.');
      return opts.json ? extractJsonText(text) : text;
    }

    case 'openrouter': {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(opts.systemInstruction ? [{ role: 'system', content: opts.systemInstruction }] : []),
            { role: 'user', content: opts.userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
        }),
      });
      if (!res.ok) {
        let detail = '';
        try { const e = await res.json(); detail = e?.error?.message || ''; } catch { /* ignore */ }
        throw new Error(detail || `OpenRouter returned status ${res.status}.`);
      }
      const data = await res.json();
      const text: string = data?.choices?.[0]?.message?.content || '';
      if (!text) throw new Error('OpenRouter returned an empty response.');
      return opts.json ? extractJsonText(text) : text;
    }

    default:
      throw new Error('Unknown AI provider.');
  }
}