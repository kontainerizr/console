import VueDsfr from '@gouvminint/vue-dsfr'
import { createPinia } from 'pinia'
import '@gouvfr/dsfr/dist/dsfr.min.css'
import '@gouvfr/dsfr/dist/utility/icons/icons.min.css'
import '@gouvfr/dsfr/dist/utility/utility.main.min.css'
import '@gouvminint/vue-dsfr/styles'
import '@/main.css'
import * as icons from '@/icons.js'
import ClusterForm from '@/components/ClusterForm.vue'
import { getRandomCluster, getRandomProject, repeatFn } from '@dso-console/test-utils'
import { useSnackbarStore } from '@/stores/snackbar.js'
import { useAdminClusterStore } from '@/stores/admin/cluster.js'

describe('ClusterForm.vue', () => {
  it('Should mount a new cluster ClusterForm', () => {
    const pinia = createPinia()

    useSnackbarStore(pinia)

    const allProjects = repeatFn(5)(getRandomProject)

    const props = {
      allProjects,
    }

    const extensions = {
      use: [
        [
          VueDsfr, { icons: Object.values(icons) },
        ],
      ],
      global: {
        plugins: [pinia],
      },
    }

    cy.mount(ClusterForm, { extensions, props })
    cy.getByDataTestid('tlsServerNameInput')
      .find('input')
      .type('tlsServerName')
    cy.getByDataTestid('labelInput')
      .find('input')
      .type('label')
    cy.getByDataTestid('clusterResourcesCbx').find('input[type=checkbox]')
      .check({ force: true })
    cy.get('#privacy-select')
      .select('dedicated')
    cy.get('#multi-select')
      .select(`${allProjects[0].organization.name} - ${allProjects[0].name}`)
    cy.getByDataTestid('addClusterBtn').should('be.enabled')
  })

  it('Should mount an update cluster ClusterForm', () => {
    const pinia = createPinia()

    useSnackbarStore(pinia)
    const adminClusterStore = useAdminClusterStore(pinia)

    const allProjects = repeatFn(5)(getRandomProject)
    adminClusterStore.clusters = [getRandomCluster([allProjects[0].id])]

    const props = {
      cluster: adminClusterStore.clusters[0],
      allProjects,
      isNewCluster: false,
    }

    const extensions = {
      use: [
        [
          VueDsfr, { icons: Object.values(icons) },
        ],
      ],
      global: {
        plugins: [pinia],
      },
    }

    cy.mount(ClusterForm, { extensions, props })

    cy.getByDataTestid('user-json').should('be.visible')
    cy.getByDataTestid('cluster-json').should('be.visible')
    cy.getByDataTestid('tlsServerNameInput')
      .find('input')
      .should('have.value', props.cluster.cluster.tlsServerName)
      .and('be.disabled')
    cy.getByDataTestid('labelInput')
      .find('input')
      .should('have.value', props.cluster.label)
      .and('be.disabled')
    cy.getByDataTestid('infosInput')
      .find('textarea')
      .should('have.value', props.cluster.infos)
    cy.getByDataTestid('clusterResourcesCbx').find('input[type=checkbox]')
      .should(props.cluster.clusterResources ? 'be.checked' : 'not.be.checked')
    cy.get('#privacy-select')
      .should('have.value', props.cluster.privacy)
    cy.get('#privacy-select')
      .select('dedicated')
    cy.get('[data-testid$="-tag"]').should('have.length', props.cluster.projectsId.length)
    cy.getByDataTestid('updateClusterBtn').should('be.enabled')
  })

  it('Should disable project selector when privacy is public', () => {
    const pinia = createPinia()

    useSnackbarStore(pinia)

    const allProjects = repeatFn(5)(getRandomProject)

    const props = {
      allProjects,
    }

    const extensions = {
      use: [
        [
          VueDsfr, { icons: Object.values(icons) },
        ],
      ],
      global: {
        plugins: [pinia],
      },
    }

    cy.mount(ClusterForm, { extensions, props })
    cy.get('#privacy-select')
      .select('dedicated')
    cy.get('#multi-select').should('be.visible')
    cy.get('#privacy-select')
      .select('public')
    cy.get('#multi-select').should('not.to.exist')
  })
})
