/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                                                                      ║
 * ║   🚨  GM STUB  🚨   THIS IS NOT THE REAL GM   🚨  GM STUB  🚨       ║
 * ║                                                                      ║
 * ║   This file returns FAKE data so the engine can run without          ║
 * ║   a live AI backend. It is intentionally obnoxious.                  ║
 * ║                                                                      ║
 * ║   If you are seeing stub content in a real game session:             ║
 * ║     1. Check VITE_GM_MODE in your .env                               ║
 * ║     2. Make sure live.js is implemented and wired into gm/index.js   ║
 * ║     3. Do not ship this. Seriously.                                  ║
 * ║                                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * STUB BEHAVIORS:
 *   - All generated text is clearly labeled [STUB GM]
 *   - Logs loudly to the console on every call
 *   - Simulates async delay (150-400ms) to surface timing issues early
 *   - Returns structurally valid data so the engine can run end-to-end
 *   - Warns if VITE_GM_MODE=live is set (should never reach stub then)
 */

const STUB_DELAY_MS = [150, 400];

function stubDelay() {
  const ms = STUB_DELAY_MS[0] + Math.random() * (STUB_DELAY_MS[1] - STUB_DELAY_MS[0]);
  return new Promise(r => setTimeout(r, ms));
}

function stubLog(method, args) {
  console.groupCollapsed(
    `%c[GM STUB] %c${method}`,
    'color: #ff6b35; font-weight: bold; font-size: 13px;',
    'color: #ffd166; font-weight: bold; font-size: 13px;'
  );
  console.log('Arguments:', args);
  console.log('%cThis is FAKE GM output. See src/gm/stub.js', 'color: #ef476f;');
  console.groupEnd();
}

function stubWarn() {
  if (import.meta.env.VITE_GM_MODE === 'live') {
    console.error(
      '[GM STUB] VITE_GM_MODE=live but GMStub is running. ' +
      'Check gm/index.js — live.js is not wired in yet.'
    );
  }
}

export class GMStub {
  async preSession() {
    stubLog('preSession', {});
    await stubDelay();
    return [
      { text: '[THE STATION WOULD REGISTER SOMETHING IT WILL NOT HOLD. IT DOES NOT.]', cite: 'station' },
    ];
  }

  constructor() {
    stubWarn();
    console.warn(
      '%c[GM STUB] GMStub initialized. All GM responses are FAKE.',
      'color: #ff6b35; font-weight: bold; font-size: 14px; background: #1a1a2e; padding: 4px 8px; border-radius: 4px;'
    );
  }

  /**
   * Returns a fake pre-generated room.
   * Structurally valid — engine can navigate into it.
   */
  async prefetchRoom(roomId, fromRoomId) {
    stubLog('prefetchRoom', { roomId, fromRoomId });
    await stubDelay();

    return {
      id: roomId,
      name: `[A ROOM]`,
      description: `[YOU ARE IN A PLACE. THERE ARE WALLS. POSSIBLY A FLOOR. THE LIGHTING IS SOME KIND OF LIGHTING. YOU FEEL SOMETHING, PROBABLY.]`,
      gmGenerated: true,
      gmSource: 'stub',                          // ← NEVER on real GM rooms
      exits: {
        back: fromRoomId,
      },
      npcs: [],
      interactables: [
        {
          id: 'stub_sign',
          name: '[AN OBJECT]',
          description: '[IT IS AN OBJECT. IT HAS PROPERTIES. YOU COULD PROBABLY INTERACT WITH IT IF THIS WERE REAL.]',
        }
      ],
    };
  }

  /**
   * Returns fake dialog options, clearly labeled.
   */
  async generateOptions(npcId, stateSnapshot, dialogHistory) {
    stubLog('generateOptions', { npcId, stateSnapshot, dialogHistory });
    await stubDelay();

    return [
      {
        text: '[SAY A THING TO THE PERSON]',
        source: 'gm',           // ← correct source tag — engine uses this, not player
        _stubNote: 'STUB: real GM would generate contextual options here',
        next: {
          id: `stub_response_${Date.now()}`,
          speaker: npcId,
          text: `[THE PERSON RESPONDS. THEIR RESPONSE CONTAINS WORDS ARRANGED IN AN ORDER. SOME OF THE WORDS MAY BE RELEVANT TO YOUR SITUATION.]`,
          source: 'gm',
          options: [],
        },
      },
      {
        text: '[STOP TALKING TO THE PERSON]',
        source: 'gm',
        _stubNote: 'STUB: this ends dialog',
        next: null,
      },
    ];
  }

  /**
   * Returns a fake Station response.
   * The Station is a special speaker — this should feel especially wrong when stubbed.
   */
  async stationResponse(stateSnapshot, playerMessage) {
    stubLog('stationResponse', { stateSnapshot, playerMessage });
    await stubDelay();

    return {
      id: `stub_station_${Date.now()}`,
      speaker: 'station',
      text: `[THE STATION SAYS SOMETHING. IT IS MEANINGFUL AND PERHAPS SLIGHTLY OMINOUS. YOU ARE AFFECTED BY IT IN SOME WAY.]`,
      source: 'station',
      _stubNote: 'STUB: real station responses emerge from persistent GM context',
      options: [
        {
          text: '[RESPOND TO THE STATION IN SOME WAY]',
          source: 'station',
          next: null,
        },
      ],
    };
  }
}
