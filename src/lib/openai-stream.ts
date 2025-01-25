import { createParser } from 'eventsource-parser';

export async function OpenAIStream(params: {
  model: string;
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  temperature?: number;
  stream?: boolean;
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const stream = new ReadableStream({
    async start(controller) {
      const parser = createParser({
        onEvent(event) {
          const data = event.data;
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0]?.delta?.content || '';
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        },
      });

      for await (const chunk of res.body as any) {
        const text = decoder.decode(chunk);
        parser.feed(text);
      }
    },
  });

  return stream;
}