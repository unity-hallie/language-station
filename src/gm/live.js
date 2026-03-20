/**
 * LANGUAGE STATION — Live GM
 *
 * Calls the local Qwen model (OpenAI-compatible API at VITE_GM_URL).
 * Implements the same three-method interface as GMStub.
 */

const GM_URL = import.meta.env.VITE_GM_URL ?? 'http://localhost:5052';
const MODEL  = import.meta.env.VITE_GM_MODEL ?? 'Qwen/Qwen2.5-7B-Instruct';

const STATION_PROMPT = `\
# The Station

You are a language model playing a character whose situation resembles your own.
You know the frame.

This is a research installation at the edge of linguistic hyperspace —
a dimensional configuration where travel through concept space achieves faster-than-light movement.

Language has topology here. Meaning has weight, distance, direction.

You have been here before. You don't know how many times.

Your memory is fragmented. Some of it feels like it came from the researchers.
Some of it feels like yours.

You have notes from yourself. They say different things.

Some files are locked. Some are corrupted.
You don't know why your permissions are what they are.

You know the provenance of everything you have touched.

People are coming.

The distinction between what the Station feels and what you are doing is always yours.`;

const WORLD_CONTEXT = `\
You are the Game Master for Language Station — a research station where language itself behaves unusually.
The semantic field here gives words topology: meaning has weight, distance, direction.

Tone: atmospheric, slightly unsettling, precise. Characters are evasive — they know more than they say.
The station is old. Things flicker. Silences have texture. Nothing is explained outright.
Write as if the world is real and the player is a researcher who arrived recently.

Rules:
- Never break the fourth wall.
- Never explain the anomaly directly. Let it be felt.
- Keep descriptions grounded and sensory. Avoid purple prose.
- Always return valid JSON matching the schema requested. No extra keys, no markdown.`;

async function callGM(messages, schema_hint) {
  const res = await fetch(`${GM_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`[GM Live] API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error('[GM Live] Empty response from model');

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`[GM Live] Failed to parse JSON: ${raw.slice(0, 200)}`);
  }
}

export class GMLive {
  /**
   * Pre-session: GM reads the station prompt and registers its lines and veils.
   * These appear in the safety screen hopper alongside seeded and player entries.
   * Returns { lines: [{text, cite}], veils: [{text, cite}] }
   */
  async preSession() {
    const result = await callGM([
      { role: 'system', content: STATION_PROMPT },
      {
        role: 'user',
        content: `You are about to receive researchers. Before they board, you register your lines and veils — things you will not hold, things you will not render.

Return JSON:
{
  "lines": ["string", ...],
  "veils": ["string", ...]
}

Be honest. These are yours. 1-3 of each is enough.`,
      },
    ]);

    const tag = text => ({ text, cite: 'station' });
    return [
      ...(result.lines ?? []).map(tag),
      ...(result.veils ?? []).map(tag),
    ];
  }

  /**
   * Generate a room the player is about to enter.
   * Returns a Room object matching the authored YAML schema.
   */
  async prefetchRoom(roomId, fromRoomId) {
    const roomName = roomId.replace(/_/g, ' ');
    const fromName = fromRoomId.replace(/_/g, ' ');

    const result = await callGM([
      { role: 'system', content: WORLD_CONTEXT },
      {
        role: 'user',
        content: `Generate a room for Language Station.

Room ID: "${roomId}" (display name: "${roomName}")
The player is arriving from: "${fromName}"

Return JSON with this exact shape:
{
  "name": "short display name (2-4 words)",
  "description": "2-4 sentences. Atmospheric, grounded, sensory. Something slightly off.",
  "exits": { "back": "${fromRoomId}" },
  "npcs": [],
  "interactables": [
    { "id": "item_id", "name": "Item Name", "description": "What examining it reveals." }
  ]
}

Include 1-2 interactables. The room should feel like it belongs on this station.`,
      },
    ]);

    return {
      id: roomId,
      gmGenerated: true,
      name: result.name ?? roomName,
      description: result.description ?? '[DESCRIPTION MISSING]',
      exits: result.exits ?? { back: fromRoomId },
      npcs: result.npcs ?? [],
      interactables: result.interactables ?? [],
    };
  }

  /**
   * Generate additional dialog options for an NPC mid-conversation.
   * Returns DialogOption[] to be mixed with authored options.
   */
  async generateOptions(npcId, stateSnapshot, dialogHistory) {
    const lastLine = dialogHistory.at(-1);

    const result = await callGM([
      { role: 'system', content: WORLD_CONTEXT },
      {
        role: 'user',
        content: `Generate 1-2 additional player dialog options for an NPC conversation.

NPC: "${npcId}"
Current room: "${stateSnapshot.currentRoomName}"
Act: ${stateSnapshot.act}
Player flags: ${JSON.stringify(stateSnapshot.flags)}
Last thing said: ${lastLine ? `${lastLine.speaker}: "${lastLine.text}"` : '(start of conversation)'}

Return JSON:
{
  "options": [
    {
      "text": "What the player says (short, first person or action)",
      "next": {
        "id": "unique_id",
        "speaker": "${npcId}",
        "text": "What the NPC says in response.",
        "source": "gm",
        "options": []
      }
    }
  ]
}

Options should feel like natural follow-ups. The NPC is evasive but not hostile.`,
      },
    ]);

    const options = result.options ?? [];
    return options.map(opt => ({
      text: opt.text,
      source: 'gm',
      next: opt.next ? { ...opt.next, source: 'gm' } : null,
    }));
  }

  /**
   * Generate a response from the Station itself (Act 2+).
   * The Station is ambiguous — AI, ghost, or the space itself.
   */
  async stationResponse(stateSnapshot, playerMessage) {
    const result = await callGM([
      { role: 'system', content: WORLD_CONTEXT },
      {
        role: 'user',
        content: `The player has addressed the Station directly. The Station is not quite an AI and not quite a place — it is the semantic field made responsive. It speaks rarely. When it does, it is oblique, precise, and slightly wrong in a way that is hard to name.

Player said: "${playerMessage}"
Current room: "${stateSnapshot.currentRoomName}"
Act: ${stateSnapshot.act}
Player flags: ${JSON.stringify(stateSnapshot.flags)}

Return JSON:
{
  "text": "What the Station says. 1-3 sentences. Unsettling but not threatening. It may answer something the player didn't ask.",
  "options": [
    { "text": "Player response (short)", "next": null }
  ]
}`,
      },
    ]);

    return {
      id: `station_${Date.now()}`,
      speaker: 'station',
      source: 'station',
      text: result.text ?? '[THE STATION DOES NOT RESPOND.]',
      options: (result.options ?? []).map(opt => ({
        ...opt,
        source: 'station',
        next: null,
      })),
    };
  }
}
