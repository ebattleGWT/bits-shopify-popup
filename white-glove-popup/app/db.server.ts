import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Ensure the client is connected
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => console.error('Failed to connect to database:', error));

export default prisma;
