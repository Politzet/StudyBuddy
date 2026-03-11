import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Task from './models/Task.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman) without an Origin header.
      if (!origin) {
        return callback(null, true)
      }

      const allowedOriginPattern =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/

      if (allowedOriginPattern.test(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/tasks', async (_req, res) => {
  try {
    const tasks = await Task.find().sort({ dueDate: 1, createdAt: -1 })
    res.json(tasks)
  } catch {
    res.status(500).json({ message: 'Failed to fetch tasks' })
  }
})

app.post('/api/tasks', async (req, res) => {
  try {
    const task = await Task.create(req.body)
    res.status(201).json(task)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((item) => item.message)
      return res.status(400).json({ message: 'Validation failed', details })
    }

    return res.status(500).json({ message: 'Failed to create task' })
  }
})

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task id' })
    }

    const task = await Task.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.json(task)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = Object.values(error.errors).map((item) => item.message)
      return res.status(400).json({ message: 'Validation failed', details })
    }

    return res.status(500).json({ message: 'Failed to update task' })
  }
})

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid task id' })
    }

    const task = await Task.findByIdAndDelete(id)

    if (!task) {
      return res.status(404).json({ message: 'Task not found' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete task' })
  }
})

async function startServer() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in server/.env')
  }

  await mongoose.connect(mongoUri)
  app.listen(port, () => {
    console.log(`StudyBuddy API running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Server startup failed:', error)
  process.exit(1)
})
