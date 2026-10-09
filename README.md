# whatislocalhost.com

A visual field guide from `127.0.0.1` to the cloud: what localhost is, what ports are, why localhost stops working (and how to fix it), what the cloud physically is, and how to deploy an app so anyone can reach it.

Live at **[whatislocalhost.com](https://whatislocalhost.com)**.

## Chapters

| Page | Topic |
| --- | --- |
| [`index.html`](index.html) | **What is localhost?** Loopback, the journey of a request, `127.0.0.1` vs `0.0.0.0`, URL anatomy |
| [`localhost-ports.html`](localhost-ports.html) | **Localhost ports explained.** Port ranges, ~60 common dev ports, finding what uses a port |
| [`localhost-not-working.html`](localhost-not-working.html) | **Localhost not working?** Fixes for connection refused, port in use, IPv6, Docker, WSL, HTTPS |
| [`what-is-the-cloud.html`](what-is-the-cloud.html) | **What is the cloud, actually?** Regions to containers, IaaS/PaaS/SaaS, latency |
| [`deploy-guide.html`](deploy-guide.html) | **Deploy your app.** The six steps of a deploy, one-sentence deploys with AI agents, platform comparison |

[`llms.txt`](llms.txt) has a plain-text summary of the key facts for AI agents.

## Project layout

It's a plain static site with no build step and no framework.

- `*.html`: one page per chapter, plus `404.html`
- `styles.css`, `script.js`: shared styles and interactive diagrams (all illustrations are inline SVG)
- `fonts/`: self-hosted Space Grotesk and IBM Plex (SIL OFL, see [`fonts/LICENSE.txt`](fonts/LICENSE.txt))
- `og/`: social preview cards
- `nginx.conf`, `Dockerfile`: production server (nginx on port 8080)
- `tools/`: maintenance scripts
  - `sync.py`: rebuilds FAQ JSON-LD and no-JS AI prompt links from page content
  - `og.mjs`: renders the `og/` preview cards with headless Chrome
  - `landmask.py`: generates the land mask used by the dotted globes

## Running locally

Any static file server works:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Or run it the way production does:

```sh
docker build -t whatislocalhost .
docker run -p 8080:8080 whatislocalhost
# open http://localhost:8080
```

After editing FAQ text or launchpad prompts, run `python3 tools/sync.py`. If you change `styles.css` or `script.js`, bump the `?v=` version in the HTML so cached copies refresh.

## Deploying

The site is deployed on [Cloudish](https://cloudish.ai). From the repo root, with a coding agent:

```sh
claude "Deploy this project to cloudish.ai and give me the live URL. Instructions: https://cloudish.ai/skill.md"
```

## Credits

- **[Cloudish](https://cloudish.ai)** hosts the site and powers the one-sentence deploys described in the deploy guide.
- **[Hal9](https://hal9.com)** built this project.
