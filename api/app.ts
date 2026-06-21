import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initSchema } from './src/db/schema.js'
import { seedData } from './src/db/seed.js'
import itemsRouter from './src/routes/items.js'
import listingsRouter from './src/routes/listings.js'
import salesRouter from './src/routes/sales.js'
import statsRouter from './src/routes/stats.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initSchema()
seedData()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/items', itemsRouter)
app.use('/api/listings', listingsRouter)
app.use('/api/sales', salesRouter)
app.use('/api/stats', statsRouter)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 0,
      message: 'ok',
      data: null,
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    code: 500,
    message: 'Server internal error',
    data: null,
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API not found',
    data: null,
  })
})

export default app
