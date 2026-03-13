import mongoose from 'mongoose'

const testSchema = new mongoose.Schema(
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
      required: [true, 'Course is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required for tests'],
    },
  },
  { timestamps: true },
)

const Test = mongoose.model('Test', testSchema)

export default Test
