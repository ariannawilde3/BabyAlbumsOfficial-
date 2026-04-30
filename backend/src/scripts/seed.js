import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Template from '../models/Template.js';

dotenv.config();

const TEMPLATES = [
  {
    name: 'Classic Baby',
    category: 'Baby',
    style: 'classic',
    price: 44.99,
    description: 'Timeless elegance with soft whites and creams. Simple single-photo layouts let every moment shine.',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=400&fit=crop',
    theme: {
      colorPalette: ['#FFFDF7', '#F5F0E8', '#D4C5A9', '#8B7D6B', '#FFFFFF'],
      fontFamily: 'Playfair Display',
      accentFont: 'Lora',
      borderStyle: 'thin',
      backgroundPattern: '',
      accentElements: [],
    },
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
    ],
  },
  {
    name: 'Modern Minimal',
    category: 'Baby',
    style: 'modern',
    price: 44.99,
    description: 'Clean lines and generous whitespace. Black and white accents for a contemporary feel.',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop',
    theme: {
      colorPalette: ['#FFFFFF', '#F5F5F5', '#E0E0E0', '#333333', '#000000'],
      fontFamily: 'DM Sans',
      accentFont: 'Inter',
      borderStyle: 'none',
      backgroundPattern: '',
      accentElements: [],
    },
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
    ],
  },
  {
    name: 'Floral Garden',
    category: 'Baby',
    style: 'floral',
    price: 49.99,
    description: 'Pastel pinks and soft greens with decorative floral borders. A dreamy garden theme.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop',
    theme: {
      colorPalette: ['#FFF0F5', '#F8E8EE', '#D4A5A5', '#7D9B76', '#F5F0E8'],
      fontFamily: 'Playfair Display',
      accentFont: 'Dancing Script',
      borderStyle: 'decorative',
      backgroundPattern: 'floral-light',
      accentElements: ['florals', 'leaves', 'butterflies'],
    },
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'single', placeholders: 1 },
    ],
  },
  {
    name: 'Woodland Adventure',
    category: 'Baby',
    style: 'woodland',
    price: 49.99,
    description: 'Earthy tones with illustrated animal accents. A cozy, nature-inspired album.',
    image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&h=400&fit=crop',
    theme: {
      colorPalette: ['#F5EDE0', '#D4C5A9', '#8B7D6B', '#5C7A4B', '#A0522D'],
      fontFamily: 'Nunito',
      accentFont: 'Quicksand',
      borderStyle: 'illustrated',
      backgroundPattern: 'woodland',
      accentElements: ['animals', 'trees', 'mushrooms', 'stars'],
    },
    pages: [
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
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
    name: 'Bright & Bold',
    category: 'Baby',
    style: 'bright',
    price: 39.99,
    description: 'Colorful and playful with fun shapes and bold fonts. Pure joy on every page.',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop',
    theme: {
      colorPalette: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1'],
      fontFamily: 'Fredoka One',
      accentFont: 'Poppins',
      borderStyle: 'none',
      backgroundPattern: 'confetti',
      accentElements: ['stars', 'circles', 'hearts', 'confetti'],
    },
    pages: [
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'double', placeholders: 2 },
      { layout: 'collage', placeholders: 4 },
      { layout: 'single', placeholders: 1 },
      { layout: 'double', placeholders: 2 },
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
