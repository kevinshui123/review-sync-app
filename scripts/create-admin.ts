/**
 * Script to create an admin account
 * Run: npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'Admin';

  try {
    // Check if admin exists
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin with email ${email} already exists.`);
      console.log('To update password, delete the admin first and recreate.');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        passwordHash,
        name,
        role: 'admin',
      },
    });

    console.log('='.repeat(50));
    console.log('Admin account created successfully!');
    console.log('='.repeat(50));
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log('='.repeat(50));
    console.log('Login at: http://localhost:3000/admin/login');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
