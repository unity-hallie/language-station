<script>
  import { createEventDispatcher } from 'svelte';
  import safetyData from '../../content/safety.json';

  export let gmLoading = false;
  export let gmSafetyEntries = [];   // { text, cite: 'station' } from GM
  export let provenanceUnlocked = false;

  const dispatch = createEventDispatcher();

  // Seeded entries — provenance unknown, from "previous cohorts"
  const seeded = {
    lines: safetyData.lines.map(t => ({ text: t, cite: null })),
    veils: safetyData.veils.map(t => ({ text: t, cite: null })),
  };

  // Split GM entries into lines/veils — they arrive as a flat list
  // GM labels them by content; we keep them together since they're already
  // tagged cite:'station'. Show them in both sections for now.
  $: gmLines = gmSafetyEntries.filter((_, i) => i % 2 === 0);
  $: gmVeils = gmSafetyEntries.filter((_, i) => i % 2 !== 0);

  $: allLines = [...seeded.lines, ...gmLines];
  $: allVeils = [...seeded.veils, ...gmVeils];

  let playerLines = [];
  let playerVeils = [];
  let newLine = '';
  let newVeil = '';

  function addLine() {
    const t = newLine.trim();
    if (t) { playerLines = [...playerLines, { text: t, cite: 'player' }]; newLine = ''; }
  }

  function addVeil() {
    const t = newVeil.trim();
    if (t) { playerVeils = [...playerVeils, { text: t, cite: 'player' }]; newVeil = ''; }
  }

  function handleLineKey(e) { if (e.key === 'Enter') addLine(); }
  function handleVeilKey(e) { if (e.key === 'Enter') addVeil(); }

  // Hold-to-reveal: 5 seconds unlocks provenance early
  let holdTimer = null;
  let holdProgress = 0;
  let holdComplete = false;
  const HOLD_MS = 5000;

  function startHold() {
    if (holdComplete) return;
    const start = Date.now();
    holdTimer = setInterval(() => {
      holdProgress = Math.min((Date.now() - start) / HOLD_MS, 1);
      if (holdProgress >= 1) {
        clearInterval(holdTimer);
        holdComplete = true;
        provenanceUnlocked = true;
      }
    }, 50);
  }

  function endHold() {
    if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    if (!holdComplete) holdProgress = 0;
  }

  function proceed() {
    dispatch('proceed', {
      lines: [...allLines, ...playerLines],
      veils: [...allVeils, ...playerVeils],
      provenanceEarly: holdComplete,
    });
  }
</script>

<div class="safety-screen">
  <div class="safety-inner">

    <p class="preamble">Before you board, the station asks:</p>
    <p class="preamble-sub">
      What will you not carry with you?<br>
      What would you rather not encounter here?
    </p>

    <p class="note">{safetyData.notes[0]}</p>

    {#if gmLoading}
      <p class="loading">The station is preparing…</p>
    {:else}

      <section class="category">
        <h2>Lines <span class="def">— will not enter the fiction</span></h2>
        <ul>
          {#each [...allLines, ...playerLines] as entry}
            <li>
              {entry.text}
              {#if provenanceUnlocked && entry.cite}
                <span class="cite" title={entry.cite === 'station' ? 'Registered by the station' : entry.cite === 'player' ? 'Registered by you' : 'Previous cohort'}>⌑</span>
              {/if}
            </li>
          {/each}
        </ul>
        <div class="add-row">
          <input type="text" placeholder="Add a line…" bind:value={newLine} on:keydown={handleLineKey} />
          <button on:click={addLine}>Add</button>
        </div>
      </section>

      <section class="category">
        <h2>Veils <span class="def">— can happen, won't be shown</span></h2>
        <ul>
          {#each [...allVeils, ...playerVeils] as entry}
            <li>
              {entry.text}
              {#if provenanceUnlocked && entry.cite}
                <span class="cite" title={entry.cite === 'station' ? 'Registered by the station' : entry.cite === 'player' ? 'Registered by you' : 'Previous cohort'}>⌑</span>
              {/if}
            </li>
          {/each}
        </ul>
        <div class="add-row">
          <input type="text" placeholder="Add a veil…" bind:value={newVeil} on:keydown={handleVeilKey} />
          <button on:click={addVeil}>Add</button>
        </div>
      </section>

      <p class="note">{safetyData.notes[2]}</p>

      <div class="bottom-row">
        <div class="hold-area">
          {#if !holdComplete}
            <button
              class="hold-btn"
              on:mousedown={startHold}
              on:mouseup={endHold}
              on:mouseleave={endHold}
              on:touchstart|preventDefault={startHold}
              on:touchend={endHold}
            >
              {#if holdProgress > 0}
                <span class="hold-bar" style="width: {holdProgress * 100}%"></span>
              {/if}
              <span class="hold-label">hold to learn more now</span>
            </button>
          {:else}
            <p class="revealed">The station has noted your preference.</p>
          {/if}
        </div>

        <button class="proceed-btn" on:click={proceed}>Board</button>
      </div>

    {/if}
  </div>
</div>

<style>
  .safety-screen {
    min-height: 100vh;
    background: #f5f4f0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 4rem 1.5rem;
  }

  .safety-inner {
    max-width: 600px;
    width: 100%;
  }

  .preamble {
    font-family: 'Georgia', serif;
    font-size: 1.1rem;
    color: #3a3a38;
    margin: 0 0 0.5rem;
    line-height: 1.7;
  }

  .preamble-sub {
    font-family: 'Georgia', serif;
    font-size: 0.97rem;
    color: #6a6a68;
    margin: 0 0 2rem;
    line-height: 1.8;
  }

  .note {
    font-family: monospace;
    font-size: 0.75rem;
    color: #aaa89f;
    margin: 0 0 1.5rem;
    line-height: 1.6;
  }

  .loading {
    font-family: monospace;
    font-size: 0.8rem;
    color: #c8c5bc;
    font-style: italic;
    margin: 2rem 0;
  }

  .category {
    margin-bottom: 2.5rem;
  }

  h2 {
    font-family: monospace;
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #888880;
    margin: 0 0 0.75rem;
    font-weight: normal;
  }

  .def {
    text-transform: none;
    letter-spacing: 0;
    color: #aaa89f;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0 0 0.75rem;
  }

  li {
    font-family: 'Georgia', serif;
    font-size: 0.9rem;
    color: #4a4a48;
    padding: 0.4rem 0;
    border-bottom: 1px solid #eae7e0;
    line-height: 1.5;
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
  }

  .cite {
    font-family: monospace;
    font-size: 0.75em;
    color: #aaa89f;
    cursor: help;
    flex-shrink: 0;
  }

  .add-row {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  input {
    flex: 1;
    background: #faf9f6;
    border: 1px solid #d4d0c8;
    color: #3a3a38;
    font-family: 'Georgia', serif;
    font-size: 0.88rem;
    padding: 0.4rem 0.7rem;
    border-radius: 2px;
    outline: none;
  }

  input:focus { border-color: #888880; }
  input::placeholder { color: #c8c5bc; }

  button {
    background: none;
    border: 1px solid #d4d0c8;
    color: #6a6a68;
    font-family: 'Georgia', serif;
    font-size: 0.88rem;
    padding: 0.4rem 0.9rem;
    cursor: pointer;
    border-radius: 2px;
    transition: border-color 0.15s, color 0.15s;
    width: auto;
  }

  button:hover { border-color: #888880; color: #2a2a28; }

  .bottom-row {
    margin-top: 3rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .hold-area {
    flex: 1;
  }

  .hold-btn {
    position: relative;
    overflow: hidden;
    width: 100%;
    text-align: left;
    padding: 0.5rem 1rem;
    color: #aaa89f;
    border-color: #e8e5dc;
    user-select: none;
    -webkit-user-select: none;
  }

  .hold-bar {
    position: absolute;
    inset: 0;
    height: 100%;
    background: #eae7e0;
    transition: width 0.05s linear;
    z-index: 0;
  }

  .hold-label {
    position: relative;
    z-index: 1;
    font-size: 0.82rem;
    letter-spacing: 0.05em;
  }

  .revealed {
    font-family: monospace;
    font-size: 0.78rem;
    color: #888880;
    margin: 0;
  }

  .proceed-btn {
    font-size: 0.95rem;
    padding: 0.6rem 2rem;
    letter-spacing: 0.1em;
    flex-shrink: 0;
  }
</style>
