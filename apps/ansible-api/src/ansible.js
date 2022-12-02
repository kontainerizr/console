import { spawn } from 'child_process'
import { access, constants } from 'fs'
import app from './app.js'
import { playbookDir, configDir, inventory } from './utils/env.js'
import { convertVars } from "./utils/tools.js";

export const ansible = (playbooks, args) => {
  const [playbook, ...lastsPlaybooks] = playbooks // another way to get a 'shifted' array without mutate it
  const playbookSpawn = spawn('ansible-playbook', [`${playbookDir}${playbook}`, ...args])
  app.log.info(`Run ${playbook} ${[`${playbookDir}${playbook}`, ...args].join(' ')}`)
  let logs = Buffer.alloc(0)
  playbookSpawn.stdout.on('data', (data) => { logs += data })
  playbookSpawn.stderr.on('data', (data) => { logs += data })
  playbookSpawn.on('close', (code) => {
    if (code !== 0) {
      app.log.error(`Playbook ${playbook} failed with rc ${code}`)
      app.log.error(logs.toString())
      return
    }
    app.log.info(logs.toString())
    if (lastsPlaybooks.length) {
      ansible(lastsPlaybooks, args)
    }
  })
  playbookSpawn.on('error', (err) => {
    app.log.error(err)
  })
  return playbookSpawn
}

export const checkPlaybooksAccess = (playbooksDictionary) => {
  Object.entries(playbooksDictionary).forEach(([route, paths]) => {
    paths.forEach(path => {
      access(`${playbookDir}${path}`, constants.R_OK, err => {
        if (err) {
          app.log.error(`Error playbook ${path} is not readable for route ${route}`)
          process.exit(1)
        }
      })
    })
  })
}

export const runPlaybook = (playbooks, vars) => {
  const extraVars = convertVars(vars)
  const args = [
    '-i',
    `${playbookDir}inventory/${inventory}`,
    '--vault-password-file',
    `${configDir}.vault-secret`,
    '--connection=local',
    ...extraVars,
  ]
  ansible(playbooks, args)
}
