# Piggery

Farm management for a pig herd. The first farm is stored as data, not hard-coded into the application, so another farm can be added later.

Every pig has an identity. Weights, movements, vaccinations, treatments, breeding, feed, sales, and mortality are historical records. Current summaries are only a cache.

## Setup

1. Put the database connection string in `.env`.

```bash
MONGODB_URI=mongodb://127.0.0.1:27017/piggery
```

Set `AUTH_SECRET` to a long random value. Next.js and the seed script both read this one file.

2. Install, seed the development farm, and start the app.

```bash
npm install
npm run seed
npm run dev
```

The seed refuses to run when `NODE_ENV` is production. It creates **Anthony Pig Farm** and marks the records as development demo data. Replacing that seed requires `SEED_RESET=true`.

Demo password for every seed account: `FarmDemo123!`

- anthony@test.com (owner)
- manager@demo.piggery.test
- worker@demo.piggery.test
- vet@demo.piggery.test
- viewer@demo.piggery.test

## Roles

Permissions are checked on the server for every farm request. Hidden buttons are not the security boundary.

Owners and managers can see sales, expenses, and feed costs. Workers, vets, and viewers cannot. Workers cannot delete historical records; the app does not offer that delete path.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```
