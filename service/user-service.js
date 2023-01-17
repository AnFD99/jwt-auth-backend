const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('../service/mail-service')
const tokenService = require('../service/token-service')
const UserDto = require('../dtos/user-dto')
const ApiError = require('../exceptions/api-error')

class UserService {
   // Что будет происходить, когда пользователь захочет зарегистрироваться
   async registration(email, password) {
      // Проверка существует ли такой пользователь
      const candidate = await UserModel.findOne({ email })
      if (candidate) {
         throw ApiError.BadRequest(
            `Пользователь с таким ${email} уже существует`,
         )
      }
      // Создаение захешированного пароля с помощью библиотеки bcrypt
      const hashPassword = await bcrypt.hash(password, 3)
      // Ссылка для активации аккаунта
      const activationLink = uuid.v4()
      // Создание пользователя если он еще не существует
      const user = await UserModel.create({
         email,
         password: hashPassword,
         activationLink,
      })
      // Отправка письма с ссылкой активацией
      await mailService.sendActivationMail(
         email,
         `${process.env.API_URL}/api/activate/${activationLink}`,
      )
      // Создание dto для удаления ненжных полей для генерации токена
      const userDto = new UserDto(user) // обладает теперь только 3 полями: id, email, isActivated
      // Генерирование токенов
      const tokens = tokenService.generateTokens({ ...userDto })
      // Сохранение токена в бд
      await tokenService.saveToken(userDto.id, tokens.refreshToken)

      return {
         ...tokens,
         user: userDto,
      }
   }
   async activate(activationLink) {
      const user = await UserModel.findOne({ activationLink })
      if (!user) {
         throw ApiError.BadRequest(`Incorrect activation link`)
      }
      user.isActivated = true
      await user.save()
   }

   async login(email, password) {
      const user = await UserModel.findOne({ email })
      if (!user) {
         throw ApiError.BadRequest('User is not found')
      }
      // Если пользователь найден, то нужно сравнить пароли, но так как это хэш, то сравниваются хэши
      const isPassEqual = await bcrypt.compare(password, user.password)
      if (!isPassEqual) {
         throw ApiError.BadRequest('Incorrect password')
      }
      const userDto = new UserDto(user)
      const tokens = tokenService.generateTokens({ ...userDto })
      // Сохранение токена в бд
      await tokenService.saveToken(userDto.id, tokens.refreshToken)

      return {
         ...tokens,
         user: userDto,
      }
   }

   async logout(refreshToken) {
      const token = await tokenService.removeToken(refreshToken)
      return token
   }

   async refresh(refreshToken) {
      if (!refreshToken) {
         throw ApiError.UnauthorizedError()
      }
      const userData = tokenService.validateToken(refreshToken)
      const tokenFromDB = await tokenService.findToken(refreshToken)

      if (!userData || !tokenFromDB) {
         throw ApiError.UnauthorizedError()
      }
      const user = await UserModel.findById(userData.id)
      const userDto = new UserDto(user)
      const tokens = tokenService.generateTokens({ ...userDto })
      // Сохранение токена в бд
      await tokenService.saveToken(userDto.id, tokens.refreshToken)

      return {
         ...tokens,
         user: userDto,
      }
   }

   async getAllUsers() {
      const users = await UserModel.find()
      return users
   }
}

module.exports = new UserService()

