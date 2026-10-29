import { connectDB } from './config/db.js';
import { Item } from './models/Item.js';
import { Claim } from './models/Claim.js';
import mongoose from 'mongoose';

const SAMPLE_ITEMS = [
  {
    type: 'lost',
    title: 'Apple MacBook Pro 14" Space Gray',
    category: 'electronics',
    description: 'Space Gray 14-inch MacBook Pro M2 with a GitHub Octocat sticker and Vite logo sticker on top cover. Left on study table.',
    location: 'Main Library 2nd Floor Quiet Zone',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'open',
    contactName: 'Aarav Sharma',
    contactEmail: 'aarav.sharma@campus.edu',
    contactPhone: '+91 98765 43210',
    identifyingMarks: 'Small scratch near USB-C port; GitHub and Vite stickers on lid',
  },
  {
    type: 'found',
    title: 'Apple MacBook Pro Laptop with Stickers',
    category: 'electronics',
    description: 'Found space gray Apple MacBook laptop with tech developer stickers on the lid left behind on library table. Turned in to circulation desk.',
    location: 'Main Library Circulation Desk',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: 'open',
    contactName: 'Library Staff Desk',
    contactEmail: 'library-lostfound@campus.edu',
    contactPhone: '+91 11 2345 6789',
    identifyingMarks: 'Space gray, stickers on lid',
  },
  {
    type: 'lost',
    title: 'Navy Blue The North Face Backpack',
    category: 'bags',
    description: 'Navy blue commuter backpack containing mechanical engineering spiral notebook, scientific calculator, and blue pencil case.',
    location: 'Student Union Cafeteria',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Priya Patel',
    contactEmail: 'priya.patel@campus.edu',
    contactPhone: '+91 91234 56789',
    identifyingMarks: 'Yellow reflective zipper pull on front pocket',
  },
  {
    type: 'found',
    title: 'Blue North Face Backpack with Notebooks',
    category: 'bags',
    description: 'Blue backpack found on chair in dining area after lunch hour. Contains notebooks and stationery.',
    location: 'Student Union Food Court',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Campus Security',
    contactEmail: 'security@campus.edu',
    contactPhone: '+91 11 9876 5432',
    identifyingMarks: 'Reflective pull cord, brand logo on front',
  },
  {
    type: 'lost',
    title: 'Student ID Card & Dorm Keycard',
    category: 'wallets_cards',
    description: 'Clear plastic badge holder with university student identity card for Rohan Verma and dormitory magnetic access card.',
    location: 'Engineering Block B 3rd Floor',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Rohan Verma',
    contactEmail: 'rohan.verma@campus.edu',
    contactPhone: '+91 99887 76655',
    identifyingMarks: 'Student ID #2024-EN-412',
  },
  {
    type: 'found',
    title: 'University Identity Badge & Keycard',
    category: 'wallets_cards',
    description: 'Clear lanyard badge holder with university ID card and electronic swipe key found in lecture hall hallway.',
    location: 'Engineering Block B Hallway',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Department Admin Office',
    contactEmail: 'eng-admin@campus.edu',
    contactPhone: '+91 11 5544 3322',
    identifyingMarks: 'Engineering student lanyard',
  },
  {
    type: 'lost',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    category: 'electronics',
    description: 'Black over-ear noise cancelling headphones in grey zippered protective case. Misplaced during afternoon study session.',
    location: 'Computer Center Lab 3',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Ananya Deshmukh',
    contactEmail: 'ananya.d@campus.edu',
    contactPhone: '+91 98111 22334',
    identifyingMarks: 'Custom cable inside case pouch; initials AD inscribed inside headband',
  },
  {
    type: 'found',
    title: 'Set of Brass Keys on Leather Keychain',
    category: 'keys',
    description: 'Three brass door keys and a red bicycle lock key attached to a brown leather strap keychain.',
    location: 'Campus Sports Complex Bike Racks',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'open',
    contactName: 'Sports Facility Desk',
    contactEmail: 'gym-desk@campus.edu',
    contactPhone: '+91 11 8877 6655',
    identifyingMarks: 'Brown leather strap with brass ring',
  },
];

export async function seedDatabase() {
  try {
    await connectDB();
    const count = await Item.countDocuments();
    if (count === 0) {
      console.log('[Seed] Database items collection is empty. Inserting demonstration items...');
      const created = await Item.insertMany(SAMPLE_ITEMS);
      console.log(`[Seed] Successfully seeded ${created.length} demonstration items.`);
    } else {
      console.log(`[Seed] Items collection already contains ${count} items. Skipping seed.`);
    }
    await mongoose.connection.close();
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (process.argv[1]?.includes('seed')) {
  seedDatabase();
}

