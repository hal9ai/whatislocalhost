#!/usr/bin/env python3
"""Keep generated bits of the static pages in sync with their visible content.

1. FAQPage JSON-LD is rebuilt from each page's visible <div class="faq"> entries,
   so structured data never drifts from what readers see.
2. The no-JS fallback hrefs of the launchpad "Open in ChatGPT / Claude / Grok"
   buttons are rebuilt from the launchpad's data-tpl and its idea placeholder
   (script.js rebuilds them live in the browser).

Run from the repo root after editing FAQ text or prompts:

    python3 tools/sync.py
"""
import glob, html, json, re
from urllib.parse import quote

AI_URL = {
    "chatgpt": "https://chatgpt.com/?q={}",
    "claude": "https://claude.ai/new?q={}",
    "grok": "https://grok.com/?q={}",
    "claudecode": "claude-cli://open?q={}",
}

def plain(fragment):
    text = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()

def sync_faq(page):
    m = re.search(r'<div class="faq">(.*?)\n    </div>\n', page, re.S)
    if not m:
        return page
    qa = re.findall(r"<summary>(.*?)</summary>\s*<div class=\"faq-a\">(.*?)</div>\s*</details>", m.group(1), re.S)
    entities = [{"@type": "Question", "name": plain(q), "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in qa]

    def fix(block):
        data = json.loads(block.group(2))
        for node in data.get("@graph", [data]):
            if node.get("@type") == "FAQPage":
                node["mainEntity"] = entities
        return block.group(1) + json.dumps(data, indent=2, ensure_ascii=False) + "\n" + block.group(3)

    return re.sub(r'(<script type="application/ld\+json">\n)(.*?)\n(</script>)', fix, page, flags=re.S)

def sync_prompts(page):
    out, last = [], 0
    starts = [m.start() for m in re.finditer(r"data-launchpad", page)] + [len(page)]
    for a, b in zip(starts, starts[1:]):
        chunk = page[a:b]
        tpl = re.search(r'data-tpl="([^"]*)"', chunk)
        idea = re.search(r'data-idea[^>]*placeholder="([^"]*)"|placeholder="([^"]*)"[^>]*data-idea', chunk)
        prompt = html.unescape(tpl.group(1)).replace("{idea}", html.unescape(next(g for g in idea.groups() if g))) if tpl and idea else None

        def fix(link):
            tag = link.group(0)
            kind = re.search(r'data-ai="(\w+)"', tag).group(1)
            fixed = re.search(r'data-prompt="([^"]*)"', tag)
            p = html.unescape(fixed.group(1)) if fixed else prompt
            if p is None:
                return tag
            href = AI_URL[kind].format(quote(p, safe="-_.!~*'()"))
            return re.sub(r'href="[^"]*"', 'href="' + html.escape(href, quote=True) + '"', tag)

        out.append(page[last:a])
        out.append(re.sub(r'<a [^>]*data-ai="\w+"[^>]*>', fix, chunk))
        last = b
    out.append(page[last:])
    return "".join(out)

for path in sorted(glob.glob("*.html")):
    src = open(path, encoding="utf-8").read()
    new = sync_prompts(sync_faq(src))
    if new != src:
        open(path, "w", encoding="utf-8").write(new)
        print("updated", path)
