import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  url: String,
  position: { type: Number, default: 0 },
  x: { type: Number, default: 10 },
  y: { type: Number, default: 10 },
  width: { type: Number, default: 40 },
  height: { type: Number, default: 40 },
  rotation: { type: Number, default: 0 },
  zIndex: { type: Number, default: 0 },
}, { _id: false });

const captionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  x: { type: Number, default: 25 },
  y: { type: Number, default: 80 },
  width: { type: Number, default: 50 },
  rotation: { type: Number, default: 0 },
  zIndex: { type: Number, default: 0 },
  fontSize: { type: Number, default: 16 },
  fontFamily: { type: String, default: 'sans-serif' },
  color: { type: String, default: '#333333' },
  align: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
}, { _id: true });

const pageSchema = new mongoose.Schema({
  layout: {
    type: String,
    enum: ['single', 'double', 'collage', 'free'],
    default: 'single',
  },
  images: [imageSchema],
  captions: [captionSchema],
  backgroundColor: { type: String, default: '#ffffff' },
});

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
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
    coverImage: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'ordered'],
      default: 'draft',
    },
    pages: [pageSchema],
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
