import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { Prisma, User } from '../../generated/prisma/client.js'
import { CreateUserDto } from '../dtos/user.dto.js'
import { PrismaService } from './prisma.service'

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: userWhereUniqueInput
    })
  }
  async users(params: {
    skip?: number
    take?: number
    cursor?: Prisma.UserWhereUniqueInput
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
  }): Promise<User[]> {
    const { skip, take, cursor, where, orderBy } = params
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy
    })
  }
  async createUser(dto: CreateUserDto): Promise<User> {
    const saltOrRounds = 10
    const passwordHash = await bcrypt.hash(dto.password, saltOrRounds)

    return this.prisma.user.create({
      data: {
        email: dto.email,
        nickname: dto.nickname,
        passwordHash: passwordHash
      }
    })
  }
  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput
    data: Prisma.UserUpdateInput
  }): Promise<User> {
    const { where, data } = params
    return this.prisma.user.update({
      data,
      where
    })
  }
  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where
    })
  }
}
