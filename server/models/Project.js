import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User id is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
    },
    course: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    studyDays: {
      type: Number,
      min: [1, 'Study days must be at least 1'],
      default: 1,
    },
    progress: {
      type: Number,
      min: [0, 'Progress must be between 0 and 100'],
      max: [100, 'Progress must be between 0 and 100'],
      default: 0,
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be between 0 and 100'],
      max: [100, 'Weight must be between 0 and 100'],
      default: 0,
    },
    isProject: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
)

const Project = mongoose.model('Project', projectSchema)

export default Project
