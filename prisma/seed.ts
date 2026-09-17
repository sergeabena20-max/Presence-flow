import bcrypt from "bcryptjs"
import { prisma } from "../lib/prisma"

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.SUPER_ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured.",
    )
  }

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must contain at least 8 characters.")
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  })

  if (existingUser) {
    if (existingUser.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: "SUPER_ADMIN", organizationId: null },
      })
    }

    console.log(`Super Administrator already exists: ${email}`)
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: "Super",
      lastName: "Administrateur",
      role: "SUPER_ADMIN",
      organizationId: null,
      mustChangePassword: false,
    },
  })

  console.log(`Super Administrator created: ${email}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
