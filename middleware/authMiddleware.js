import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import User from '../models/usersModel.js'

const protect = asyncHandler(async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      req.user = await User.findById(decoded.id).select('-password')

      next()
    } catch (error) {
      console.error(error)
      res.status(401)
      throw new Error('Not authorized, token failed')
    }
  }

  if (!token) {
    res.status(401)
    throw new Error('Not authorized, no token')
  }
})

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next()
  } else {
    res.status(401)
    throw new Error('Not authorized as an admin')
  }
}


const driver = (req, res, next) => {
  if (req.user && req.user.isDriver) {
    next()
  } else {
    res.status(401)
    throw new Error('Only Drivers are authorized')
  }
}

const consumer = (req, res, next) => {
  if (req.user && req.user.isConsumer) {
    next()
  } else {
    res.status(401)
    throw new Error('Only Consumers are authorized')
  }
}
export { protect, admin , driver, consumer}
