import mongoose from 'mongoose'

const examSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User id is required'],
      trim: true,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Exam date is required'],
    },
    time: {
      type: String,
      required: [true, 'Exam time is required'],
      trim: true,
    },
    studyDays: {
      type: Number,
      min: [1, 'Study days must be at least 1'],
      default: 1,
    },
    location: {
      building: {
        type: String,
        required: [true, 'Building is required'],
        trim: true,
      },
      room: {
        type: String,
        required: [true, 'Room is required'],
        trim: true,
      },
    },
  },
  { timestamps: true },
)

const Exam = mongoose.model('Exam', examSchema)

export default Exam
