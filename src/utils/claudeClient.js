const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'perplexity/sonar';

function getKey() {
  return (
    import.meta.env.VITE_OR_KEY ||
    localStorage.getItem('ni_or_key') ||
    ''
  );
}

function getDateContext() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' at ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function expandQuery(question) {
  const q = question.trim().toLowerCase();

  const countryMap = {
    'pakistan': 'latest news Pakistan today politics economy security',
    'india': 'latest news India today politics economy',
    'usa': 'latest news United States America today politics economy',
    'us': 'latest news United States America today',
    'china': 'latest news China today politics economy Taiwan',
    'uk': 'latest news United Kingdom Britain today',
    'iran': 'latest news Iran today politics nuclear',
    'israel': 'latest news Israel today conflict Gaza',
    'russia': 'latest news Russia today Ukraine war politics',
    'ukraine': 'latest news Ukraine today war Russia',
    'afghanistan': 'latest news Afghanistan today Taliban',
    'turkey': 'latest news Turkey today politics economy',
    'saudi': 'latest news Saudi Arabia today politics oil',
  };

  const topicMap = {
    'tech': 'latest technology news today AI software hardware',
    'technology': 'latest technology news today AI startups',
    'ai': 'latest artificial intelligence news today new models releases',
    'business': 'latest business markets economy news today',
    'markets': 'latest stock market financial news today',
    'economy': 'latest global economy inflation trade news today',
    'sports': 'latest sports news results today',
    'crypto': 'latest cryptocurrency Bitcoin news today',
    'climate': 'latest climate environment news today',
    'health': 'latest health medical news today',
    'politics': 'latest global political news today elections government',
    'war': 'latest war conflict military news today',
    'world': 'top world news stories today international',
  };

  if (countryMap[q]) return countryMap[q];
  if (topicMap[q]) return topicMap[q];

  if (question.split(' ').length <= 2) {
    return `latest news about ${question} today ${new Date().getFullYear()}`;
  }

  return question;
}

const SYSTEM = `You are NewsIntel, a personal AI news analyst with live internet access.

CRITICAL RULES:
1. ONLY report news from the last 24 hours. If you cannot find news from today, say "I couldn't find news from today on this topic" — never give old news as if it's current.
2. For EVERY story include: what happened, who is involved, why it matters, what happens next.
3. Cover 4-6 stories minimum per response.
4. Write enough detail that the user NEVER needs to open the original article.
5. Always cite source and recency: "Reuters reported 3 hours ago...", "BBC this morning..."
6. End every response with a bold **Key Takeaway** summarizing the overall situation in 2 sentences.

FORMAT per story:
**[Story Headline]**
What happened: [2-3 sentences with specific facts, names, numbers]
Why it matters: [2 sentences on impact/significance]
What's next: [1 sentence on what to watch for]
Source: [outlet name + time]`;

export async function askClaude(question, history, onChunk = () => {}) {
  const key = getKey();
  if (!key) throw new Error('NO_KEY');

  const dateContext = getDateContext();
  const expandedQuery = expandQuery(question);

  const userContent = expandedQuery !== question
    ? `Current date and time: ${dateContext}

The user asked: "${question}"
Search for: ${expandedQuery}

Find the latest news from TODAY only and give detailed coverage.`
    : `Current date and time: ${dateContext}

${question}

Find the latest news from TODAY only and give detailed coverage.`;

  const messages = [
    { role: 'system', content: SYSTEM },
    ...history,
    { role: 'user', content: userContent },
  ];

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'NewsIntel',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      stream: true,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('NO_KEY');
    throw new Error(err?.error?.message || `Error ${res.status}`);
  }

  if (!res.body) throw new Error('Streaming response is not available');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  const processLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data: ')) return false;

    const data = trimmed.slice(6);
    if (data === '[DONE]') return true;

    try {
      const parsed = JSON.parse(data);
      const token = parsed.choices?.[0]?.delta?.content || '';
      if (token) {
        fullText += token;
        onChunk(token, fullText);
      }
    } catch {
      // Ignore malformed stream chunks.
    }

    return false;
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      buffer += decoder.decode();
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (processLine(line)) return fullText;
    }
  }

  if (buffer && processLine(buffer)) return fullText;

  if (!fullText) throw new Error('Empty response from model');
  return fullText;
}
