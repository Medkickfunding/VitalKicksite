# Deploying the VitalKick website to Vercel and a custom domain

This file is written for whoever connects the site to Vercel and the domain, a person or a Claude session with access to the VitalKick Vercel account and the domain's DNS. Follow it top to bottom. Nothing here needs code changes.

## What this site is

- Static files in this folder (`website/`): HTML, CSS, JavaScript, images, one video. There is **no build step**.
- Two small server functions in `api/` power the **Book a call** page: `api/availability.js` reads free times from Dr. Bizanti's Google Calendar and `api/book.js` adds the booked call to it. Files starting with `_` are shared code, not routes.
- `package.json` here has **no dependencies and no scripts**. It only tells Node that `api/` uses ES modules. Vercel's install step finishes in seconds.
- `vercel.json` in this folder turns on clean URLs (`/research` serves `research.html`) and sets caching and security headers.
- The site deploys and works with **no environment variables**. Until the two Google variables in Step 3 are set, the booking page still works: the visitor picks a time and sends the request by text message instead of it landing in the calendar.

## Do not touch the app's Vercel project

The repository root has its own `vercel.json`. It builds the VitalKick **app** (`pnpm build:web` into `apps/mobile/dist`). That file belongs to the app. Leave it alone.

The website must be a **separate Vercel project** whose Root Directory is `website`. With that setting, Vercel reads `website/vercel.json` and ignores the root one.

## Step 1: Create the Vercel project

1. In Vercel, click **Add New → Project**.
2. Import the GitHub repository **`Medkickfunding/vitalkick-app`**. If it is not listed, click **Adjust GitHub App Permissions** and grant the Vercel GitHub App access to this repository.
3. On the configuration screen:
   - **Project Name:** `vitalkick-website`. Do not reuse the app's project.
   - **Framework Preset:** `Other`
   - **Root Directory:** click **Edit**, choose `website`
   - **Build Command:** leave empty, or turn the override on with an empty value
   - **Output Directory:** leave empty (the root directory itself is served)
   - **Install Command:** leave empty
   - **Environment Variables:** none for now (added in Step 3)
4. Click **Deploy**.
5. **Production branch** is `main`. The website reaches `main` when pull request "feat(website): add VitalKick marketing website" is merged. If the project is created before the merge, the first deploy fails because `website/` does not exist on `main` yet. Merge, then click **Redeploy**.

### Check the deployment

Open the `*.vercel.app` address Vercel shows and confirm:

- [ ] Home page loads, the reel video plays muted, and **Play with sound** works
- [ ] Scrolling animates the scan, skin layers, face scan and logo sections
- [ ] `/research`, `/validation`, `/contact` and `/privacy-policy` load (clean URLs, no `.html`)
- [ ] Every footer link opens a page (many are "being written" placeholders, which is expected)
- [ ] In the biomarker explorer, clicking a reading swaps the right-hand panel without the page jumping
- [ ] `/biomarkers` shows 10 cards; clicking one opens the large panel with four numbered points
- [ ] `/book` shows days and times; before Step 3, confirming leads to a "Send request by text" button

## Step 2: Connect the domain

1. In the `vitalkick-website` project, go to **Settings → Domains**.
2. Add the apex domain (for example `example.com`), then add the `www` version too.
3. Vercel asks which one is primary. Make the **apex** primary and set `www` to **redirect** to it (308).
4. Vercel then shows the exact DNS records it needs. **Use the values Vercel shows on that screen**: they can be project-specific, so copy them rather than values from memory. Typically:
   - Apex (`@`): an **A** record pointing at the IP Vercel lists
   - `www`: a **CNAME** pointing at the hostname Vercel lists
5. At the domain registrar or DNS provider:
   - Delete any existing **A**, **AAAA** or **CNAME** records for `@` and `www` that point somewhere else, such as an old site or a parking page.
   - Do **not** delete **MX** or **TXT** records. Those carry email and verification and are unrelated to the website.
   - Add the records from step 4.
6. Back in Vercel, wait for both domains to show **Valid Configuration**. DNS can take from a few minutes to a few hours.
7. HTTPS certificates are issued automatically once DNS is valid. Nothing to configure.

### If the domain is managed by Vercel itself

If the domain was bought through Vercel, or its nameservers already point to Vercel, adding it in **Settings → Domains** is enough. Vercel creates the records itself.

## Step 3: Connect the Book a call page to Google Calendar

The booking functions sign in to Google as a **service account** (a robot Google account owned by VitalKick). Dr. Bizanti shares his calendar with that robot, and the functions can then see when he is busy and add booked calls. Nobody's password is stored anywhere.

### 3a. Create the service account (Google Cloud Console)

1. Go to https://console.cloud.google.com and sign in with the VitalKick Google account.
2. At the top, open the project picker, click **New Project**, name it `vitalkick-website`, click **Create**, then select it.
3. In the search bar type **Google Calendar API**, open it, click **Enable**.
4. Open **IAM & Admin → Service Accounts → Create service account**. Name: `website-booking`. Click **Create and continue**, skip the optional role and user steps, click **Done**.
5. Click the new service account, open the **Keys** tab, **Add key → Create new key → JSON → Create**. A `.json` file downloads. Treat it like a password: do not email it, do not commit it.
6. Copy the service account's email address. It looks like `website-booking@vitalkick-website.iam.gserviceaccount.com`.

If **Create new key** is blocked by an organization policy (`iam.disableServiceAccountKeyCreation`), a Google Workspace admin has to allow key creation for this project first.

### 3b. Share the calendar with it (Dr. Bizanti does this)

1. Open https://calendar.google.com on a computer.
2. On the left, hover over the calendar calls should go into, click **⋮ → Settings and sharing**.
3. Under **Share with specific people or groups**, click **Add people and groups**, paste the service account email from 3a step 6, set permission to **Make changes to events**, click **Send**.
4. Further down, under **Integrate calendar**, copy the **Calendar ID**. For a main calendar it is the Gmail or Workspace address itself.

If the share is refused, the Workspace admin has blocked sharing outside the organization. In the Admin console go to **Apps → Google Workspace → Calendar → Sharing settings → External sharing options for primary calendars** and allow **Share all information, and outsiders can change calendars**, or use a secondary calendar created for bookings.

### 3c. Add the two variables in Vercel

In the `vitalkick-website` project: **Settings → Environment Variables**. Add both for **Production** (and Preview if you want test deploys to book too):

| Name | Value |
| --- | --- |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The entire contents of the `.json` file from 3a step 5, pasted as is |
| `GOOGLE_CALENDAR_ID` | The Calendar ID from 3b step 4 |

Mark `GOOGLE_SERVICE_ACCOUNT_KEY` as **Sensitive**. Then **Deployments → ⋯ on the latest → Redeploy**. Variables only take effect on a new deploy.

### 3d. Check it

1. Open `https://<the site>/api/availability`. It should show `{"slots":[...` with times. `{"configured":false}` means a variable is missing or the key was pasted incompletely. `{"error":"calendar unavailable"}` means the share in 3b has not taken effect or the Calendar ID is wrong.
2. Book a test call on `/book`. The thank-you page should say **Confirmed · in the calendar**, and the event should appear in the calendar with the visitor's name, phone, email and topic in its description.

### Booking rules

Weekdays, 9:00 to 17:00 Eastern, 30-minute calls, from 4 hours ahead up to 14 days out. Times already busy in the calendar are hidden, and each booking re-checks the calendar so two people cannot take the same time. To change these, edit the constants at the top of `api/_slots.js` **and** the matching line at the top of the script in `book.html`.

The booking form collects name, phone, email, organisation, a note and the topic. It does not ask for health information, and the privacy policy says so. Visitors are not added as calendar guests (a service account cannot invite people without Workspace-wide delegation), so Dr. Bizanti follows up by phone or email; the visitor adds the call to their own calendar from the thank-you page.

## Step 4: After it is live

- [ ] Visit `https://` + the apex domain and the `www` version; `www` should redirect to the apex
- [ ] The padlock shows a valid certificate on both
- [ ] Book a test call on the live site, check it appears in Dr. Bizanti's calendar, then delete the test event
- [ ] Share the live address with Dr. Bizanti

## Things to leave as they are

- **Health copy.** Every word on these pages passed the banned-phrase list in `packages/clinical/src/phrasing.ts` (no diagnosis words, no billing terms, no regulatory claims such as "FDA cleared" or "clinically validated"). Do not edit health wording while deploying. Any copy change goes back to Dr. Bizanti.
- **Privacy policy, terms of use and accessibility statement** are drafts written from the product's own decisions (`docs/DECISIONS.md` D-001, D-006, D-007). An attorney should review them before the app launches. Do not edit them while deploying.
- **The pilot request form** has no server. It opens a pre-filled text message to (305) 753-4452. When VitalKick has an email inbox, replace the submit handler in `research.html` with a form service or a small Vercel function that emails the request, and update `privacy-policy.html` to match.
- **`assets/three.module.min.js`** is a vendored copy of three.js 0.170.0 used by the 3D skin section. It is excluded from the repo's lint and formatting checks on purpose.

## Troubleshooting

| What you see | Cause | Fix |
| --- | --- | --- |
| Deploy fails with "No such directory: website" | Project created before the website reached `main` | Merge the pull request, then **Redeploy** |
| Deploy runs `pnpm install` or `pnpm build:web` | Root Directory not set, so the app's root `vercel.json` was used | **Settings → Build and Deployment → Root Directory** = `website`, then redeploy |
| The app's site changed or broke | The website was added to the app's Vercel project by mistake | Remove the domain from the app project and create the separate `vitalkick-website` project as in Step 1 |
| Domain stuck on "Invalid Configuration" | Old A/CNAME records still present, or DNS not yet propagated | Remove the old records, keep only the ones Vercel shows, wait and refresh |
| `/book` says "Send request by text" after Step 3 | Variables added but not redeployed, or added to Preview only | Check both are on Production, then **Redeploy** |
| `/api/availability` returns 404 | Root Directory is not `website`, so `api/` was not found | Set Root Directory to `website`, redeploy |
| 3D skin section is blank on a device | That device has WebGL turned off | Expected: the page falls back to a flat drawing |
