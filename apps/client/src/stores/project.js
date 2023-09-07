import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api/index.js'

export const useProjectStore = defineStore('project', () => {
  const selectedProject = ref(undefined)
  const selectedProjectOwner = ref(undefined)
  const projects = ref([])

  /**
   * @param {string} project
   */
  const setSelectedProject = (id) => {
    selectedProject.value = projects.value.find(project => project.id === id)
    setSelectedProjectOwner(selectedProject.value)
  }

  const setSelectedProjectOwner = (project) => {
    selectedProjectOwner.value = project.roles.find(role => role.role === 'owner').user
  }

  const updateProject = async (projectId, data) => {
    await api.updateProject(projectId, data)
    await getUserProjects()
  }

  const getUserProjects = async () => {
    const res = await api.getUserProjects()
    projects.value = res
    if (selectedProject.value) {
      setSelectedProject(selectedProject.value.id)
    }
  }

  const createProject = async (project) => {
    await api.createProject(project)
    await getUserProjects()
  }

  const archiveProject = async (projectId) => {
    await api.archiveProject(projectId)
    selectedProject.value = undefined
    await getUserProjects()
  }

  const getProjectSecrets = async (projectId) => {
    return await api.getProjectSecrets(projectId)
  }

  return {
    selectedProject,
    selectedProjectOwner,
    projects,
    setSelectedProject,
    setSelectedProjectOwner,
    updateProject,
    getUserProjects,
    createProject,
    archiveProject,
    getProjectSecrets,
  }
})
