const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function generateNewsArticle(notes: string): Promise<{ title: string; body: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const systemPrompt = `You are a financial news writer. Given rough notes or bullet points from an editor, write a short professional financial news article (2-4 paragraphs). Output ONLY valid JSON with two keys: "title" (string, headline) and "body" (string, article text). No markdown, no code fences, no extra text.`

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: notes || 'Write a brief market update.' },
      ],
      temperature: 0.4,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${response.status} ${err}`)
  }

  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) throw new Error('Empty response from Groq')

  try {
    const parsed = JSON.parse(content) as { title?: string; body?: string }
    return {
      title: typeof parsed.title === 'string' ? parsed.title : 'Market Update',
      body: typeof parsed.body === 'string' ? parsed.body : content,
    }
  } catch {
    return { title: 'Market Update', body: content }
  }
}
