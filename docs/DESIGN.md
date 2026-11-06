# Design: how Vocal Black Magic fits together

For anyone changing the two apps: the shape of the system as built on the `feature/vbm-upgrade` branch, drawn as Mermaid diagrams. GitHub renders them here, and both apps show the same diagrams in the arcane theme on their `/arcana` page, which reads this file at build time. Edit a diagram here and both places update.

Everything below runs for **local development only**: there is no authentication, and paid routes return 403 outside `NODE_ENV=development`. See [ARCHITECTURE.md](ARCHITECTURE.md) for the target SaaS shape and [RIGHTS_AND_SAFETY.md](RIGHTS_AND_SAFETY.md) for the consent rules.

## The two apps and what they share

```mermaid
flowchart LR
  subgraph browser["Browser"]
    studioUI["TTB Studio UI"]
    vfUI["Vocal Fix UI"]
  end
  subgraph shared["Shared packages"]
    ui["@vbm/ui: arcane design system and real-audio graphs"]
    contracts["@vbm/contracts: typed requests, jobs, VoiceModel"]
  end
  subgraph servers["SvelteKit servers on Bun"]
    studioSrv["TTB Studio server"]
    vfSrv["Vocal Fix server"]
  end
  subgraph disk["data/ on local disk"]
    songs["studio/songs"]
    sessions["vocal-fix/sessions"]
    registry["shared/voices registry"]
  end
  replicate["Replicate hosted models"]
  ffmpeg["Local ffmpeg and ffprobe"]

  studioUI --> studioSrv
  vfUI --> vfSrv
  studioUI -.-> ui
  vfUI -.-> ui
  studioSrv -.-> contracts
  vfSrv -.-> contracts
  studioSrv --> replicate
  vfSrv --> replicate
  studioSrv --> ffmpeg
  vfSrv --> ffmpeg
  studioSrv --> songs
  vfSrv --> sessions
  vfSrv -- "writes forged voices" --> registry
  studioSrv -- "reads ready, consented voices" --> registry
```

## Request guard on every paid or mutating route

```mermaid
flowchart TD
  req["Incoming request"] --> host{"Host is localhost, 127.0.0.1 or ::1?"}
  host -- no --> h403["403"]
  host -- yes --> dev{"NODE_ENV is development?"}
  dev -- no --> d403["403"]
  dev -- yes --> kind{"Mutating or paid?"}
  kind -- no --> ok["Handle the read"]
  kind -- yes --> json{"JSON body or intent header?"}
  json -- no --> j415["Refused: a cross-site form cannot spend credit"]
  json -- yes --> cap{"Under the running-job cap?"}
  cap -- no --> c429["429"]
  cap -- yes --> run["Start the job"]
```

## TTB Studio: summoning a song

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser
  participant S as Studio server
  participant L as Lyricist on Replicate
  participant M as Music engine on Replicate
  participant F as FLUX cover art
  participant D as data/studio/songs

  B->>S: POST create, Simple or Custom mode, 1 or 2 takes
  opt Simple mode
    S->>L: write lyrics and a title from the description
    L-->>S: tagged lyrics
  end
  S->>M: one prediction per take
  S-->>B: job id
  loop until every take is stored or failed
    B->>S: GET job status
    S->>M: poll prediction
    M-->>S: output link that expires
    S->>S: download, check the audio format
    S->>D: audio file and meta.json
  end
  opt Conjure cover art is on
    S->>F: occult cover from title and lyrics mood
    F-->>S: image, format checked
    S->>D: cover file
  end
  S-->>B: completed, each take plays with real graphs
```

## TTB Studio: what can be derived from a song

```mermaid
flowchart LR
  orig["Original song"] --> stems["Stems: Demucs splits vocals, drums, bass, other"]
  orig --> reimagine["Reimagine: Music-01 uses the song as a reference"]
  orig --> master["Studio Master: local ffmpeg, -14 LUFS, -1 dBTP"]
  orig --> voice["Sing in my voice: RVC with a forged voice"]
  stems --> mixer["Stem mixer: mute, solo, volume, WAV export"]
  master --> ab["A/B against the parent at the same position"]
  gold["Gold Vocal from Vocal Fix"] --> summon["Summon in my voice: Music-01 with voice and music references"]
  orig -. "music reference" .-> summon
```

Every derived song is a new library entry with `parent_id`, so the original is never overwritten. Derived songs inherit the parent's cover unless it is re-conjured.

## Vocal Fix: repairing a take

```mermaid
flowchart TD
  upload["Upload or record a take"] --> probe["ffprobe and full decode"]
  probe -- "undecodable, over 10 min or over 100 MB" --> reject["Rejected with a reason"]
  probe -- ok --> original["Original stored, never modified"]
  original --> diagnose["Diagnosis: loudness, clipping, noise floor, silence, with timestamps"]
  diagnose --> isolate{"Isolate the vocal?"}
  isolate -- yes --> demucs["Demucs on Replicate"]
  isolate -- no --> enhance
  demucs --> enhance{"AI denoise and enhance?"}
  enhance -- yes --> resemble["resemble-enhance on Replicate"]
  enhance -- no --> polish
  resemble --> polish["Local polish: adaptive denoise, gate, EQ, compression, capped make-up gain, limiter"]
  polish --> rediag["Re-diagnose"]
  rediag --> guard{"Any key score more than 5 points worse?"}
  guard -- no --> versioned["New versioned file in derived/"]
  guard -- yes --> retry["Retry once with a stronger setting"]
  retry --> honest["Keep the better result and say plainly what could not be fixed"]
  honest --> versioned
  versioned --> abview["Before and after A/B with score changes"]
```

## Vocal Fix: from five takes to a forged voice

```mermaid
flowchart TD
  takes["Five repaired takes"] --> phrases["Split into phrases at silences"]
  phrases --> rank["Rank: SNR, clipping, loudness consistency, length"]
  rank --> board["Phrase board: include or exclude each phrase"]
  board --> goldwav["Gold Vocal WAV joined with short silences, no blending between takes"]
  goldwav --> profile["Descriptive profile: range, tone, dynamics, breath"]
  goldwav --> consent{"Performer types their own name and confirms it is their voice"}
  consent -- no --> stop["No training"]
  consent -- yes --> audit["Timestamped consent record in the session"]
  audit --> train["Train an RVC model on Replicate"]
  train --> reg["Registry entry in data/shared/voices, status ready"]
  reg --> studio["Offered in TTB Studio"]
  reg --> revoke["Revoke deletes the entry and the model file"]
```

## Job lifecycle

Both apps run long work as jobs that the browser polls. Vocal Fix runs at most two repair or forge jobs at once (one forge), saves job state under `data/vocal-fix/jobs/`, and marks jobs cut off by a restart as failed. TTB Studio refuses new paid work while three jobs are running.

```mermaid
stateDiagram-v2
  [*] --> queued
  queued --> running: a slot frees up
  queued --> cancelled: user cancels
  running --> completed: every stage done
  running --> failed: provider or validation error
  running --> failed: server restarted
  running --> cancelled: user cancels
  completed --> [*]
  failed --> [*]
  cancelled --> [*]
```

## Where data lives

```mermaid
flowchart TD
  data["data/ (gitignored, or VBM_DATA_DIR)"]
  data --> studioDir["studio/songs/id/"]
  studioDir --> songFiles["audio file, meta.json, cover file, stems/"]
  data --> vfDir["vocal-fix/sessions/id/"]
  vfDir --> vfFiles["originals/, derived/, manifest.json with sha256 and provenance"]
  data --> jobsDir["vocal-fix/jobs/id.json"]
  data --> voicesDir["shared/voices/"]
  voicesDir --> voiceFiles["voice-id.json and voice-id.model.zip"]
```

## The design system

```mermaid
flowchart TD
  theme["theme.css: void palette, glows, Cinzel and Cormorant, grain"] --> shell["ArcaneShell: smoke background, wordmark, app switch"]
  shell --> panels["ArcanePanel, RuneButton, inputs, RuneToggle, OracleStatus"]
  shell --> progress["RitualProgress, SigilLoader, RuneMeter"]
  audio["audio.ts: decode, peaks, STFT, pitch"] --> graphs["Waveform, Spectrogram, PitchTrace, VoiceSigil"]
  audio --> live["SummoningCircle, RuneRecorder"]
  graphs --> players["GrimoirePlayer, ABCompare"]
  live --> players
  mermaidC["MermaidDiagram: these design diagrams in the arcane theme"] --> panels
```

Graphs only ever draw decoded audio. With no audio they show an empty "awaiting sound" state, never a placeholder waveform.
