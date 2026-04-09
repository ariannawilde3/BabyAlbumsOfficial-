import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../models/Template.js';

dotenv.config();

const TEMPLATES = [
  {
    name: 'Family Memories',
    category: 'Family',
    price: 49.99,
    description: 'Perfect for capturing family moments and celebrations',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
    ],
  },
  {
    name: 'Wedding Album',
    category: 'Wedding',
    price: 89.99,
    description: 'Elegant wedding album with premium layouts',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
    ],
  },
  {
    name: 'Travel Journal',
    category: 'Travel',
    price: 39.99,
    description: 'Document your adventures in style',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
    ],
  },
  {
    name: "Baby's First Year",
    category: 'Baby',
    price: 44.99,
    description: 'Capture every precious milestone',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
    ],
  },
  {
    name: 'Graduation Day',
    category: 'Graduation',
    price: 34.99,
    description: 'Celebrate academic achievements',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
    ],
  },
  {
    name: 'Birthday Bash',
    category: 'Birthday',
    price: 29.99,
    description: 'Make birthday memories last forever',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&h=400&fit=crop',
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'single', placeholders: 1 },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Template.deleteMany({});
    console.log('Cleared existing templates');

    const created = await Template.insertMany(TEMPLATES);
    console.log(`Seeded ${created.length} templates`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
