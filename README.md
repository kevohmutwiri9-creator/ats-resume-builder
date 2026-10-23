# ATS Resume Builder

A static, browser-based resume builder and job-application toolkit. The site runs without an application server; resume editing and local saves happen in the visitor's browser.

## Requirements

- Node.js 22 (used by the project scripts and CI)
- npm

## Run locally

```sh
npm ci
npm start
```

Open the local URL printed by `serve` (port 10000 by default). You can also open `index.html` directly, although some browser features work more reliably over HTTP.

## Main features

- Resume builder with templates, browser-local autosave, named local saves, and print-to-PDF.
- Text paste importer with heuristic section parsing. PDF text extraction requires PDF.js to be supplied; it is not bundled. LinkedIn does not provide a working URL importer here.
- ATS keyword comparison and resume-writing guides.
- Illustrative resume examples. Example people, employers, qualifications, and outcomes are fictional and must not be presented as real work history.
- Optional AI and advertising integrations may depend on third-party configuration and user consent. Any API key placed in browser code or page metadata is public; a private AI key requires a server-side proxy.

## Data and privacy

Resume content is stored in browser `localStorage` on the current device. It is not synchronized to an account or backed up by this static app. Clearing browser storage can permanently remove saved resumes. Do not use shared or public devices for sensitive resume data.

Google Drive and Dropbox sync are not configured for production. The current browser-side OAuth implementation contains placeholder credentials and must not be enabled or supplied with client secrets. A production integration needs a reviewed OAuth flow, appropriate provider configuration, and server-side handling for confidential credentials.

LinkedIn URL import is not supported, and the PDF picker stays disabled unless PDF.js is configured. Copy/paste text import remains available.

## Project structure

- Root HTML pages and JavaScript/CSS files: application pages and browser functionality
- `guides/`, `blog-articles/`: editorial content
- `test/`: automated importer tests and an explicitly fictional fixture
- `scripts/`: syntax and static asset checks
- `.github/workflows/ci.yml`: checks on pushes and pull requests

## Checks

```sh
npm test
npm run lint
npm run build
npm run check
```

- `npm test` uses Node's built-in test runner; there are no test-framework dependencies.
- `npm run lint` runs ESLint's undefined-name checks on the builder, resume-data/import modules, tests, and project scripts, then syntax-checks all project JavaScript.
- `npm run build` verifies local script and stylesheet references across HTML pages; this static site does not have a compilation step.
- `npm run check` runs all three checks and is the CI entry point.

## Synthetic test data and licensing

`test/fixtures/synthetic-resume.json` is a single hand-authored, entirely fictional parser fixture. It is test data, not a representative or independently validated employment dataset, and must not be treated as evidence of parsing accuracy or job outcomes. It contains no user-submitted resumes. The repository's MIT license is in [`LICENSE`](./LICENSE); check third-party and dataset licensing separately before redistributing additional data. This small fixture is not a commercial resume dataset and is not evidence of DataFactor eligibility or guaranteed earnings.

## Limitations

- This is a client-side static app, not a hosted account service.
- Premium UI and payment-related screens are demos; no real checkout or paid service is implemented.
- The ATS checker is a keyword aid, not a simulation or guarantee of any employer's applicant-tracking system.
- No dataset licensing income or platform acceptance is promised.
