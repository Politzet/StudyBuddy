import mongoose from 'mongoose'

const otherItemSchema = new mongoose.Schema(
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
    deadline: {
      type: Date,
      required: false,
    },
    done: {
      type: Boolean,
      default: false,
    },
    categoryName: {
      type: String,
      trim: true,
      default: 'Other',
    },
  },
  { timestamps: true },
)

const OtherItem = mongoose.model('OtherItem', otherItemSchema)

export default OtherItem
