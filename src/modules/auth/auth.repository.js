const prisma = require('../../config/prisma')

const findUserByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email }
  })
}

const findUserByPhone = async (phone) => {
  return prisma.user.findUnique({
    where: { phone }
  })
}

const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id }
  })
}

const createUser = async ({ fname, lname, email, phone, passwordHash }) => {
  return prisma.user.create({
    data: { fname, lname, email, phone, passwordHash }
  })
}

const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data,
  })
}

const updateLastLogin = async (id) => {
  return prisma.user.update({
    where: { id },
    data:  { lastLogin: new Date() }
  })
}

module.exports = {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  updateUser,
  updateLastLogin,
}