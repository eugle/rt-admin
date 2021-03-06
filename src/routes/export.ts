/**
 * 路由相关工具函数
 * 所有异步加载文件
 */

import { retryPromise } from '~/utils/tool'

import { PageFileOption, PagePreset } from './types'

const contextPath = ''
const pathPrefix = ''

// 计算 路由 path
export const getRoutePath = (path: string[] | string) => {
  return path && path[0] === '/' ? contextPath + path : `${contextPath}${pathPrefix}/${path}`
}

// 获取pages内组件文件在项目内的物理路径，用于 webpack 懒加载文件与打包
export const getPageFilePath = (option: PageFileOption) => {
  const { pathToComponent, path = '' } = option
  const componentPath = typeof pathToComponent === 'string' ? pathToComponent : getRoutePath(path)
  const filePath = componentPath[0] !== '/' ? componentPath : componentPath.substr(1)
  return filePath
}

// 获取 页面预设值。默认为  pages/xxx/preset.ts 该文件是权限设置必须文件
export const getPagePreset = (option: PageFileOption): PagePreset | undefined => {
  const filePath = getPageFilePath(option)

  try {
    const pagePest = require(/* webpackInclude: /pages\/.*\/limit\.ts$/ */
    /* webpackChunkName: "prest_[request]" */
    `~/pages/${filePath}/preset.ts`)
    return pagePest.default
  } catch (e) {
    //
  }
}

// 获取 mock。默认为  pages/xxx/mock.ts 存在该文件，将自动注入mock到prest每一个 api
export const getPageMockSource = (option: PageFileOption): Req.MockSource | undefined => {
  const filePath = getPageFilePath(option)

  try {
    const pagePest = require(/* webpackInclude: /pages\/.*\/mock\.ts$/ */
    /* webpackChunkName: "mock_[request]" */
    `~/pages/${filePath}/mock.ts`)
    return pagePest.default
  } catch (e) {
    //
  }
}

// 异步获取主题 css 文件
export const getThemeCssAsync = async (theme: string) => {
  retryPromise(() =>
    import(
      /* webpackChunkName: "theme_[request]" */
      `~/assets/styles/themes/${theme}.css`
    )
  )
}

// 异步获取页面文件
export const getPageFileAsync = async (option: PageFileOption) => {
  const filePath = getPageFilePath(option)

  return retryPromise(() =>
    import(
      /* webpackInclude: /pages\/.*\/index\.tsx?$/ */
      /* webpackChunkName: "page_[request]" */
      `~/pages/${filePath}`
    )
  )
}

// 获取 nodePath
export const getNodePath = (option: PageFileOption) => {
  const { nodePath } = option
  const filePath = getPageFilePath(option)

  return nodePath || filePath ? `/${filePath}` : ''
}
