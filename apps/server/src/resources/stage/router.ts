import { AdminAuthorized, stageContract } from '@cpn-console/shared'
import { serverInstance } from '@/app.js'

import {
  listStages,
  createStage,
  getStageAssociatedEnvironments,
  deleteStage,
  updateStage,
} from './business.js'
import { authUser } from '@/utils/controller.js'
import { ErrorResType, Forbidden403 } from '@/utils/errors.js'

export const stageRouter = () => serverInstance.router(stageContract, {

  // Récupérer les types d'environnement disponibles
  listStages: async () => {
    const body = await listStages()

    return {
      status: 200,
      body,
    }
  },

  // Récupérer les environnements associés au stage
  getStageEnvironments: async ({ request: req, params }) => {
    const requestor = req.session.user
    const perms = await authUser(requestor)
    if (!AdminAuthorized.isAdmin(perms.adminPermissions)) return new Forbidden403()

    const stageId = params.stageId
    const body = await getStageAssociatedEnvironments(stageId)
    if (body instanceof ErrorResType) return body

    return {
      status: 200,
      body,
    }
  },

  // Créer un stage
  createStage: async ({ request: req, body: data }) => {
    const requestor = req.session.user
    const perms = await authUser(requestor)
    if (!AdminAuthorized.isAdmin(perms.adminPermissions)) return new Forbidden403()

    const body = await createStage(data)
    if (body instanceof ErrorResType) return body

    return {
      status: 201,
      body,
    }
  },

  // Modifier une association stage / clusters
  updateStage: async ({ request: req, params, body: data }) => {
    const requestor = req.session.user
    const perms = await authUser(requestor)
    if (!AdminAuthorized.isAdmin(perms.adminPermissions)) return new Forbidden403()

    const stageId = params.stageId

    const body = await updateStage(stageId, data)
    if (body instanceof ErrorResType) return body

    return {
      status: 200,
      body,
    }
  },

  // Supprimer un stage
  deleteStage: async ({ request: req, params }) => {
    const requestor = req.session.user
    const perms = await authUser(requestor)
    if (!AdminAuthorized.isAdmin(perms.adminPermissions)) return new Forbidden403()

    const stageId = params.stageId

    const body = await deleteStage(stageId)
    if (body instanceof ErrorResType) return body

    return {
      status: 204,
      body,
    }
  },
})
