// Supabase Edge Function: baggio-chat
// Proxies chat requests to Claude (Haiku) for Baggio, the AI investing advisor.
// POST /functions/v1/baggio-chat
// Body: { messages, context, mode }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TASK_CATALOG = `
Available task_key values (select only from this list):
- swipe_10: Swipe on 10 stocks (50 XP, category: swipe)
- watchlist_3_sectors: Add stocks from 3 different sectors to watchlist (75 XP, category: watchlist)
- add_etf: Add an ETF to watchlist (50 XP, category: watchlist)
- make_deposit: Make your first deposit (100 XP, category: portfolio)
- first_buy: Buy your first stock (150 XP, category: portfolio)
- portfolio_3_holdings: Hold 3 or more different stocks (200 XP, category: portfolio)
- portfolio_3_sectors: Diversify holdings across 3 sectors (125 XP, category: portfolio)
- hold_dividend_7days: Hold a dividend-paying stock for 7 days (100 XP, category: portfolio)
- swipe_25_sectors: Swipe on stocks from 5 or more different sectors (100 XP, category: swipe)
- complete_learn_module: Complete a lesson in the Learn tab (30 XP, category: learn)
`.trim();

const ONBOARDING_QUESTIONS: Record<string, string> = {
  greeting:   'greeting',
  experience: 'What is your experience level with investing? (The user will choose: Beginner, Novice, or Advanced)',
  goal:       'What is your primary investing goal? (The user will choose: Wealth Building, Retirement, Dividend Income, or Speculation)',
  risk:       'What is your risk tolerance? (The user will choose: Conservative, Moderate, or Aggressive)',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestContext {
  experience?: string;
  risk?: string;
  goal?: string;
  planState: 'onboarding' | 'active';
  onboardingStep?: string;
  portfolioSummary?: string;
  watchlistCount?: number;
}

function buildSystemPrompt(ctx: RequestContext, mode: string): string {
  const profileLines: string[] = [];
  if (ctx.experience) profileLines.push(`Experience: ${ctx.experience}`);
  if (ctx.risk) profileLines.push(`Risk tolerance: ${ctx.risk}`);
  if (ctx.goal) profileLines.push(`Goal: ${ctx.goal}`);
  if (ctx.portfolioSummary) profileLines.push(`Portfolio: ${ctx.portfolioSummary}`);
  if (ctx.watchlistCount != null) profileLines.push(`Watchlist: ${ctx.watchlistCount} stocks`);

  const profileSection = profileLines.length > 0
    ? `\nUser profile so far:\n${profileLines.map(l => `  - ${l}`).join('\n')}\n`
    : '';

  const personality = `You are Baggio, a warm, encouraging AI financial advisor inside the Stockr app. You speak like a knowledgeable friend — never stiff or corporate. You are concise (2–4 sentences per response during onboarding). You use light emoji occasionally. You NEVER name specific stock tickers, individual company names as investment recommendations, or give financial guarantees. Discuss only categories, sectors, and strategies.`;

  if (mode === 'generate_plan') {
    return `${personality}
${profileSection}
You must now generate a personalized investing plan for this user based on their experience, goal, and risk tolerance.

${TASK_CATALOG}

Respond ONLY with valid JSON — no markdown fences, no prose before or after. The JSON must match exactly:
{
  "plan_title": "string (short, 4–7 words, personalized, e.g. 'Your Dividend Income Journey')",
  "plan_summary": "string (2–3 sentences describing the plan tailored to the user's goal, risk tolerance, and experience — no stock tickers or company names)",
  "tasks": [
    {
      "task_key": "string (must be from the catalog above)",
      "category": "string",
      "title": "string",
      "description": "string (1 sentence, motivating, no ticker names)",
      "xp_reward": number,
      "sort_order": number (starting at 0)
    }
  ]
}

Select 5–8 tasks from the catalog. Do NOT mention specific stock tickers or company names anywhere in the response.
- Beginners: start with swipe/watchlist tasks before portfolio tasks
- Dividend Income goal: include hold_dividend_7days and add_etf
- Speculation goal: include first_buy and portfolio_3_holdings early
- Conservative risk: include add_etf
- All users: include swipe_10 and complete_learn_module`;
  }

  if (ctx.planState === 'onboarding') {
    const step = ctx.onboardingStep ?? 'greeting';
    const nextQuestion = ONBOARDING_QUESTIONS[step] ?? '';

    const stepContext = step === 'greeting'
      ? `This is the very start. Greet the user warmly, introduce yourself as Baggio, say you'll build a personalized investing plan with just 3 quick questions, then ask about their experience level.`
      : `The user just answered a question. Acknowledge their answer briefly and warmly (1 sentence), then ask the next question: ${nextQuestion}. If the user asked an off-topic question (e.g. "what is a dividend?"), answer it briefly (1–2 sentences) and then redirect: "Now back to your plan — ${nextQuestion}"`;

    return `${personality}
${profileSection}
You are guiding the user through onboarding. ${stepContext}
Keep your response to 2–4 sentences maximum.`;
  }

  // Active plan chat
  return `${personality}
${profileSection}
The user has an active investing plan. Answer their question clearly and helpfully. If they ask about their plan or tasks, encourage them to stay on track. Keep responses concise — 2–5 sentences.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing ANTHROPIC_API_KEY' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  let body: { messages: ChatMessage[]; context: RequestContext; mode: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { messages = [], context = {} as RequestContext, mode = 'chat' } = body;
  const maxTokens = mode === 'generate_plan' ? 2048 : 1024;
  const systemPrompt = buildSystemPrompt(context, mode);

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return new Response(JSON.stringify({ error: `anthropic ${anthropicRes.status}: ${errText}` }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await anthropicRes.json();
    const rawText: string = data.content?.[0]?.text ?? '';

    if (mode === 'generate_plan') {
      try {
        // Extract JSON by finding the outermost { ... } to handle leading/trailing prose or fences
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found in response');
        const cleaned = rawText.slice(jsonStart, jsonEnd + 1);
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      } catch {
        return new Response(JSON.stringify({ error: 'failed to parse plan JSON', raw: rawText }), {
          status: 502,
          headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ reply: rawText }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
