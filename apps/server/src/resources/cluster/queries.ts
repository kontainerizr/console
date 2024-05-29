import type { Cluster, Environment, Kubeconfig, Project, Stage, User } from '@prisma/client'
import prisma from '@/prisma.js'

// prisma.cluster
export const getClusterById = (id: Cluster['id']) =>
  prisma.cluster.findUnique({
    where: { id },
    include: { kubeconfig: true },
  })

export const getClusterByIdOrThrow = (id: Cluster['id']) =>
  prisma.cluster.findUniqueOrThrow({
    where: { id },
    include: { kubeconfig: true, zone: true },
  })

export const getClusterEnvironments = (id: Cluster['id']) =>
  prisma.cluster.findUnique({
    where: { id },
    select: {
      environments: {
        select: {
          name: true,
          project: {
            select: {
              name: true,
              organization: {
                select: { name: true },
              },
              roles: {
                select: {
                  role: true,
                  user: {
                    select: { email: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

export const getClustersByIds = (clusterIds: Cluster['id'][]) =>
  prisma.cluster.findMany({
    where: {
      id: { in: clusterIds },
    },
    include: { kubeconfig: true },
  })

export const getPublicClusters = () =>
  prisma.cluster.findMany({
    where: { privacy: 'public' },
    include: { zone: true },
  })

export const getHookPublicClusters = () =>
  prisma.cluster.findMany({
    where: { privacy: 'public' },
    select: {
      id: true,
      infos: true,
      label: true,
      privacy: true,
      secretName: true,
      kubeconfig: true,
      clusterResources: true,
      zone: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  })

export const getClusterByLabel = (label: Cluster['label']) =>
  prisma.cluster.findUnique({ where: { label } })

export const getClusterByEnvironmentId = (id: Environment['id']) =>
  prisma.cluster.findMany({
    where: {
      environments: {
        some: { id },
      },
    },
    include: { kubeconfig: true },
  })

export const getClustersWithProjectIdAndConfig = () =>
  prisma.cluster.findMany({
    select: {
      id: true,
      stages: true,
      projects: {
        where: {
          status: { not: 'archived' },
        },
        select: {
          id: true,
          name: true,
          organization: {
            select: { name: true },
          },
          status: true,
        },
      },
      clusterResources: true,
      label: true,
      infos: true,
      privacy: true,
      secretName: true,
      kubeconfig: true,
      zoneId: true,
    },
  })

export const listClustersForUser = (userId: User['id']) =>
  prisma.cluster.findMany({
    where: {
      OR: [
        // Sélectionne tous les clusters publiques
        { privacy: 'public' },
        // Sélectionne les clusters associés aux projets dont l'user est membre
        {
          projects: { some: { roles: { some: { userId } } } },
        },
        // Sélectionne les clusters associés aux environnments appartenant à des projets dont l'user est membre
        {
          environments: { some: { project: { roles: { some: { userId } } } } },
        },
      ],
    },
    select: {
      id: true,
      label: true,
      stages: true,
      clusterResources: true,
      privacy: true,
      infos: true,
      zoneId: true,
    },
  })

export const getProjectsByClusterId = async (id: Cluster['id']) =>
  (await prisma.cluster.findUniqueOrThrow({
    where: { id },
    select: { projects: true },
  }))?.projects

export const getStagesByClusterId = async (id: Cluster['id']) =>
  (await prisma.cluster.findUniqueOrThrow({
    where: { id },
    select: { stages: true },
  }))?.stages

export const createCluster = (
  data: Omit<Cluster, 'id' | 'updatedAt' | 'createdAt' | 'kubeConfigId' | 'secretName'>,
  kubeconfig: Pick<Kubeconfig, 'user' | 'cluster'>,
  zoneId: string,
) => prisma.cluster.create({
  data: {
    ...data,
    // @ts-ignore
    kubeconfig: { create: kubeconfig },
    zone: {
      connect: { id: zoneId },
    },
  },
})

export const updateCluster = (
  id: Cluster['id'],
  data: Partial<Omit<Cluster, 'id' | 'updatedAt' | 'createdAt' | 'kubeConfigId'>>,
  kubeconfig: Pick<Kubeconfig, 'user' | 'cluster'>,
) => prisma.cluster.update({
  where: { id },
  data: {
    ...data,
    kubeconfig: {
      // @ts-ignore
      update: kubeconfig,
    },
  },
})

export const linkClusterToProjects = (id: Cluster['id'], projectIds: Project['id'][]) =>
  prisma.cluster.update({
    where: { id },
    data: {
      projects: {
        connect: projectIds.map(projectId => ({ id: projectId })),
      },
    },
  })

export const linkClusterToStages = (id: Cluster['id'], stageIds: Stage['id'][]) =>
  prisma.cluster.update({
    where: { id },
    data: {
      stages: {
        connect: stageIds.map(stageId => ({ id: stageId })),
      },
    },
  })

export const removeClusterFromProject = (id: Cluster['id'], projectId: Project['id']) =>
  prisma.cluster.update({
    where: { id },
    data: {
      projects: {
        disconnect: {
          id: projectId,
        },
      },
    },
  })

export const removeClusterFromStage = (id: Cluster['id'], stageId: Stage['id']) =>
  prisma.cluster.update({
    where: { id },
    data: {
      stages: {
        disconnect: {
          id: stageId,
        },
      },
    },
  })

export const deleteCluster = (id: Cluster['id']) =>
  prisma.cluster.delete({
    where: { id },
  })

export const _dropClusterTable = prisma.cluster.deleteMany
export const _dropKubeconfigTable = prisma.kubeconfig.deleteMany
