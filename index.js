require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const router = require('./router/index')
const errorMiddleware = require('./middlewares/error-middleware')

const allowedOrigins = [process.env.CLIENT_URL, process.env.LOCAL_URL]
const corsOptions = {
   origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
         callback(null, true)
      } else {
         callback(new Error('Not allowed by CORS'))
      }
   },
   optionsSuccessStatus: 200,
   credentials: true,
}

const PORT = process.env.PORT || 3001
const app = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())

app.use(cors(corsOptions))

app.use('/api', router)
// Error middleware должен идти последним
app.use(errorMiddleware)

mongoose.set('strictQuery', false)

const start = async () => {
   try {
      await mongoose.connect(process.env.DB_URL, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
      })
      app.listen(PORT, () => {
         console.log(`listening on port ${PORT}`)
      })
   } catch (err) {
      console.error(err)
   }
}
start()


