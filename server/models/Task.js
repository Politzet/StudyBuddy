import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  userId: {
    type: String,
    trim: true,
    default: '',
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [3, 'Title must be at least 3 characters'],
    trim: true,
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true,
  },
  difficulty: {
    type: Number,
    min: [1, 'Difficulty must be between 1 and 5'],
    max: [5, 'Difficulty must be between 1 and 5'],
    default: 1,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  studyDays: {
    type: Number,
    min: [1, 'Study days must be at least 1'],
    default: 1,
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'done'],
    default: 'not_started',
  },
  category: {
    type: String,
    enum: ['tasks', 'tests', 'projects', 'other'],
    default: 'tasks',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const Task = mongoose.model('Task', taskSchema)

export default Task
