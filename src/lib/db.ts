import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = "file:./dev.db";

// In production (Vercel), the filesystem is read-only.
// SQLite needs to be able to create lock files, so we copy the DB to /tmp
if (process.env.NODE_ENV === 'production') {
  const sourcePath = path.join(process.cwd(), 'prisma', 'dev.db');
  const tmpPath = '/tmp/dev.db';
  
  try {
    if (!fs.existsSync(tmpPath)) {
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, tmpPath);
        console.log("Database successfully copied to /tmp/dev.db");
      } else {
        console.warn("Database not found at source path:", sourcePath);
      }
    }
    dbUrl = `file:${tmpPath}`;
  } catch (error) {
    console.error("Error copying database to /tmp:", error);
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
