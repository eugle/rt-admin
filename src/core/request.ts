import config from '~/config'

import { Request } from '../utils/request'

import { userTokenCtrl } from './user/index'

const reqIns = new Request({
  isRelease: config.isRelease,
  domains: config.domains,
})

reqIns.userTokenCtrl = userTokenCtrl

export const request = reqIns.request.bind(reqIns)
