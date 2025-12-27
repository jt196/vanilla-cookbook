import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	datasource: {
		url: process.env.DATABASE_URL || 'file:./prisma/db/dev.sqlite'
	},
	migrations: {
		output: 'prisma/migrations'
	},
	seed: {
		script: 'node ./src/lib/utils/seed/seed.js'
	}
});
