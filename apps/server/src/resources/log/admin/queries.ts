import type { Log, User } from '@prisma/client'
import { exclude } from '@cpn-console/shared'
import prisma from '@/prisma.js'

// SELECT
export const getAllLogsForUser = (user: User, offset = 0) =>
  prisma.log.findMany({
    where: { userId: user.id },
    take: 100,
    skip: offset,
  })

export const getAllLogs = ({ offset = 0, limit = 5 }: { offset?: number, limit?: number }) =>
  prisma.$transaction([
    prisma.log.count(),
    prisma.log.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: Number(offset),
      take: Number(limit),
    }),
  ])

// CREATE
export const addLogs = (
  action: Log['action'], data: Record<string, any>, userId: User['id'], requestId: string = '',
) => prisma.log.create({
  data: {
    action,
    userId,
    data: exclude(data, ['cluster', 'user', 'newCreds']),
    requestId,
  },
})

// TECH
export const _dropLogsTable = prisma.log.deleteMany

export const _createLog = (data: Parameters<typeof prisma.log.upsert>[0]['create']) =>
  prisma.log.upsert({
    where: {
      id: data.id,
    },
    create: data,
    update: data,
  })
