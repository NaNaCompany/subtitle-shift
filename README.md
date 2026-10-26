# Subtitle Shift

Independent buildless SRT/WebVTT timing editor. Serve `dist/` as the web root. No dependencies, uploads, tracking or remote media requests. All UI, CSS, logic and sample subtitles are original work.

Six localized routes: Korean `/`, English `/en/`, Spanish `/es/`, Simplified Chinese `/zh/`, Japanese `/ja/`, German `/de/`. Every route includes a manual language selector, localized validation, statuses, controls and help. Changing language resets input to the original example.

## Behavior

The timing formula is `new time = round(original milliseconds × factor + offset milliseconds)`. Positive offsets delay subtitles; negative offsets advance them. The factor stretches subtitle times and is the inverse of media playback speed. Factor range: 0.1–10; offset: ±86,400,000 ms. Limits: UTF-8 input up to 1 MiB, 10,000 cues, and output timestamps below 100 hours.

Negative timestamps, zero/reversed durations and out-of-range output block export without clamping, dropping cues or changing the original file. Overlap count includes all cues participating in any overlap. Touching endpoints do not overlap. Unsorted input is flagged, and original cue order remains unchanged.

Cue payloads and markup remain literal text; they are never injected into the page. Payload whitespace is retained, while line endings and block separators are normalized to LF. Same-format processing preserves SRT identifiers, VTT identifiers, VTT header text and VTT cue settings. SRT↔VTT conversion preserves milliseconds and multiline payloads. To avoid silently losing format features, conversion accepts only plain text and shared `<b>`, `<i>`, `<u>` tags and rejects other tags or VTT settings. VTT NOTE/STYLE/REGION, extra header metadata and inline cue timestamps are explicitly rejected. This bounded tool is not a full WebVTT validator, speech recognizer or video player.

Copy requires clipboard permission/secure context. UTF-8 export uses `subtitles-adjusted.srt` or `subtitles-adjusted.vtt`; downloads remain available when clipboard access is denied. Selecting a file only loads it; adjustment is explicit so the input stays editable.

## Verification

Commands executed through the workspace's explicit RTK executable and bundled Node runtime:

```text
node --check dist/app.js
node --check dist/core.js
node --test test.mjs
```

Actual result: both syntax checks passed; 7 tests passed, 0 failed. Independent fixtures cover exact millisecond arithmetic, negative offset rejection and zero boundary, factor scaling, SRT/VTT round trip, multiline/markup/whitespace preservation, cue settings and IDs, nested overlaps, unsorted cues, touching endpoints, malformed times, reversed durations, unsupported metadata/inline timestamps, lossy conversion and size limits. A Python stdlib HTML parser additionally verified all 6 routes, localized label indices and relative asset existence. Browser layout, OS file dialogs and real clipboard/download actions have not been tested.

## Primary references

- W3C WebVTT draft format reference: https://www.w3.org/TR/webvtt1/
- Library of Congress SRT format description: https://www.loc.gov/preservation/digital/formats/fdd/fdd000569.shtml

These references informed format handling. No third-party prose, example captions, images or scripts are reproduced.

## Public GitHub Pages release

Launch: https://nanalab.kr/subtitle-shift/

Korean is at the root. English, Spanish, Chinese, Japanese and German use `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/`.
GitHub Pages serves `main` → `/docs` using the branch build. No project CNAME is used.

Build: `node scripts/build-public.mjs`. The `dist/` snapshot and its original generators/tests are preserved as the application source. The public build adds metadata, six-locale sitemaps, original JPEG cards, More Apps styling and the existing NaNa publisher integrations. It does not upload selected user files.

Publisher integrations: AdSense, Google Tag Manager, Google Analytics and Cloudflare Web Analytics, with the same publisher settings as the NaNa Lab homepage. These scripts can make network requests independently of local file processing.

Original JPEG cards are rendered from original text and geometry using an installed system font; no font files are redistributed. Existing source references and third-party notices remain applicable.
