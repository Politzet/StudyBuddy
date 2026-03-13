import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User id is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters'],
    },
  },
  { timestamps: true },
)

categorySchema.index({ userId: 1, name: 1 }, { unique: true })

const Category = mongoose.model('Category', categorySchema)

export default Category
