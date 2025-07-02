// This is a Netlify function that acts as a serverless Express.js app
const { createServer } = require('@netlify/functions')
const express = require('express')
const serverless = require('serverless-http')
const app = express()

// Import your Express app configuration
const { registerRoutes } = require('../../server/routes')
const { log } = require('../../server/vite')

// Apply middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  const path = req.path
  let capturedJsonResponse

  const originalResJson = res.json
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson
    return originalResJson.apply(res, [bodyJson, ...args])
  }

  res.on('finish', () => {
    const duration = Date.now() - start
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`
      }
      log(logLine)
    }
  })

  next()
})

// Register your routes
registerRoutes(app)

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({ message })
})

// Convert Express app to serverless function
const handler = serverless(app, {
  binary: ['image/*', 'font/*', 'application/octet-stream'],
})

exports.handler = createServer(async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    }
  }

  // Process the request
  try {
    const result = await handler(event, context)
    return result
  } catch (error) {
    console.error('Server error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }
  }
})
