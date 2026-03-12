import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      minlength: [2, 'Course name must be at least 2 characters'],
      unique: true,
    },
  },
  {
    timestamps: true,
  },
)

const Course = mongoose.model('Course', courseSchema)

export default Course
