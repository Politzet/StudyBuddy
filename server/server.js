import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Task from './models/Task.js'
import Course from './models/Course.js'
import User from './models/User.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT) || 5000
const PASSWORD_SALT_ROUNDS = 10

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

const formatValidationError = (error) => {
  const details = Object.values(error.errors || {}).map((item) => item.message)
  return details.length > 0 ? details : ['Validation failed']
}

const BLOG_LIBRARY = {
  default: [
    {
      id: 'blog-default-1',
      title: 'How to Learn Software Engineering Effectively',
      description:
        'A practical roadmap for building strong engineering fundamentals.',
      url: 'https://roadmap.sh/software-design-architecture',
      sourceCourse: 'General',
    },
    {
      id: 'blog-default-2',
      title: 'The Missing Semester of Your CS Education',
      description:
        'Essential tools and workflows every computer science student should know.',
      url: 'https://missing.csail.mit.edu/',
      sourceCourse: 'General',
    },
  ],
  'מארג שירותי אינטרנט': [
    {
      id: 'blog-web-1',
      title: 'REST APIs: Best Practices for Beginners',
      description:
        'A practical guide to designing readable and maintainable API endpoints.',
      url: 'https://developer.mozilla.org/en-US/docs/Glossary/REST',
      sourceCourse: 'מארג שירותי אינטרנט',
    },
    {
      id: 'blog-web-2',
      title: 'HTTP: Overview',
      description:
        'Understand requests, responses, status codes, and web communication basics.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
      sourceCourse: 'מארג שירותי אינטרנט',
    },
  ],
  'מבוא לתכנות': [
    {
      id: 'blog-intro-1',
      title: 'JavaScript Guide',
      description:
        'Core language concepts, control flow, and clean coding habits.',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      sourceCourse: 'מבוא לתכנות',
    },
    {
      id: 'blog-intro-2',
      title: 'React Official Learn',
      description:
        'Step-by-step introduction to modern React component thinking.',
      url: 'https://react.dev/learn',
      sourceCourse: 'מבוא לתכנות',
    },
  ],
  אלגוריתמים: [
    {
      id: 'blog-algo-1',
      title: 'Big-O Notation Explained',
      description:
        'A student-friendly explanation of complexity analysis with examples.',
      url: 'https://www.geeksforgeeks.org/analysis-algorithms-big-o-analysis/',
      sourceCourse: 'אלגוריתמים',
    },
    {
      id: 'blog-algo-2',
      title: 'Graph Data Structure and Algorithms',
      description:
        'Overview of graph traversal, shortest paths, and common techniques.',
      url: 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/',
      sourceCourse: 'אלגוריתמים',
    },
  ],
  Algorithms: [
    {
      id: 'blog-algo-en-1',
      title: 'Algorithm Design Techniques',
      description:
        'Greedy, dynamic programming, and divide-and-conquer strategies.',
      url: 'https://cp-algorithms.com/',
      sourceCourse: 'Algorithms',
    },
  ],
  'Web Services': [
    {
      id: 'blog-web-en-1',
      title: 'Designing Robust APIs',
      description:
        'Naming conventions, validation, and versioning tips for APIs.',
      url: 'https://swagger.io/resources/articles/best-practices-in-api-design/',
      sourceCourse: 'Web Services',
    },
  ],
}

const shuffleArray = (items) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]]
  }
  return copy
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, userName, password } = req.body
    const hashedPassword = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
    const user = await User.create({ email, userName, password: hashedPassword })
    return res.status(201).json({
      _id: user._id,
      email: user.email,
      userName: user.userName,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        details: formatValidationError(error),
      })
    }
    return res.status(500).json({ message: 'Failed to create account' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email: String(email).toLowerCase().trim() })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isHashedPassword = user.password.startsWith('$2')
    const isPasswordValid = isHashedPassword
      ? await bcrypt.compare(password, user.password)
      : user.password === password

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Upgrade legacy plaintext passwords to bcrypt on successful login.
    if (!isHashedPassword) {
      user.password = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
      await user.save()
    }

    return res.json({
      _id: user._id,
      email: user.email,
      userName: user.userName,
    })
  } catch {
    return res.status(500).json({ message: 'Failed to login' })
  }
})

app.get('/api/moodle/sync', (_req, res) => {
  const moodleAssignments = [
    {
      moodleId: 'mdl-101',
      courseName: 'Web Services',
      title: 'HW3 - Redux',
      dueDate: '2026-03-20T20:00:00.000Z',
    },
    {
      moodleId: 'mdl-102',
      courseName: 'Algorithms',
      title: 'Graph Traversal Practice',
      dueDate: '2026-03-22T18:30:00.000Z',
    },
    {
      moodleId: 'mdl-103',
      courseName: 'Introduction to Programming',
      title: 'Async JavaScript Exercises',
      dueDate: '2026-03-25T16:00:00.000Z',
    },
    {
      moodleId: 'mdl-104',
      courseName: 'Computer Networks',
      title: 'HTTP and REST Quiz Prep',
      dueDate: '2026-03-27T12:00:00.000Z',
    },
  ]

  res.json(moodleAssignments)
})

app.get('/api/resources/blogs', async (_req, res) => {
  try {
    const coursesFromTasks = await Task.distinct('course')
    const normalizedCourses = coursesFromTasks.filter(Boolean)
    const coursesToUse =
      normalizedCourses.length > 0
        ? normalizedCourses
        : ['מבוא לתכנות', 'אלגוריתמים', 'מארג שירותי אינטרנט']

    const collectedBlogs = coursesToUse.flatMap(
      (courseName) =>
        (BLOG_LIBRARY[courseName] || []).map((blog) => ({
          ...blog,
          sourceCourse: blog.sourceCourse || courseName,
        })),
    )

    const fallbackBlogs = BLOG_LIBRARY.default || []
    const payload =
      collectedBlogs.length > 0
        ? shuffleArray(collectedBlogs)
        : shuffleArray(fallbackBlogs)

    return res.json(payload)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch resources' })
  }
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
    const courseExists = await Course.findOne({ name: req.body.course })
    if (!courseExists) {
      return res.status(400).json({ message: 'Selected course does not exist' })
    }

    const task = await Task.create(req.body)
    res.status(201).json(task)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const details = formatValidationError(error)
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

    if (req.body.course) {
      const courseExists = await Course.findOne({ name: req.body.course })
      if (!courseExists) {
        return res.status(400).json({ message: 'Selected course does not exist' })
      }
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
      const details = formatValidationError(error)
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

app.get('/api/courses', async (_req, res) => {
  try {
    const courses = await Course.find().sort({ name: 1 })
    return res.json(courses)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch courses' })
  }
})

app.post('/api/courses', async (req, res) => {
  try {
    const course = await Course.create(req.body)
    return res.status(201).json(course)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course already exists' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        details: formatValidationError(error),
      })
    }
    return res.status(500).json({ message: 'Failed to create course' })
  }
})

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid course id' })
    }

    const oldCourse = await Course.findById(id)
    if (!oldCourse) {
      return res.status(404).json({ message: 'Course not found' })
    }

    const updatedCourse = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (req.body.name && req.body.name !== oldCourse.name) {
      await Task.updateMany({ course: oldCourse.name }, { course: req.body.name })
    }

    return res.json(updatedCourse)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Course already exists' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        details: formatValidationError(error),
      })
    }
    return res.status(500).json({ message: 'Failed to update course' })
  }
})

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid course id' })
    }

    const course = await Course.findById(id)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    const relatedTasksCount = await Task.countDocuments({ course: course.name })
    if (relatedTasksCount > 0) {
      return res
        .status(400)
        .json({ message: 'Cannot delete a course with existing tasks' })
    }

    await Course.findByIdAndDelete(id)
    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete course' })
  }
})

async function startServer() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is missing in server/.env')
  }

  await mongoose.connect(mongoUri)

  const initialCourses = ['מבוא לתכנות', 'אלגוריתמים', 'מארג שירותי אינטרנט']
  await Promise.all(
    initialCourses.map((courseName) =>
      Course.updateOne({ name: courseName }, { name: courseName }, { upsert: true }),
    ),
  )

  app.listen(port, () => {
    console.log(`StudyBuddy API running on http://localhost:${port}`)
  })
}

startServer().catch((error) => {
  console.error('Server startup failed:', error)
  process.exit(1)
})
