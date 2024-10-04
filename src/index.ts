import Cloudflare from 'cloudflare'
import { logger } from './lib/utils/logger'
import { setupRoutes } from './routes'
import { environment } from './lib/env/env'
import { Hono } from 'hono'

const cf = new Cloudflare({ apiToken: environment.cfToken })

const app = new Hono().basePath("/api")

setupRoutes(app, cf)

Bun.serve({ fetch: app.fetch, port: 3000 })

logger.info("Server started on port 3000")