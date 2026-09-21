---
name: ingest-resource-links
description: Review resource links on this site's student resource-library pages (public/resources/*/...) for a recurring mistake — a link's own description tells students to use only part of the target page (a specific reading, section, or map) while the href points at the whole page, so students land on the wrong scope and risk hitting content the assignment wants them to avoid. Use this whenever adding new resource links to a resource-library page, when asked to "ingest" or "add" new material/links/sources to the site, or when auditing an existing page for this problem. Also trigger on phrases like "review the resource links," "check these links," or "does this page have the Reading-1 problem."
---

# Reviewing resource links for partial-page mismatches

## The mistake this catches

A resource card links to an external page (nps.gov, si.edu, a museum site, etc.)
with its own short description of what to look for. Sometimes that description
actually names a *specific part* of the target page — "Use Reading 1 only,"
"use the map," "stop before the section on missionization" — while the `href`
points at the entire page, which might also contain a second reading, several
unrelated maps, or later/off-topic history the assignment explicitly wants
students to avoid. The student then has to go hunting for the right part, and
may read content the card was trying to keep them away from.

The fix is always one of two things: point straight at the specific image, or
pull the specific text onto this site as a cited excerpt. Never leave a link
pointing at a whole page while the description says "only" part of it applies.

## Step 1 — Find the flagged links

Run this from the page's directory (or across the whole `public/resources/`
tree to audit everything at once):

```bash
grep -noiE '<p>[^<]*(only|section on|sections on|stop before|skip the|the section)[^<]*</p>' *.html
```

Also check for the same `href` reused across two or more different topic
cards with a different "focus on X" instruction each time — that reuse is
itself a strong signal the source is a multi-topic hub page, even if the
wording above doesn't happen to match:

```bash
grep -oE 'href="https[^"]*"' <page>.html | sort | uniq -c | sort -rn | awk '$1>1'
```

Not every hit is a real problem. A link used once, for one card, with general
reading guidance ("use the sections on kivas" in an FAQ organized by topic)
is usually fine — it's the combination of **(a) an "only/skip/stop before"
instruction** and often **(b) the same URL serving multiple different cards**
that means the page is a hub and the current link is pointing at too much of
it. When in doubt, actually fetch the page (next step) and look.

## Step 2 — Fetch the real source, precisely

Don't rely on `WebFetch`'s summary for this — it's a small model and it
guesses at image URLs and paraphrases text instead of quoting it exactly.
Pull the raw page and read it directly instead:

```bash
curl -s -A "Mozilla/5.0" "<source-url>" -o /tmp/source.html --max-time 20
```

Then find the actual structure: `grep -n "<h2\|<h3\|<h4"` for headings,
`grep -n "Reading\|Map\|section"` for numbered/named parts, and
`grep -oE 'src="[^"]*\.(png|jpg|jpeg)"'` or `grep -n "og:image"` for image
URLs. For the actual prose, isolate the chunk between two headings and strip
tags:

```bash
python3 -c "
import re
html = open('/tmp/source.html').read()
start = html.find('<the heading text that starts the part you want>')
end = html.find('<the heading text that starts the next part>')
text = re.sub(r'<br\s*/?>', '\n', html[start:end])
text = re.sub(r'</p>', '\n\n', text)
text = re.sub(r'<[^>]+>', '', text)
print(text.strip())
"
```

Confirm whether the source is a U.S. government site (nps.gov, si.edu, a
state/federal agency) — that content is public domain and safe to quote at
length with attribution. For anything else, keep the excerpt substantially
shorter than the original and lean toward paraphrase.

## Step 3 — Decide: direct image link, or standalone excerpt page

**The flagged part is a standalone image** (a map, photo, diagram with its
own stable URL): just change the resource's `href` straight to that image
URL. Keep `target="_blank" rel="noopener noreferrer"` since it's still an
external asset. No new page needed. Example from this site's Plains page —
the "Prehistoric Trade Map" resource now links directly to
`https://www.nps.gov/articles/images/Northern-Plains-Trading-System.png`
instead of the multi-reading lesson-plan page it used to point at.

**The flagged part is a segment of text** (a numbered reading, a subsection
under a heading, an FAQ answer): pull that text out into a new page on this
site under a `sources/` folder next to the page that cites it, e.g.
`public/resources/<topic>/sources/<slug>.html`, and point the resource link
at that instead.

## Step 4 — Build the excerpt page

Copy the pattern from the two real examples already in this repo — read them
before writing a new one:

- `public/resources/native-cultures/sources/plains-reading-1.html` (a full
  numbered reading, several subsections)
- `public/resources/native-cultures/sources/channel-islands-settlement.html`
  (a excerpt that stops partway through a page, before unrelated later
  content)

Every excerpt page follows this shape:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{Specific reading/section title} &mdash; {site collection name}</title>
<link rel="stylesheet" href="/assets/css/shared.css?v={current version - check a sibling page}">
<link rel="stylesheet" href="/assets/css/resources.css?v={current version}">
</head>
<body class="corkboard-frame">
<a class="skip-link" href="#main-content">Skip to content</a>
<a id="app-title" href="/">Mr. Maling's Website</a>

<main id="main-content">
<div class="resource-page">
  <a class="back-link" href="../{region-page}.html">&larr; {Region name}</a>
  <div class="eyebrow">Source Excerpt</div>
  <h1>{Specific reading/section title}</h1>
  <p class="page-subtitle">{One line: what's included, and — if it's a partial excerpt — what's deliberately left out and why, e.g. "This excerpt is Reading 1 only - the source page also includes Reading 2 (post-contact history), which is not included here."}</p>

  <div class="source-text">
    <h2>{Subsection heading, if the reading has them}</h2>
    <p>{Paragraph...}</p>
  </div>

  <div class="source-citation">Source: {Publisher/org}, &ldquo;{original page title}&rdquo;{which sub-part this is, if relevant}. {If partial: note where the excerpt stops and why.} Read the full page at <a href="{original URL}" target="_blank" rel="noopener noreferrer">{domain}</a>.</div>
</div>
</main>

</body>
</html>
```

Notes on filling this in:
- `.source-text h2` / `.source-text p` are already styled in
  `assets/css/resources.css` — plain headings and paragraphs, no extra
  markup needed.
- The `<h1>` is the *reading's own title*, not the hub page's title — a
  student on this page should immediately see they're looking at exactly the
  assigned part.
- The `.page-subtitle` doing the "what's excluded and why" explanation is the
  single most important line on the page — it's what replaces the "only" /
  "skip" instruction that used to live in the resource card's description.
- Check the CSS version query strings (`?v=YYYYMMDD-N`) on a sibling page in
  the same directory and match them. If you changed `resources.css` itself
  while doing this, bump its version on every page that loads it (grep the
  whole `public/` tree for `resources.css?v=` to find them all).

## Step 5 — Update the citing resource card

On the page(s) that linked to the original hub URL, change the `href` to the
new local page (relative path, drop `target="_blank"` — it's an internal
link now) or the direct image URL (external, keep `target="_blank"`). Rewrite
the link label and description so they no longer need "only" / "skip" /
"stop before" language — the link itself now points at exactly the right
scope, so the instruction that used to compensate for a bad link isn't
needed anymore. If several cards on the same page cited the same hub URL
for different reasons (e.g. three different GRAPES cards each wanting a
different angle on the same numbered reading), it's fine for all of them to
point at the same one excerpt page — don't fragment a single cohesive
reading into several near-duplicate pages just to give each card its own
target.

## Step 6 — Verify locally before calling it done

```bash
cd "<project>/public" && python3 -m http.server 8000
```

Load the changed region page and click through to each new/changed link.
Confirm: the new page renders with the corkboard/paper styling (same as
every other page on the site), the citation footer is present and links back
to the original, and the region page's resource card shows the cleaned-up
label/description. Stop the server when done.

## Scope — don't over-apply this

Most resource links on this site are fine as-is: a dedicated, single-topic
page that one card points to needs no changes. Only apply this treatment
when there's an actual mismatch — the description names a specific part of
the target, but the link points at more than that. If a resource's
description just describes what a whole, single-topic page is about, leave
it alone.
