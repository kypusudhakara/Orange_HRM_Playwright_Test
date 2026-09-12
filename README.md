# OrangeHRM employee lifecycle automation

Playwright + TypeScript test for the supplied QA automation assessment. It logs in to the [OrangeHRM public demo](https://opensource-demo.orangehrmlive.com/), creates an employee from JSON with a profile image, searches by employee ID, updates job details, compares the UI to OrangeHRM's authenticated API, deletes the employee, and verifies logout.

## Run locally

Prerequisites: Node.js 20+ and internet access to the OrangeHRM demo and npm.

```bash
npm ci
npx playwright install --with-deps chromium
cp .env.example .env  # optional; on Windows, copy .env.example .env
npm run typecheck
npm test
npm run report
```

The runner uses the demo URL and credentials printed in the assignment by default. Override them in `.env` or export `BASE_URL`, `ORANGEHRM_USERNAME`, and `ORANGEHRM_PASSWORD` in your shell/CI. For example, in PowerShell: `$env:ORANGEHRM_USERNAME='Admin'; $env:ORANGEHRM_PASSWORD='admin123'; npm test`. Do not commit private credentials.

The HTML report is generated in `playwright-report/index.html` after `npm test`. Video is recorded on every run in `test-results/`; the report links to its video attachment. Failures retain a screenshot and trace. Both output directories are excluded from Git by default. If an assessor requires them in a GitHub submission, run the suite with access to the demo and attach the genuine report/video to a release or share the report and video separately. No report or video is fabricated in this source archive.

For GitHub, push this project to your repository and run **Actions → OrangeHRM employee lifecycle → Run workflow**. The workflow uploads the actual report, video, and traces as a downloadable run artifact even if the test fails. Review the run before sharing results with an assessor.

## Structure

| Path | Purpose |
| --- | --- |
| `tests/employee-lifecycle.spec.ts` | One end-to-end test with named stages, assertions and failure cleanup |
| `src/fixtures/app.fixture.ts` | Typed page-object and authenticated API fixtures |
| `src/pages/` | Login, dashboard, PIM list, and employee form/job page objects |
| `src/api/employee.api.ts` | HTTP verification through the browser context's session cookies |
| `src/data/employee.json` | Editable input data; IDs and surname suffixes are unique for each run |
| `assets/profile.png` | Test profile picture |
| `playwright.config.ts` | Chromium, timeouts, HTML reporter, trace, video and screenshot settings |

## Notes on the shared demo

- The API assertions query **the same OrangeHRM employee** by its server-assigned employee number. A public mock API such as ReqRes would not contain a record created through this UI and cannot establish UI/API consistency.
- After UI deletion, the API check searches for the exact employee ID and requires a successful response with zero records. The public demo may answer 422 for a detail GET on a deleted employee; a 422 by itself cannot establish that deletion succeeded.
- OrangeHRM's Job screen labels the field **Employment Status**; the API may return its value as `empStatus` or `employmentStatus`. The API adapter accepts both, but throws with available field names if neither is present. It never substitutes the expected UI value for missing API data.
- API calls share cookies with the browser context. If your OrangeHRM installation disables session-based API access or changes endpoints, supply its documented OAuth token / endpoint in `src/api/employee.api.ts`; do not replace a failed check with a mocked success.
- `employee.json` chooses `Software Engineer` and `Full-Time Permanent`; if these options are absent from a customized instance, update the JSON to options present there. The test fails with a descriptive assertion rather than silently choosing another value.
- The demo is shared and may be reset or modified by others. The test runs in one worker, generates a fresh ID and tries to delete its record on failure. If the server becomes unavailable, rerun after it recovers; do not treat an unavailable service as a pass.

## Dependencies and documentation

The test dependency is `@playwright/test`; `dotenv` loads local configuration, while TypeScript and `@types/node` support development. `package-lock.json` pins the installed tree for `npm ci`. For maintenance see [Playwright fixtures](https://playwright.dev/docs/test-fixtures), [API testing](https://playwright.dev/docs/api-testing), [HTML reports](https://playwright.dev/docs/test-reporters), [videos](https://playwright.dev/docs/videos), and [OrangeHRM REST API](https://api-starter-orangehrm.readme.io/reference/get-started).

**Execution status for this archive:** Code and type checks are performed during packaging. The live OrangeHRM scenario, HTML execution report, and video must be generated in an environment that can reach the demo; they are not included as evidence of a run that never occurred.
