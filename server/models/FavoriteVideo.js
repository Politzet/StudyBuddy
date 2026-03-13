import mongoose from 'mongoose'

const favoriteVideoSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, 'User id is required'],
      trim: true,
    },
    videoId: {
      type: String,
      required: [true, 'Video id is required'],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    channelTitle: {
      type: String,
      trim: true,
      default: '',
    },
    thumbnail: {
      type: String,
      trim: true,
      default: '',
    },
    youtubeUrl: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    assignmentName: {
      type: String,
      trim: true,
      default: '',
    },
    personalNote: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

favoriteVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true })

const FavoriteVideo = mongoose.model('FavoriteVideo', favoriteVideoSchema)

export default FavoriteVideo
