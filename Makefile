encrypt:
	jet encrypt .env.local .env.local.encrypted; \
	jet encrypt .env.dev .env.dev.encrypted; \
	jet encrypt .env.prod .env.prod.encrypted

decrypt:
	jet decrypt .env.local.encrypted env.local; \
	jet decrypt .env.dev.encrypted env.dev; \
	jet decrypt .env.prod.encrypted env.prod
