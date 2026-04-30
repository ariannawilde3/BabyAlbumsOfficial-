import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Family', 'Wedding', 'Travel', 'Baby', 'Graduation', 'Birthday'],
    },
    style: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    theme: {
      colorPalette: [String],
      fontFamily: { type: String, default: 'Playfair Display' },
      accentFont: { type: String, default: 'sans-serif' },
      borderStyle: { type: String, default: 'none' },
      backgroundPattern: { type: String, default: '' },
      accentElements: [String],
    },
    pages: [
      {
        layout: {
          type: String,
          enum: ['single', 'double', 'collage'],
          default: 'single',
        },
        placeholders: {
          type: Number,
          default: 1,
        },
        rotations: {
          type: [Number],
          default: [],
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Template', templateSchema);
