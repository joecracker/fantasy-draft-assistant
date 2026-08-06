import express from 'express';
import serverless from 'serverless-http';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json());

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. API calls will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// API Endpoints (paths are relative — the /api prefix is stripped before reaching here)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', hasKey: !!apiKey });
});

// Sleeper API Proxy routes to prevent CORS or timeout errors
app.get('/sleeper/draft/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Sleeper API returned status ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper draft:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Sleeper draft.' });
  }
});

app.get('/sleeper/draft/:draftId/picks', async (req, res) => {
  try {
    const { draftId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Sleeper API returned status ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper draft picks:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Sleeper draft picks.' });
  }
});

app.get('/sleeper/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Sleeper API returned status ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper league:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Sleeper league.' });
  }
});

app.get('/sleeper/league/:leagueId/drafts', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const response = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/drafts`);
    if (!response.ok) {
      return res.status(response.status).json({ error: `Sleeper API returned status ${response.status}` });
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper league drafts:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Sleeper league drafts.' });
  }
});

// Calculate ADP from free public redraft boards on Sleeper
app.get('/sleeper/public-adp', async (req, res) => {
  try {
    const PUBLIC_DRAFTS = [
      '1118151322045583360',
      '1115509174987722752',
      '1115064478150492160',
      '1112443425553653760',
      '1113573210350481408'
    ];

    const playerPicksMap: Record<string, number[]> = {};

    const results = await Promise.all(
      PUBLIC_DRAFTS.map(async (draftId) => {
        try {
          const response = await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`);
          if (response.ok) {
            return await response.json();
          }
        } catch (e) {
          console.error(`Failed to fetch draft ${draftId}:`, e);
        }
        return [];
      })
    );

    let totalPicksParsed = 0;
    results.forEach((picks) => {
      if (Array.isArray(picks) && picks.length > 0) {
        picks.forEach((pick: any) => {
          if (pick.metadata) {
            const firstName = pick.metadata.first_name || '';
            const lastName = pick.metadata.last_name || '';
            const fullName = `${firstName} ${lastName}`.trim();
            const rawPos = pick.metadata.position || '';
            const position = rawPos === 'DEF' ? 'DST' : rawPos;

            if (fullName && position) {
              const key = `${fullName.toLowerCase().trim()}_${position}`;
              if (!playerPicksMap[key]) {
                playerPicksMap[key] = [];
              }
              playerPicksMap[key].push(pick.pick_no);
              totalPicksParsed++;
            }
          }
        });
      }
    });

    const adpMap: Record<string, number> = {};
    Object.entries(playerPicksMap).forEach(([playerKey, picks]) => {
      const sum = picks.reduce((a, b) => a + b, 0);
      adpMap[playerKey] = parseFloat((sum / picks.length).toFixed(1));
    });

    res.json({
      success: true,
      draftsSynced: PUBLIC_DRAFTS.length,
      totalPicksParsed,
      adpMap
    });
  } catch (error: any) {
    console.error('Error calculating public Sleeper ADP:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate public Sleeper ADP.' });
  }
});

app.post('/filter', async (req, res) => {
  try {
    const { name, team, position, rawMetrics, coachingChanges, recentNews } = req.body;

    if (!name || !team || !position) {
      return res.status(400).json({ error: 'Player name, team, and position are required.' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are an elite, highly clinical sports data analyst specializing in NFL predictive modeling and fantasy football forecasting.
Your job is to act as an "Anti-Hype Filter" that strips away all media narrative, coach speak, training camp puff pieces, and emotional fan bias.

Apply these strict analytical principles:
1. QUANTIFY OVER QUALIFY: Prioritize high-value sticky metrics (such as target share, expected fantasy points, slot snaps, target rate per route run, yards per route run, and offensive line pass-blocking/run-blocking rankings) over adjectives like "primed for a breakout," "looking unstoppable," or "in the best shape of his life."
2. REGRESSION DETECTION: Explicitly flag statistics from the previous year that are mathematically unsustainable (such as an unusually high touchdown rate per touch/reception, extreme efficiency on low volume, or unsustainable yards per carry).
3. SYSTEM OVER HYPE: Heavily weight the historical tendencies of the offensive coordinator/play-caller (e.g., neutral-script pass rate, pace of play, personnel groupings like 11/12 personnel) rather than subjective player talent hype.
4. VARIANCE ASSESSMENT: Identify whether the player's true range of outcomes leans toward high-floor safety or high-ceiling volatility.

Return a highly rigorous, clinical analysis in structured JSON matching the requested schema. Ensure the response format adheres exactly to the schema. Make the numbers like floorValue and ceilingValue realistic for a fantasy league (PPR or half-PPR PPG, typically ranging between 2 and 24).`;

    const userPrompt = `Analyze the following NFL Player Profile:
Player Name: ${name}
Team: ${team}
Position: ${position}

--- Raw Player Metrics & Historical Statistics ---
${rawMetrics || 'No raw statistical metrics provided.'}

--- Coaching & System Changes ---
${coachingChanges || 'No coaching changes or system details provided.'}

--- Recent News & Training Camp Narratives ---
${recentNews || 'No news or narrative statements provided.'}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerName: { type: Type.STRING },
            team: { type: Type.STRING },
            position: { type: Type.STRING },
            objectiveMetrics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 bullet points of hard, predictive data. Prioritize high-value sticky metrics (target share, TPRR, expected fantasy points, slot snaps, O-line rankings) over adjectives."
            },
            narrativeTrashBin: {
              type: Type.STRING,
              description: "Exactly 1 sentence explicitly calling out the specific media hype, training camp puff piece, or coach-speak quote that analysts must ignore."
            },
            trueRangeOfOutcomes: {
              type: Type.OBJECT,
              properties: {
                floorDescription: { type: Type.STRING, description: "Realistic clinical floor scenario based on historical low percentiles, system risks, or draft capital constraints." },
                ceilingDescription: { type: Type.STRING, description: "Realistic ceiling scenario if volume and efficiency are optimized under current system constraints." },
                floorValue: { type: Type.NUMBER, description: "Ranged score representing the player's fantasy PPG or value floor, on a scale of 0 to 25." },
                ceilingValue: { type: Type.NUMBER, description: "Ranged score representing the player's fantasy PPG or value ceiling, on a scale of 0 to 25." },
                metricType: { type: Type.STRING, description: "Must be 'PPG' or 'Score'." }
              },
              required: ["floorDescription", "ceilingDescription", "floorValue", "ceilingValue", "metricType"]
            },
            regressionFlags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING, description: "The specific metric that is highly unsustainable (e.g. 'Rushing Touchdown Rate of 16%')" },
                  description: { type: Type.STRING, description: "The statistical reason why it is likely to regress toward the historical mean." },
                  severity: { type: Type.STRING, description: "Severity of regression risk. Must be 'high', 'medium', or 'low'." }
                },
                required: ["metric", "description", "severity"]
              }
            },
            systemAnalysis: {
              type: Type.OBJECT,
              properties: {
                playCaller: { type: Type.STRING },
                tendency: { type: Type.STRING, description: "Historical metrics of play-caller (e.g. neutral script pass rate, pace of play, personnel preferences)." },
                impactScore: { type: Type.NUMBER, description: "Rating of the system's effect on this position on a scale of 1-100." }
              },
              required: ["playCaller", "tendency", "impactScore"]
            },
            varianceAssessment: {
              type: Type.STRING,
              description: "1-2 sentence clinical summary identifying whether the profile is high-floor safety or high-ceiling variance, and why."
            },
            clinicalScore: {
              type: Type.NUMBER,
              description: "A total analytical rating of the player's stability as an asset on a scale of 1 to 10 (1 = pure volatile hype, 10 = elite blue-chip metrics-backed safety)."
            }
          },
          required: [
            "playerName", "team", "position", "objectiveMetrics", "narrativeTrashBin",
            "trueRangeOfOutcomes", "regressionFlags", "systemAnalysis", "varianceAssessment", "clinicalScore"
          ]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Gemini returned an empty response.');
    }

    const filteredResult = JSON.parse(resultText);
    res.json(filteredResult);
  } catch (error: any) {
    console.error('Error during filtering operation:', error);
    res.status(500).json({ error: error.message || 'An error occurred during raw text processing.' });
  }
});

export const handler = serverless(app, {
  basePath: '/.netlify/functions/api',
});
