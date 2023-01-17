const jwt = require('jsonwebtoken')
const tokenModel = require('../models/token-model')
const { generateKeyPairSync } = require('node:crypto')

let passphrase = 'top secret'

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
   modulusLength: 2048,
   publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
   },
   privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase,
   },
})

class TokenService {
   generateTokens(payload) {
      const accessToken = jwt.sign(
         payload,
         {
            key: privateKey,
            passphrase,
         },
         {
            expiresIn: '30m',
            algorithm: 'RS256',
         },
      )
      const refreshToken = jwt.sign(
         payload,
         {
            key: privateKey,
            passphrase,
         },
         {
            expiresIn: '30d',
            algorithm: 'RS256',
         },
      )
      return { accessToken, refreshToken }
   }

   validateToken(token) {
      try {
         const userData = jwt.verify(token, publicKey)
         return userData
      } catch (err) {
         return null
      }
   }

   // Сохранение токена refreshToken в базе данных
   async saveToken(userId, refreshToken) {
      const tokenData = await tokenModel.findOne({ user: userId })
      if (tokenData) {
         tokenData.refreshToken = refreshToken
         return tokenData.save()
      }
      const token = await tokenModel.create({ user: userId, refreshToken })
      return token
   }

   async removeToken(refreshToken) {
      const tokenData = await tokenModel.deleteOne({ refreshToken })
      return tokenData
   }

   async findToken(refreshToken) {
      const tokenData = await tokenModel.findOne({ refreshToken })
      return tokenData
   }
}

module.exports = new TokenService()




