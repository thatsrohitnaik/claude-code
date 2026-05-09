Good timing to get your local environment sorted before you start. Here's everything you need:

---

## Machine requirements

A Mac is strongly recommended — iOS simulator only runs on macOS. Windows works for Android-only development but you'll hit friction. Minimum 16GB RAM, 50GB free disk space.

---

## 1. Core system tools

**Homebrew** (Mac package manager — install this first, everything else flows from it)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Git**
```bash
brew install git
git config --global user.name "Your Name"
git config --global user.email "you@email.com"
```

---

## 2. Node.js + package manager

Install Node via `nvm` (Node Version Manager) — never install Node directly, you'll need to switch versions later.

```bash
brew install nvm
nvm install 20
nvm use 20
nvm alias default 20
```

Install `pnpm` as your package manager (the PRD monorepo uses pnpm workspaces):
```bash
npm install -g pnpm
```

---

## 3. Mobile development

**Xcode** (iOS simulator — Mac App Store, ~15GB, install first because it takes forever)
- After install, open it once to accept the license
- Then install command line tools:
```bash
xcode-select --install
```

**Android Studio** (Android emulator)
```bash
brew install --cask android-studio
```
- Open Android Studio → SDK Manager → install Android SDK Platform 34
- Create a virtual device: Pixel 8, API 34

**Expo CLI + EAS CLI**
```bash
npm install -g expo-cli eas-cli
```

**Expo Go app** — install on your real phone from the App Store / Play Store. For early development you won't need a simulator at all — just scan the QR code.

---

## 4. Backend services (local)

**Docker Desktop** — runs PostgreSQL and Redis locally without installing them natively:
```bash
brew install --cask docker
```

Once Docker is running, your `docker-compose.yml` (already in the PRD monorepo) starts everything:
```bash
docker compose up -d
```

This spins up:
- PostgreSQL 16 on `localhost:5432`
- Redis 7 on `localhost:6379`
- pgAdmin (DB browser) on `localhost:5050`

---

## 5. Database tooling

**Prisma CLI** — comes with the project, no global install needed. But install a DB GUI:

**TablePlus** (best PostgreSQL GUI, free tier is enough)
```bash
brew install --cask tableplus
```
Connect to: `postgresql://postgres:postgres@localhost:5432/lifepilot`

---

## 6. API keys to create (free tiers are fine to start)

Go create accounts and grab API keys for these — store them in a `.env.local` file:

| Service | What for | Where |
|---|---|---|
| Anthropic | Claude LLM | console.anthropic.com |
| OpenAI | Embeddings + Whisper | platform.openai.com |
| Clerk | Auth | clerk.com |
| Stripe | Payments (test mode) | dashboard.stripe.com |
| Expo | Push notifications | expo.dev |
| Posthog | Analytics | posthog.com |

Doppler (secrets manager) comes later when you deploy — for local dev a `.env` file is fine.

---

## 7. VS Code + extensions

```bash
brew install --cask visual-studio-code
```

Essential extensions — install all of these:

| Extension | Why |
|---|---|
| Prisma | Schema syntax highlighting + formatting |
| ESLint | Code quality |
| Prettier | Auto formatting |
| TypeScript + JS | Type checking |
| React Native Tools | Debugging RN apps |
| Expo Tools | Expo-specific helpers |
| Thunder Client | API testing (like Postman, inside VS Code) |
| GitLens | Git history inline |
| Turbo Console Log | Quick debug logging |
| Error Lens | Inline error display |

---

## 8. Global CLI tools

```bash
npm install -g typescript tsx turbo
```

- `typescript` — type checking
- `tsx` — run TypeScript files directly without compiling
- `turbo` — Turborepo monorepo task runner

---

## 9. Verify everything works

Run through this checklist:

```bash
node --version        # should print v20.x.x
pnpm --version        # should print 9.x.x
docker --version      # should print Docker version 25+
expo --version        # should print 0.x.x
git --version         # should print git version 2.x.x
```

Then clone the repo, run `docker compose up -d`, run `pnpm install`, and run `pnpm dev` — if the API starts and the Expo QR code appears, you're fully set up.

---

## 10. Recommended Claude Code setup

Since the entire app is being built by AI, install Claude Code — it can read your PRD directly and execute the build phases:

```bash
npm install -g @anthropic-ai/claude-code
```With Claude Code in your terminal and the PRD in your repo, you can literally say *"implement Phase 1 of the PRD"* and it will scaffold the monorepo, run the Prisma migrations, set up Clerk, and check the test checklist — all autonomously.

The full setup takes about 2–3 hours the first time (mostly Xcode downloading). After that, every new dev session is just `docker compose up -d` and `pnpm dev`.