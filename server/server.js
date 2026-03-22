import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import Task from './models/Task.js'
import Course from './models/Course.js'
import User from './models/User.js'
import Category from './models/Category.js'
import Exam from './models/Exam.js'
import Project from './models/Project.js'
import OtherItem from './models/OtherItem.js'
import FavoriteVideo from './models/FavoriteVideo.js'

dotenv.config()

const app = express()
// Default 5050: macOS often binds AirPlay Receiver to 5000, which breaks local API.
const port = Number(process.env.PORT) || 5050
const PASSWORD_SALT_ROUNDS = 10
const DEFAULT_CATEGORY_NAMES = ['Tasks', 'Tests', 'Projects', 'Other']
const MONGO_CONNECT_MAX_ATTEMPTS = Number(process.env.MONGO_CONNECT_MAX_ATTEMPTS || 0)
const MONGO_CONNECT_RETRY_DELAY_MS = Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 2000)
const configuredCorsOrigins = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const vercelProductionOrigins = new Set([
  'https://study-buddy-wizard.vercel.app',
  'https://studybuddy-wizard.vercel.app',
])

const isAllowedVercelPreviewOrigin = (origin) =>
  /^https:\/\/study-buddy-wizard-[a-z0-9-]+\.vercel\.app$/i.test(origin)

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true
  }

  const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
  if (localhostPattern.test(origin)) {
    return true
  }

  if (configuredCorsOrigins.includes(origin) || vercelProductionOrigins.has(origin)) {
    return true
  }

  return isAllowedVercelPreviewOrigin(origin)
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, Postman), localhost dev,
      // and configured/deployed frontend origins.
      if (isAllowedOrigin(origin)) {
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

const parseUserId = (req) => String(req.query.userId || req.body.userId || '').trim()

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
  const moodleCourseAssignments = {
    'Programming ReactJS': [
      'React Homework #1 - Build 3 Pages from Your Site',
      'React Homework #2 - Router & Context',
      'React Homework #3 - Custom Hooks + Redux Toolkit',
      'Final Project - React Course',
    ],
    'Computer Architecture': [
      'HW1: Stored Program and the CPU',
      'HW2: Machine Instructions, Instruction Cycle, and Control Unit',
      'HW3: CPU Structure, ISA 32/64 bit, CISC vs RISC Philosophies',
      'HW4: Pipeline, Latency, and Throughput',
      'HW5: Cache Memory Hierarchy',
    ],
    'Software Quality Engineering': [
      'Introduction to Software Testing',
      'Test Types and Techniques',
      'STP, STD, and STR Documentation',
      'Risk Management in QA',
      'Inspections and Verification Processes',
      'Fault Tolerance',
      'AI in Software Testing',
      'Software Metrics',
      'Testing in Startups',
      'Test Automation',
      'Chaos Testing',
    ],
    Cryptography: [
      'HW1: Greatest Common Divisor (GCD)',
      'HW2: Systems of Equations',
      'HW3: Modular Exponentiation',
      'HW4: Primality Testing',
      'HW5: Group Theory',
      'HW6: Diffie-Hellman Key Exchange (DHKE)',
      'HW7: Elliptic Curve Cryptography (ECC)',
      'HW8: Solving Discrete Logarithm Problem (DLP)',
      'HW9: RSA Algorithm',
      'HW10: Digital Signatures',
      'HW11: Linear-Feedback Shift Register (LFSR)',
      'HW12: Fields and Galois Fields',
    ],
    'Software Engineering Methods': [
      'Project One-Pager Submission',
      'UML Modeling Assignment',
      'Software Requirements Specification (SRS) Submission',
      'Software Design Description (SDD) Submission',
      'Module Design and Development Selection',
      'Low-Level Design (LLD)',
      'Final Project Submission',
    ],
    'Logic Design & Assembly': [
      'HW: Transistor as a Switch',
      'HW: Logic Gates',
      'HW: Combinational Comparison Logic',
      'HW: Combinational Logic to ALU',
      'HW: Latches, Flip-Flops, and Registers',
      'HW: Memory Structures',
      'HW: The System Bus',
      'HW: Microinstructions and Register Transfer Language (RTL)',
      'HW: RTL and CPU Grammar',
      'HW: CPU Instruction Format',
      'HW: The Assembler',
      'HW: CPU Control Unit',
      'HW: Assembly Full Cycle & Microcode',
      'HW: Interrupt Cycle and Basics',
      'HW: CPU Re-design (TCM & MRI)',
      'HW: Stack Operations & Adding Instructions',
    ],
    'Scientific Programming in Python': [
      'Point 2D Implementation',
      'Dataset Selection',
      'DataSummary API Development',
      'Dataset Preparation',
      'Final Project: Dataset Analysis',
    ],
    'System Programming (Linux)': [
      'Working in a Linux Environment',
      'The Linux File System Structure',
      'File Types, Ownership, and Permissions',
      'System Calls and Error Handling',
      'File I/O Operations: read(), write()',
      'Processes, Threads, and Fork/Exec',
      'Bash Program Logic',
      'Race Conditions and Mutex Mechanisms',
      'Sockets Programming: Iterative and Concurrent Server Models',
    ],
  }

  const tasks = Object.entries(moodleCourseAssignments).flatMap(
    ([course, assignmentTitles], courseIndex) =>
      assignmentTitles.map((title, assignmentIndex) => {
        const dueDate = new Date(
          Date.UTC(2026, 3, 1 + courseIndex * 3 + assignmentIndex, 17, 0, 0),
        )
        return {
          id: `mdl-task-${courseIndex + 1}-${assignmentIndex + 1}`,
          title,
          course,
          dueDate: dueDate.toISOString(),
        }
      }),
  )

  res.json({
    tasks,
    exams: [
      {
        id: 'exam-sem-2026-05-15',
        course: 'Software Engineering Methods',
        date: '2026-05-15',
        time: '14:00-17:00',
        location: { building: 'Pernick', room: '247' },
      },
      {
        id: 'exam-logic-2026-05-22',
        course: 'Logic Design (Assembly)',
        date: '2026-05-22',
        time: '14:00-17:00',
        location: { building: 'Pernick', room: '247' },
      },
      {
        id: 'exam-arch-2026-06-01',
        course: 'Computer Architecture',
        date: '2026-06-01',
        time: '14:00-17:00',
        location: { building: 'Pernick', room: '247' },
      },
      {
        id: 'exam-sqe-2026-06-10',
        course: 'Software Quality Engineering',
        date: '2026-06-10',
        time: '14:00-17:00',
        location: { building: 'Pernick', room: '247' },
      },
      {
        id: 'exam-linux-2026-06-20',
        course: 'System Programming (Linux)',
        date: '2026-06-20',
        time: '14:00-17:00',
        location: { building: 'Mitchell', room: '2103' },
      },
    ],
    projects: [
      {
        id: 'project-reactjs-final',
        title: 'Final Project - Full Stack StudyBuddy App',
        course: 'Programming ReactJS',
        deadline: '2026-07-01T23:59:00.000Z',
        weight: 35,
      },
      {
        id: 'project-sem-final',
        title: 'Final Group Project Submission',
        course: 'Software Engineering Methods',
        deadline: '2026-06-15T23:59:00.000Z',
        weight: 30,
      },
      {
        id: 'project-python-final',
        title: 'Dataset Analysis Final Project',
        course: 'Scientific Programming (Python)',
        deadline: '2026-05-25T23:59:00.000Z',
        weight: 25,
      },
    ],
  })
})

app.get('/api/favorite-videos', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const favorites = await FavoriteVideo.find({ userId }).sort({ updatedAt: -1 })
    return res.json(favorites)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch favorite videos' })
  }
})

app.post('/api/favorite-videos', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const payload = {
      userId,
      videoId: req.body.videoId,
      title: req.body.title,
      channelTitle: req.body.channelTitle,
      thumbnail: req.body.thumbnail,
      youtubeUrl: req.body.youtubeUrl,
      course: req.body.course,
      assignmentName: req.body.assignmentName,
      personalNote: req.body.personalNote || '',
    }

    const favorite = await FavoriteVideo.findOneAndUpdate(
      { userId, videoId: payload.videoId },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    )

    return res.status(201).json(favorite)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to save favorite video' })
  }
})

app.put('/api/favorite-videos/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid favorite video id' })
    }

    const favorite = await FavoriteVideo.findByIdAndUpdate(
      id,
      { personalNote: req.body.personalNote || '' },
      { new: true, runValidators: true },
    )

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite video not found' })
    }

    return res.json(favorite)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to update favorite video note' })
  }
})

app.delete('/api/favorite-videos/:id', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid favorite video id' })
    }

    const deleted = await FavoriteVideo.findOneAndDelete({ _id: id, userId })
    if (!deleted) {
      return res.status(404).json({ message: 'Favorite video not found' })
    }

    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete favorite video' })
  }
})

app.get('/api/categories', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    await Promise.all(
      DEFAULT_CATEGORY_NAMES.map((name) =>
        Category.updateOne({ userId, name }, { userId, name }, { upsert: true }),
      ),
    )

    const categories = await Category.find({ userId }).sort({ createdAt: 1 })
    return res.json(categories)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

app.post('/api/categories', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    const category = await Category.create({
      userId,
      name: req.body.name,
    })

    return res.status(201).json(category)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category already exists' })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        details: formatValidationError(error),
      })
    }
    return res.status(500).json({ message: 'Failed to create category' })
  }
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
    const userId = parseUserId(_req)
    const category = String(_req.query.category || '').trim()
    const query = {}

    if (userId) {
      query.userId = userId
    }
    if (category === 'tasks') {
      query.category = 'tasks'
    } else if (category) {
      query.category = category
    }

    const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 })
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

    const task = await Task.create({
      ...req.body,
      category: req.body.category || 'tasks',
      userId: req.body.userId || '',
      moodleSyncId: String(req.body.moodleSyncId || '').trim(),
    })
    res.status(201).json(task)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This Moodle task was already imported' })
    }
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

app.get('/api/exams', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const exams = await Exam.find({ userId }).sort({ date: 1, createdAt: -1 })
    return res.json(exams)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch exams' })
  }
})

app.post('/api/exams', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const exam = await Exam.create({
      ...req.body,
      userId,
      moodleSyncId: String(req.body.moodleSyncId || '').trim(),
    })
    return res.status(201).json(exam)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This Moodle exam was already imported' })
    }
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to create exam' })
  }
})

app.put('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid exam id' })
    }

    const exam = await Exam.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' })
    }
    return res.json(exam)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to update exam' })
  }
})

app.delete('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid exam id' })
    }
    const exam = await Exam.findByIdAndDelete(id)
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' })
    }
    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete exam' })
  }
})

app.get('/api/projects', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const projects = await Project.find({ userId }).sort({ deadline: 1, createdAt: -1 })
    return res.json(projects)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch projects' })
  }
})

app.post('/api/projects', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const project = await Project.create({
      ...req.body,
      userId,
      moodleSyncId: String(req.body.moodleSyncId || '').trim(),
    })
    return res.status(201).json(project)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This Moodle project was already imported' })
    }
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to create project' })
  }
})

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid project id' })
    }
    const project = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.json(project)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to update project' })
  }
})

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid project id' })
    }
    const project = await Project.findByIdAndDelete(id)
    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }
    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete project' })
  }
})

app.get('/api/others', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const categoryName = String(req.query.categoryName || '').trim()
    const query = { userId }
    if (categoryName) {
      query.categoryName = categoryName
    }
    const items = await OtherItem.find(query).sort({ deadline: 1, createdAt: -1 })
    return res.json(items)
  } catch {
    return res.status(500).json({ message: 'Failed to fetch other items' })
  }
})

app.post('/api/others', async (req, res) => {
  try {
    const userId = parseUserId(req)
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    const item = await OtherItem.create({ ...req.body, userId })
    return res.status(201).json(item)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to create item' })
  }
})

app.put('/api/others/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid item id' })
    }
    const item = await OtherItem.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    return res.json(item)
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res
        .status(400)
        .json({ message: 'Validation failed', details: formatValidationError(error) })
    }
    return res.status(500).json({ message: 'Failed to update item' })
  }
})

app.delete('/api/others/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid item id' })
    }
    const item = await OtherItem.findByIdAndDelete(id)
    if (!item) {
      return res.status(404).json({ message: 'Item not found' })
    }
    return res.status(204).send()
  } catch {
    return res.status(500).json({ message: 'Failed to delete item' })
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

  let attempt = 0
  while (true) {
    attempt += 1
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      console.log('MongoDB connected successfully.')
      break
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}${
          MONGO_CONNECT_MAX_ATTEMPTS > 0 ? `/${MONGO_CONNECT_MAX_ATTEMPTS}` : ''
        } failed:`,
        error?.message || error,
      )
      const reachedMaxAttempts =
        MONGO_CONNECT_MAX_ATTEMPTS > 0 && attempt >= MONGO_CONNECT_MAX_ATTEMPTS
      if (reachedMaxAttempts) {
        throw error
      }
      await new Promise((resolve) => setTimeout(resolve, MONGO_CONNECT_RETRY_DELAY_MS))
    }
  }

  const initialCourses = ['מבוא לתכנות', 'אלגוריתמים', 'מארג שירותי אינטרנט', 'General']
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
