import { z } from 'zod'
import { RoleSchema, apiPrefix, contractInstance } from '../index.js'
import { ErrorSchema, baseHeaders } from './_utils.js'

export const projectRoleContract = contractInstance.router({
  listProjectRoles: {
    method: 'GET',
    path: `${apiPrefix}/projects/:projectId/roles`,
    pathParams: z.object({ projectId: z.string().uuid() }),
    responses: {
      200: RoleSchema.array(),
      400: ErrorSchema,
      401: ErrorSchema,
      403: ErrorSchema,
      404: ErrorSchema,
    },
  },
  createProjectRole: {
    method: 'POST',
    path: `${apiPrefix}/projects/:projectId/roles`,
    body: RoleSchema.omit({ position: true, id: true }),
    pathParams: z.object({ projectId: z.string().uuid() }),
    responses: {
      // 200: z.any(),
      200: RoleSchema,
      400: ErrorSchema,
      401: ErrorSchema,
      403: ErrorSchema,
      404: ErrorSchema,
    },
  },
  patchProjectRoles: {
    method: 'PATCH',
    path: `${apiPrefix}/projects/:projectId/roles`,
    pathParams: z.object({ projectId: z.string().uuid() }),
    // body: z.any(),
    body: RoleSchema.partial({ name: true, permissions: true, position: true }).array(),
    responses: {
      // 200: z.any(),
      200: RoleSchema.array(),
      400: ErrorSchema,
      401: ErrorSchema,
      403: ErrorSchema,
      404: ErrorSchema,
    },
  },
  projectRoleMemberCounts: {
    method: 'GET',
    path: `${apiPrefix}/projects/:projectId/roles/member-counts`,
    pathParams: z.object({ projectId: z.string().uuid() }),
    responses: {
      200: z.record(z.number().min(0)), // Record<role uuid, number of member>
      400: ErrorSchema,
      401: ErrorSchema,
      403: ErrorSchema,
      404: ErrorSchema,
    },
  },
  deleteProjectRole: {
    method: 'DELETE',
    path: `${apiPrefix}/projects/:projectId/roles/:roleId`,
    pathParams: z.object({
      projectId: z.string().uuid(),
      roleId: z.string().uuid(),
    }),
    body: null,
    responses: {
      204: null,
      400: ErrorSchema,
      401: ErrorSchema,
      403: ErrorSchema,
      404: ErrorSchema,
    },
  },
}, {
  baseHeaders,
})
