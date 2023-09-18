import { KubeConfig, CoreV1Api, CustomObjectsApi, PatchUtils } from '@kubernetes/client-node'
import { addCluster, deleteEnv, deleteRepo, newEnv, newRepo, removeCluster } from './index.js'
import { kubeconfigPath, kubeconfigCtx } from '@/utils/env.js'
import type { RegisterFn } from '@/plugins/index.js'
import { createCluster, deleteCluster } from './cluster.js'
import { infos } from './infos.js'
export const patchOptions = { headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_PATCH } }
export const argoNamespace = process.env.ARGO_NAMESPACE

const kc = new KubeConfig()
if (kubeconfigPath) {
  kc.loadFromFile(kubeconfigPath)
  if (kubeconfigCtx) {
    kc.setCurrentContext(kubeconfigCtx)
  }
} else {
  kc.loadFromCluster()
}

export const k8sApi = kc.makeApiClient(CoreV1Api)
export const customK8sApi = kc.makeApiClient(CustomObjectsApi)

export const init = (register: RegisterFn) => {
  register(
    'argo',
    {
      // Envs
      initializeEnvironment: { post: newEnv },
      deleteEnvironment: { main: deleteEnv },
      addEnvironmentCluster: { main: addCluster },
      removeEnvironmentCluster: { main: removeCluster },
      // Repos
      createRepository: { main: newRepo },
      deleteRepository: { main: deleteRepo },
      // clusters
      createCluster: { main: createCluster },
      deleteCluster: { main: deleteCluster },
    },
    infos,
  )
}
