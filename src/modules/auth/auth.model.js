// Shapes user data — removes sensitive fields before sending to client
const userModel = (user) => ({
  id:          user.id,
  fname:       user.fname,
  lname:       user.lname,
  email:       user.email,
  phone:       user.phone,
  role:        user.role,
  profilePic:  user.profilePic,
  homeAddress: user.homeAddress,
  isVerified:  user.isVerified,
  isActive:    user.isActive,
  lastLogin:   user.lastLogin,
  createdAt:   user.createdAt,
})

module.exports = { userModel }