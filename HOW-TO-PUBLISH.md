# Publish the VitalKick website on GitHub

This repository is the whole VitalKick website. You need a free GitHub account (you have one: **Medkickfunding**), a computer, and about 10 minutes. No code, no terminal.

When you finish, the site is live at:

**https://medkickfunding.github.io/VitalKicksite/**

---

## What is in this repository

| Item | What it is |
| --- | --- |
| `index.html` and the other `.html` files | The 22 pages of the site: home, How it works, Biomarkers, Validation, For research, five Solutions pages, Book a call, Thank you, FAQ, Contact, Privacy policy, Terms of use, Accessibility, and placeholder pages |
| `assets/` | Images, the reel video (web version, 12 MB), your photos, icons, the 3D and animation files |
| `api/` | The Google Calendar booking code. It only runs on Vercel, not on GitHub (see "Booking calls" below) |
| `_source/` | The files Claude uses to rebuild the site. GitHub does not show this folder as part of the website |
| `vercel.json`, `package.json`, `DEPLOY.md`, `README.md` | Settings and instructions for moving to Vercel later |
| `HOW-TO-PUBLISH.md` | This guide |

The full-quality 1080p reel (184 MB) is not included. GitHub's upload page takes files up to 25 MB, and the site plays the 12 MB web version.

---

## Steps 1 to 3. Done

The repository `Medkickfunding/VitalKicksite` exists and every file is already uploaded. Start at Step 4.

## Step 4. Switch on the website

1. In the repository, click **Settings** (the gear tab along the top).
2. In the left menu, click **Pages**.
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main`, folder `/ (root)`
   - Click **Save**.
4. Wait 1 to 3 minutes, then refresh the page. A box appears at the top: **"Your site is live at https://medkickfunding.github.io/VitalKicksite/"**. Click **Visit site**.

## Step 5. Check it

- [ ] The home page loads and the reel plays
- [ ] Scrolling animates the scan, skin layers and face scan
- [ ] **How it works**, **Biomarkers**, **Validation** and **For research** open from the top menu
- [ ] On **Biomarkers**, tapping a card opens the large panel
- [ ] Every footer link opens a page
- [ ] On **FAQ**, opening a question closes the one before it
- [ ] On your phone, the menu and pages fit the screen

---

## Booking calls on GitHub

GitHub only serves pages. It cannot run the code that writes to your Google Calendar. On the GitHub version of the site, **Book a call** still works: the visitor picks a day, a time and a topic, then taps **Send request by text**, which texts the request to (305) 753-4452. You confirm the time with them.

For bookings to land in your Google Calendar automatically, the site needs Vercel. `DEPLOY.md` has those steps. When you import this repository into Vercel, set **Root Directory** to the top level (leave it blank), not `website`, because in this repository the files sit at the top.

---

## Use your own domain (optional)

1. In the repository: **Settings → Pages → Custom domain**. Type your domain, for example `vitalkick.com`, and click **Save**.
2. At the company where you bought the domain, open its DNS settings and add:

   | Type | Name | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | medkickfunding.github.io |

   Delete any other A or CNAME records for `@` and `www` first, such as a parking page. Do not delete MX or TXT records: those carry your email.
3. Back in **Settings → Pages**, wait for the green "DNS check successful", then tick **Enforce HTTPS**. DNS can take a few minutes to a few hours.

---

## Changing the site later

- **Small change to one page:** ask Claude to make it. Claude rebuilds the pages from `_source/` and gives you the changed files.
- **Upload changed files:** in the repository, click **Add file → Upload files**, drag in the changed files the same way, and commit. Files with the same name are replaced.
- **Let Claude push directly:** in a Claude Code session, ask it to add the repository `Medkickfunding/VitalKicksite`. Once it has access, it can update the site without you uploading anything.

---

## If something goes wrong

| What you see | Why | Fix |
| --- | --- | --- |
| "404 There isn't a GitHub Pages site here" | Pages not switched on yet, or still building | Check Step 4, wait 3 minutes, refresh |
| The page shows plain text with no styling or images | Files were uploaded inside a subfolder | In the repository, check `index.html` is at the top level, not inside `vitalkick-website/`. If it is inside, delete the repository (Settings → bottom of the page) and repeat Steps 2 and 3, dragging the files *inside* the folder |
| Some pages or images missing | Upload stopped part-way | **Add file → Upload files** and drag the missing folder in again (often `assets`) |
| The 3D skin section is blank on one device | That device has 3D graphics turned off | Expected: the page shows a flat drawing instead |
| "Upload failed" on the video | Slow connection | Upload `assets/vitalkick-reel.mp4` on its own |

---

## Before you share the link widely

- The **Privacy policy**, **Terms of use** and **Accessibility** pages are drafts. Have your attorney review them before the app launches, and send Claude your company's legal name, state, mailing address and email to fill in.
- The biomarker explanations need your clinical sign-off.
- Some footer pages (About, Careers, Press, Blog, Help) are placeholders that say they are being written.
