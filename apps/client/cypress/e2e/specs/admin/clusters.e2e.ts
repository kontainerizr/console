import { type Cluster, type ClusterDetails, ClusterPrivacy, type Project, type Stage } from '@cpn-console/shared'
import { getModel, getModelById } from '../../support/func.js'

describe('Administration clusters', () => {
  const clusters: Cluster[] = getModel('cluster')
  const cluster1 = getModelById('cluster', '32636a52-4dd1-430b-b08a-b2e5ed9d1789')
  const cluster2 = getModelById('cluster', 'aaaaaaaa-5b03-45d5-847b-149dec875680')
  const allStages: Stage[] = getModel('stage')
  const allProjects: Project[] = getModel('project')
  const privateZone = getModelById('zone', 'a66c4230-eba6-41f1-aae5-bb1e4f90cce1')

  const newCluster = {
    label: 'newCluster',
    projects: allProjects.slice(0, 1),
    stageIds: allStages.map(stage => stage.id),
    infos: 'Floating IP: 1.1.1.1',
    cluster: {
      tlsServerName: 'myTlsServerName',
    },
  }

  beforeEach(() => {
    cy.intercept('GET', '/api/v1/clusters/*').as('getClustersDetails')
    cy.intercept('GET', '/api/v1/clusters').as('getClusters')
    cy.intercept('GET', '/api/v1/projects*').as('getAdminProjects')
    cy.intercept('GET', '/api/v1/stages').as('listStages')

    cy.kcLogin('tcolin')
    cy.visit('/admin/clusters')
    cy.url().should('contain', '/admin/clusters')
    cy.wait('@getClusters')
    cy.wait('@listStages')
    cy.wait('@getAdminProjects').its('response.statusCode').should('match', /^20\d$/)
  })

  it('Should display clusters list', () => {
    clusters?.forEach((cluster) => {
      cy.getByDataTestid(`clusterTile-${cluster.label}`)
        .should('be.visible')
    })
  })

  it('Should display a public cluster form', () => {
    let cluster1Infos: ClusterDetails
    cy.getByDataTestid(`clusterTile-${cluster1.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails').its('response').then((response) => {
      cluster1Infos = response.body
    })
    cy.get('h1')
      .should('contain', 'Mettre à jour le cluster')
    cy.get('div.json-box')
      .should('have.length', 2)
    cy.getByDataTestid('labelInput')
      .should('have.value', cluster1.label)
      .and('be.disabled')
    cy.getByDataTestid('infosInput')
      .should('have.value', cluster1.infos)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('not.be.checked')
      .and('be.enabled')
    cy.get('#privacy-select')
      .should('have.value', 'public')
      .and('be.enabled')
    cy.get('#projects-select')
      .should('not.exist')
    cy.get('#zone-select')
      .should('exist')
      .and('be.enabled')
    cy.get('#stages-select')
      .should('be.visible')
      .click()
    cy.get('#stages-select')
      .within(() => {
        cy.get('.fr-tag--dismiss')
          .should('have.length', cluster1Infos.stageIds.length)
      })
  })

  it('Should display a dedicated cluster form', () => {
    let cluster2Infos: ClusterDetails
    cy.getByDataTestid(`clusterTile-${cluster2.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails').its('response').then((response) => {
      cluster2Infos = response.body
    })
    cy.get('h1')
      .should('contain', 'Mettre à jour le cluster')
    cy.get('div.json-box')
      .should('have.length', 2)
    cy.getByDataTestid('labelInput')
      .should('have.value', cluster2.label)
      .and('be.disabled')
    cy.getByDataTestid('infosInput')
      .should('have.value', cluster2.infos)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('not.be.checked')
      .and('be.enabled')
    cy.get('#zone-select')
      .should('exist')
      .and('be.enabled')
    cy.get('#privacy-select')
      .should('have.value', ClusterPrivacy.DEDICATED)
      .and('be.enabled')
    cy.get('#projects-select')
      .should('be.visible')
      .click()
    cy.get('#projects-select')
      .within(() => {
        cy.get('.fr-tag--dismiss')
          .should('have.length', cluster2Infos.projectIds?.length)
      })
    cy.get('#stages-select')
      .should('be.visible')
      .click()
    cy.get('#stages-select')
      .within(() => {
        cy.get('.fr-tag--dismiss')
          .should('have.length', cluster2Infos.stageIds.length)
      })
  })

  it('Should create a cluster', () => {
    cy.intercept('POST', '/api/v1/clusters').as('createCluster')
    cy.intercept('GET', '/api/v1/clusters/*/environments').as('getClusterEnvironments')

    cy.getByDataTestid('addClusterLink')
      .click()
    cy.get('h1')
      .should('contain', 'Ajouter un cluster')
    cy.getByDataTestid('addClusterBtn')
      .should('be.disabled')
    cy.getByDataTestid('tlsServerNameInput')
      .should('have.value', '')
      .type(newCluster.cluster.tlsServerName)
    cy.getByDataTestid('labelInput')
      .clear()
      .type(newCluster.label)
    cy.getByDataTestid('infosInput')
      .clear()
      .type(newCluster.infos)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('be.enabled')
      .check({ force: true })
    cy.get('#zone-select')
      .select(privateZone.id)

    cy.get('#privacy-select')
      .select(ClusterPrivacy.DEDICATED)
    cy.get('#projects-select')
      .click()
    newCluster.projects.forEach((project) => {
      cy.getByDataTestid(`${project.id}-projects-select-tag`)
        .click()
    })
    cy.get('#projects-select .fr-tag--dismiss')
      .should('have.length', newCluster.projects.length)

    newCluster.stageIds.forEach((id) => {
      cy.getByDataTestid(`${id}-stages-select-tag`)
        .click()
    })
    cy.get('[data-testid$="stages-select-tag"]')
      .get('#stages-select .fr-tag--dismiss')
      .should('have.length', newCluster.stageIds.length)
    cy.getByDataTestid('addClusterBtn')
      .should('be.enabled')
      .click()
    cy.wait('@createCluster')
      .its('response.statusCode').should('match', /^20\d$/)

    cy.getByDataTestid(`clusterTile-${newCluster.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails')
    cy.wait('@getClusterEnvironments')
    cy.get('h1')
      .should('contain', 'Mettre à jour le cluster')
    cy.get('div.json-box')
      .should('have.length', 2)
    cy.getByDataTestid('tlsServerNameInput')
      .should('have.value', newCluster.cluster.tlsServerName)
    cy.getByDataTestid('labelInput')
      .should('have.value', newCluster.label)
      .and('be.disabled')
    cy.getByDataTestid('infosInput')
      .should('have.value', newCluster.infos)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('be.checked')
      .and('be.enabled')
    cy.get('#zone-select')
      .should('have.value', privateZone.id)
    cy.get('#privacy-select')
      .should('have.value', ClusterPrivacy.DEDICATED)
      .and('be.enabled')
    cy.get('#projects-select')
      .should('be.visible')
    cy.get('[data-testid$="projects-select-tag"]')
      .should('have.length', newCluster.projects.length)
    cy.get('#stages-select')
      .should('be.visible')
    cy.get('#stages-select')
      .should('be.visible')
      .click()
    cy.get('#stages-select')
      .within(() => {
        cy.get('.fr-tag--dismiss')
          .should('have.length', newCluster.stageIds.length)
      })
  })

  it('Should update a cluster', () => {
    cy.intercept('PUT', '/api/v1/clusters/*').as('updateCluster')

    const updatedCluster = {
      infos: 'Floating IP: 2.2.2.2',
      cluster: {
        tlsServerName: 'updatedTlsServerName',
      },
    }

    cy.getByDataTestid(`clusterTile-${newCluster.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails')

    cy.getByDataTestid('tlsServerNameInput')
      .clear()
      .type(updatedCluster.cluster.tlsServerName)
    cy.getByDataTestid('labelInput')
      .should('be.disabled')
    cy.getByDataTestid('infosInput')
      .clear()
      .type(updatedCluster.infos)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('be.enabled')
      .uncheck({ force: true })
    cy.get('#zone-select')
      .should('have.value', privateZone.id)
      .select('a66c4230-eba6-41f1-aae5-bb1e4f90cce2')
    cy.get('#privacy-select')
      .select('public')

    cy.get('#stages-select')
      .click()
    cy.get(`[data-testid="${allStages[0].id}-stages-select-tag"]`)
      .click()
    cy.get('#stages-select .fr-tag--dismiss')
      .should('have.length', newCluster.stageIds.length - 1)
    cy.getByDataTestid('updateClusterBtn')
      .should('be.enabled')
      .click()
    cy.wait('@updateCluster')
      .its('response.statusCode').should('match', /^20\d$/)

    cy.getByDataTestid(`clusterTile-${newCluster.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails')
    cy.get('h1')
      .should('contain', 'Mettre à jour le cluster')
    cy.get('div.json-box')
      .should('have.length', 2)
    cy.getByDataTestid('labelInput')
      .should('have.value', newCluster.label)
      .and('be.disabled')
    cy.getByDataTestid('infosInput')
      .should('have.value', updatedCluster.infos)
    cy.getByDataTestid('tlsServerNameInput')
      .should('have.value', updatedCluster.cluster.tlsServerName)
    cy.getByDataTestid('input-checkbox-clusterResourcesCbx')
      .should('not.be.checked')
      .and('be.enabled')
    cy.get('#privacy-select')
      .should('have.value', 'public')
      .and('be.enabled')
    cy.get('#projects-select')
      .should('not.exist')
    cy.get('#zone-select')
      .should('have.value', 'a66c4230-eba6-41f1-aae5-bb1e4f90cce2')
    cy.get('#stages-select')
      .should('exist')
    cy.get('#stages-select')
      .click()
    cy.get('#stages-select .fr-tag--dismiss')
      .should('have.length', newCluster.stageIds.length - 1)
  })

  it('Should delete a cluster', () => {
    cy.intercept('DELETE', '/api/v1/clusters/*').as('deleteCluster')

    cy.getByDataTestid(`clusterTile-${newCluster.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails')
    cy.getByDataTestid('associatedEnvironmentsZone').should('not.exist')
    cy.getByDataTestid('deleteClusterZone').should('exist')
    cy.getByDataTestid('showDeleteClusterBtn').click()
    cy.getByDataTestid('deleteClusterBtn').should('be.disabled')
    cy.getByDataTestid('deleteClusterInput')
      .clear()
      .type(newCluster.label)
    cy.getByDataTestid('deleteClusterBtn')
      .should('be.enabled')
      .click()
    cy.wait('@deleteCluster')
      .its('response.statusCode').should('match', /^20\d$/)
    cy.getByDataTestid(`clusterTile-${newCluster.label}`)
      .should('not.exist')
  })

  it('Should not delete a cluster if associated environments', () => {
    cy.getByDataTestid(`clusterTile-${cluster1.label}`)
      .should('be.visible')
      .click()
    cy.wait('@getClustersDetails')
    cy.getByDataTestid('deleteClusterZone').should('not.exist')
    cy.getByDataTestid('associatedEnvironmentsZone').should('exist')
  })
})
