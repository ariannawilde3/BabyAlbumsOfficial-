import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema({
  layout: {
    type: String,
    enum: ['single', 'double', 'collage'],
    default: 'single',
  },
  images: [
    {
      url: String,
      position: Number,
    },
  ],
});

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'Untitled Album',
      trim: true,
    },
    bookSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    bookType: {
      type: String,
      enum: ['physical', 'digital'],
      default: 'physical',
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    pages: [pageSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
