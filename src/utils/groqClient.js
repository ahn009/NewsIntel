const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'groq/compound-mini';
const MODEL_VERSION = '2025-07-23';
const KEY_STORAGE = 'ni_groq_key';
const HISTORY_MESSAGE_LIMIT = 2;
const HISTORY_TOTAL_CHARS = 4000;
const HISTORY_MESSAGE_CHARS = 2000;

function compactHistory(history) {
  const truncationNote = '\n[Earlier response truncated]';
  const recent = history.slice(-HISTORY_MESSAGE_LIMIT).map(message => {
    const content = String(message.content || '');
    return {
      role: message.role,
      content: content.length > HISTORY_MESSAGE_CHARS
        ? `${content.slice(0, HISTORY_MESSAGE_CHARS - truncationNote.length)}${truncationNote}`
        : content,
    };
  });

  const kept = [];
  let totalChars = 0;

  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    if (totalChars + message.content.length > HISTORY_TOTAL_CHARS) break;
    kept.unshift(message);
    totalChars += message.content.length;
  }

  while (kept[0]?.role === 'assistant') kept.shift();
  return kept;
}

function getKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
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

function getSystemPrompt() {
  const now = new Date();
  return `You are NewsIntel, a concise personal news analyst with live web search.

Current UTC time: ${now.toISOString()}
User-local time: ${getDateContext()}

RULES:
1. Search the web and report only developments from the last 24 hours.
2. For every story: what happened, who, why it matters, what's next.
3. Cover the 3-5 most important stories concisely.
4. Include automatic source citations and never invent publication times.
5. Prefer reliable primary reporting and major news outlets.
6. End with bold **Key Takeaway** summarizing the situation in 2 sentences.`;
}

export async function askGroq(question, history, onChunk = () => {}, signal) {
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
    { role: 'system', content: getSystemPrompt() },
    ...compactHistory(history),
    { role: 'user', content: userContent },
  ];

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'Groq-Model-Version': MODEL_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: 2048,
      messages,
      compound_custom: {
        tools: {
          enabled_tools: ['web_search'],
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('INVALID_KEY');
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after');
      throw new Error(retryAfter
        ? `Groq free-tier limit reached. Try again in ${retryAfter} seconds.`
        : 'Groq free-tier limit reached. Please try again shortly.');
    }
    if (res.status === 413) {
      throw new Error('Groq web search produced too much source data. Try a more specific news topic.');
    }
    throw new Error(err?.error?.message || `Error ${res.status}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const answer = choice?.message?.content?.trim() || '';

  if (!answer) {
    if (choice?.finish_reason === 'length') {
      throw new Error('Groq used the full completion budget before producing an answer. Please try a shorter request.');
    }
    throw new Error('Groq completed the request without answer text. Please try again.');
  }

  onChunk(answer, answer);
  return answer;
}
