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
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('Template', templateSchema);
