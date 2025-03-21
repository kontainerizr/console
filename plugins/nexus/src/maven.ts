import type { AxiosInstance } from 'axios'
import type { WritePolicy } from './utils.js'
import { deleteIfExists } from './utils.js'
import getConfig from './config.js'

// Retro-compatibilty, maven is a special case with bad name formats
function getRepoNames(projectName: string) { // Unique function per language cause names are unique per repo
  return {
    hosted: [
      {
        repo: `${projectName}-repository-release`,
        privilege: `${projectName}-privilege-release`,
      },
      {
        repo: `${projectName}-repository-snapshot`,
        privilege: `${projectName}-privilege-snapshot`,
      },
    ],
    group: {
      repo: `${projectName}-repository-group`,
      privilege: `${projectName}-privilege-group`,
    },
  }
}

async function provisionMavenHosted(axiosInstance: AxiosInstance, repoName: string, writePolicy: WritePolicy) {
  const repo = await axiosInstance({
    method: 'GET',
    url: `/repositories/maven/hosted/${repoName}`,
    validateStatus: code => [200, 404].includes(code),
  })
  if (repo.status === 404) {
    await axiosInstance({
      method: 'post',
      url: '/repositories/maven/hosted',
      data: {
        name: repoName,
        online: true,
        storage: {
          blobStoreName: 'default',
          strictContentTypeValidation: true,
          writePolicy,
        },
        cleanup: { policyNames: ['string'] },
        component: { proprietaryComponents: true },
        maven: {
          versionPolicy: 'MIXED',
          layoutPolicy: 'STRICT',
          contentDisposition: 'ATTACHMENT',
        },
      },
      validateStatus: code => [201].includes(code),
    })
  } else {
    await axiosInstance({
      method: 'put',
      url: `/repositories/maven/hosted/${repoName}`,
      data: {
        name: repoName,
        online: true,
        storage: {
          blobStoreName: 'default',
          strictContentTypeValidation: true,
          writePolicy,
        },
        cleanup: { policyNames: ['string'] },
        component: { proprietaryComponents: true },
        maven: {
          versionPolicy: 'MIXED',
          layoutPolicy: 'STRICT',
          contentDisposition: 'ATTACHMENT',
        },
      },
      validateStatus: code => [204].includes(code),
    })
    if (repo.status === 404) {
      await axiosInstance({
        method: 'post',
        url: '/repositories/maven/hosted',
        data: {
          name: repoName,
          online: true,
          storage: {
            blobStoreName: 'default',
            strictContentTypeValidation: true,
            writePolicy,
          },
          cleanup: { policyNames: ['string'] },
          component: { proprietaryComponents: true },
          maven: {
            versionPolicy: 'MIXED',
            layoutPolicy: 'STRICT',
            contentDisposition: 'ATTACHMENT',
          },
        },
        validateStatus: code => [201].includes(code),
      })
    } else {
      await axiosInstance({
        method: 'put',
        url: `/repositories/maven/hosted/${repoName}`,
        data: {
          name: repoName,
          online: true,
          storage: {
            blobStoreName: 'default',
            strictContentTypeValidation: true,
            writePolicy,
          },
          cleanup: { policyNames: ['string'] },
          component: { proprietaryComponents: true },
          maven: {
            versionPolicy: 'MIXED',
            layoutPolicy: 'STRICT',
            contentDisposition: 'ATTACHMENT',
          },
        },
        validateStatus: code => [204].includes(code),
      })
    }
  }
}
interface MavenOptions {
  snapshotWritePolicy: WritePolicy
  releaseWritePolicy: WritePolicy
}
export async function createMavenRepo(axiosInstance: AxiosInstance, projectName: string, options: MavenOptions) {
  const names = getRepoNames(projectName)

  // create local repo maven
  await Promise.all([
    provisionMavenHosted(axiosInstance, names.hosted[0].repo, options.releaseWritePolicy),
    provisionMavenHosted(axiosInstance, names.hosted[1].repo, options.snapshotWritePolicy),
  ])

  // create maven group
  await axiosInstance({
    method: 'post',
    url: '/repositories/maven/group',
    data: {
      name: names.group.repo,
      online: true,
      storage: {
        blobStoreName: 'default',
        strictContentTypeValidation: true,
      },
      group: {
        memberNames: [
          ...names.hosted.map(({ repo }) => repo),
          'maven-public',
        ],
      },
    },
    validateStatus: code => [201, 400].includes(code),
  })

  // create privileges
  for (const name of [...names.hosted, names.group]) {
    await axiosInstance({
      method: 'post',
      url: '/security/privileges/repository-view',
      data: {
        name: name.privilege,
        description: `Privilege for organization ${projectName} for repo ${name.repo}`,
        actions: ['all'],
        format: 'maven2',
        repository: name.repo,
      },
      validateStatus: code => [201, 400].includes(code),
    })
  }
  return names
}

export function deleteMavenRepo(axiosInstance: AxiosInstance, projectName: string) {
  const names = getRepoNames(projectName)
  const repoPaths = [names.group, ...names.hosted]
  const privileges = [...names.hosted, names.group]
  const pathsToDelete = [
    // delete privileges
    ...privileges.map(({ privilege }) => `/security/privileges/${privilege}`),
    // delete local repo maven snapshot
    ...repoPaths.map(repo => `/repositories/${repo.repo}`),
  ]
  return pathsToDelete.map(path => deleteIfExists(path, axiosInstance))
}

export function getMavenUrls(projectName: string) {
  const nexusUrl = getConfig().secretExposedUrl
  const names = getRepoNames(projectName)
  return {
    MAVEN_REPO_RELEASE: `${nexusUrl}/${names.hosted[0].repo}`,
    MAVEN_REPO_SNAPSHOT: `${nexusUrl}/${names.hosted[1].repo}`,
  }
}
