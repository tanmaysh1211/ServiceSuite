import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // other options: llama3-8b, mixtral-8x7b
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 512,
      }),
    })

    const data = await response.json()
    return NextResponse.json({ result: data.choices[0].message.content })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
