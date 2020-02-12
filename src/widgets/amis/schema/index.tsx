import { confirm, render, toast } from 'amis'
import { RendererProps, RenderOptions } from 'amis/lib/factory'
import { Action } from 'amis/lib/types'
import React from 'react'
import { withRouter, RouteComponentProps } from 'react-router-dom'
import { ThemeConsumer } from 'styled-components'

import logger from '~/utils/logger'

import { RtSchema } from './types'
import { envFetcher, normalizeLink, resolveRtSchema } from './utils'

const log = logger.getLogger('dev:amisSchema')

export type AmisProps = {
  schema: RtSchema
  props?: RendererProps
  option?: RenderOptions
}

export const renderAmis = render

// 文档 https://baidu.github.io/amis/docs/getting-started
// 源码 https://github.com/baidu/amis/blob/master/examples/components/App.jsx
type Props = AmisProps & RouteComponentProps<any>

export const Amis = withRouter((props: Props) => {
  const { schema, props: amisProps = {}, option = {}, history, match } = props

  const aimsEnv = {
    session: 'global',
    // number 固顶间距，当你的有其他固顶元素时，需要设置一定的偏移量，否则会重叠。
    // number 固底间距，当你的有其x他固底元素时，需要设置一定的偏移量，否则会重叠。
    affixOffsetTop: 0,
    //  string 内置 rich-text 为 frolaEditor，想要使用，请自行购买，或者自己实现 rich-text 渲染器。
    affixOffsetBottom: 0,
    // 富文本编辑器 token
    richTextToken: false,
    // 请求模块
    fetcher: envFetcher,
    // 是否取消 ajax请求
    isCancel: (value: any) => {
      log.log('isCancel', value)
      if (value.name === 'AbortError') {
        log.info('请求被终止', value)
        return true
      }
      return false
    },
    // 消息提示
    notify: (type: string, msg: string) => {
      log.log('notify', type, msg)
      // 默认跳过表单错误 提示
      if (/表单验证失败/.test(msg)) {
        return
      }
      const tipMsg = (toast as any)[type]
      if (tipMsg) {
        tipMsg(msg, type === 'error' ? '系统异常' : '系统提示')
      }
    },
    // 实现警告提示。
    alert: (msg: string) => {
      log.log('alert', msg)
    },
    // 实现确认框。 boolean | Promise<boolean>
    confirm: (msg: string, title?: string) => {
      let confirmTitle = title || '提示'
      let confirmText = msg || ''
      if (!title && msg.indexOf('[') === 0 && msg.indexOf(']') > 0) {
        const end = msg.indexOf(']')
        confirmText = msg.substr(end + 1)
        confirmTitle = msg.substring(1, end)
      }

      log.log('confirm: ', msg)
      return confirm(confirmText, confirmTitle)
    },
    // 实现页面跳转，因为不清楚所在环境中是否使用了 spa 模式，所以用户自己实现吧。
    jumpTo: (to: string, action?: Action, ctx?: object) => {
      log.log('jumpTo', to, action, ctx)

      to = normalizeLink({ to })
      history.push(to)
    },
    // 地址替换，跟 jumpTo 类似。
    updateLocation: (to: any, replace?: boolean) => {
      const link = normalizeLink({ to })
      log.log('updateLocation', replace ? 'replace ' : 'push', link)
      if (replace) {
        window.history.replaceState({}, '', link)
        return
      }
      history.push(link)
    },
    // 判断目标地址是否为当前页面。
    isCurrentUrl: (to: string) => {
      const link = normalizeLink({ to })
      log.log('isCurrentUrl', link)
      return match
    },
    // 实现，内容复制。
    copy: (contents: string, options?: { shutup: boolean }) => {
      log.log('copy', contents, options)
    },
    // HTMLElement 决定弹框容器。
    // getModalContainer: () => {
    //   log.log('getModalContainer')
    // },
    // Promise<Function>  可以通过它懒加载自定义组件，比如： https://github.com/baidu/amis/blob/master/__tests__/factory.test.tsx#L64-L91。
    // 大型组件可能需要异步加载。比如：富文本编辑器
    loadRenderer: (loaderSchema: any, path: string) => {
      log.log('loadRenderer', loaderSchema, path)
    },
  }

  const { preset, css } = schema

  let envSchema: any = schema
  if (preset || css) {
    envSchema = log.time('resolveRtSchema 当前schema', () => {
      return resolveRtSchema(schema)
    })
  }

  return (
    <ThemeConsumer>
      {({ name: theme }) =>
        renderAmis(envSchema, amisProps, {
          ...aimsEnv,
          ...option,
          theme,
        } as any)
      }
    </ThemeConsumer>
  )
})
