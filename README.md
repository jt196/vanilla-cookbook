# Getting Started

1. Clone the repo: `git clone https://github.com/jt196/sveltekit-lucia-prisma.git`
2. Install the base packages: `npm i`
3. Initialise the Prisma db: `npx prisma migrate dev --name init`
4. Generate the Prisma client and types (is this typescript?): `npx prisma generate`

# v1.0 Differences

More info [here](https://lucia-auth.com/start-here/migrate-to-version-1?sveltekit)

1. The **database schema** has been every so slightly tweaked. The basic concepts and relations between models hasn't changed but check the docs for the latest version
2. The SvelteKit integration has been deprecated. Wait! **SvelteKit support is now built into the main library.** Check the [getting started page](https://lucia-auth.com/start-here/getting-started?sveltekit) for SvelteKit in the docs on how to set up the handle hook!
3. **API name changes**. There hasn't been any drastic name changes so you should be able to infer it from the autocomplete.
