// Script to reset the password for admin@edt.com
// Usage: npx tsx scripts/reset-admin-password.ts <new-password>

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error("Usage: npx tsx scripts/reset-admin-password.ts <new-password>");
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error("Error: Password must be at least 6 characters long.");
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email: "admin@edt.com" },
    });

    if (!user) {
      console.error("Error: No user found with email admin@edt.com");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: "admin@edt.com" },
      data: { password: hashedPassword },
    });

    console.log("Password for admin@edt.com has been reset successfully.");
  } catch (error) {
    console.error("Failed to reset password:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
