# OfferMate AI Job Matcher Demo

OfferMate is a static demo for an AI job-matching agent. It shows a realistic student resume, parses the candidate profile, ranks multiple roles inside the same company, and lets an admin add a job description that is automatically converted into capability tags.

## Run Locally

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

## Test

```bash
npm test
```

## GitHub Pages

After pushing this repository to GitHub, enable GitHub Pages from:

```text
Settings -> Pages -> Build and deployment -> Deploy from a branch -> main / root
```
