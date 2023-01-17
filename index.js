require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const router = require('./router/index')
const errorMiddleware = require('./middlewares/error-middleware')

const PORT = process.env.PORT || 3001
const app = express()

// Middlewares
app.use(express.json())
app.use(cookieParser())
// Обязательно указать с каким доменом обмениваться данными
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL }))

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


