import { send200, send500 } from '../utils/response.js'
import { runPlaybook } from '../ansible.js'

export const controller = async (req, res) => {
  const data = req.body

  return runPlaybook(res.context.config.playbook, data).then(message => {
    message.id = req.id
    send200(res, message)
  }).catch(message => {
    message.id = req.id
    send500(res, message)
  })
}
