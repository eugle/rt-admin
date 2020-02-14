/**
 * APP 路由相关组件
 */

import { Spinner } from 'amis'
import { eachTree } from 'amis/lib/utils/helper'
import isFunction from 'lodash/isFunction'
import React, { createContext, lazy, useContext, Suspense } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'

import { isLogin } from '~/core/user'
import NotFound from '~/pages/404'
import { isSubStr } from '~/utils/tool'
import { Amis } from '~/widgets/amis/schema'
import ErrorBoundary from '~/widgets/error_boundary'
import { LayoutLazyFallback } from '~/widgets/layout/loading'

import { checkLimitByKeys, getAuthRoutes } from './limit'
import { CheckLimitFunc, PresetComponentProps, PresetCtxState, PresetRouteProps } from './types'
import { getNodePath, getPageFileAsync, getPagePreset, getRoutePath } from './utils'

const PageSpinner = <Spinner overlay show size="lg" key="pageLoading" />

// 根据 path，pathToComponent  参数 懒加载 `pages/xxx` 组件
export const getPageAsync = (option: PresetRouteProps) => {
  return lazy(() =>
    getPageFileAsync(option).then((file: any) => {
      const { default: content = {}, schema } = file
      const compProps: PresetComponentProps = {}

      if (isFunction(content)) {
        compProps.LazyFileComponent = content
      } else {
        if (schema) {
          content.schema = schema
        }
        compProps.lazyFileAmisProps = content
      }

      return {
        default: () => <PrestComponent {...option} {...compProps} />,
      }
    })
  )
}

// 登录路由拦截
export const PrivateRoute = ({ children, ...rest }: any) => {
  return (
    <Route
      {...rest}
      render={({ location }) => {
        return isLogin() ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location },
            }}
          />
        )
      }}
    />
  )
}

// usePresetContext 可获取 preset 值，与 checkLimit 校验权限 方法
const PresetContext = createContext<PresetCtxState>({})
export const usePresetContext = () => {
  const preset = useContext(PresetContext)
  const checkLimit: CheckLimitFunc = (keys, option) =>
    checkLimitByKeys(keys, {
      nodePath: preset.nodePath,
      ...option,
    })

  return {
    ...preset,
    checkLimit,
  }
}

// 将 preset 注入组件，可全局通过 usePresetContext 获取 preset 值
const PrestComponent = (props: PresetComponentProps) => {
  const { LazyFileComponent, lazyFileAmisProps, RouteComponent, ...rest } = props

  const nodePath = getNodePath(props)
  const preset = getPagePreset(props) || {}

  preset.nodePath = nodePath

  let Component: any = <div>Not Found 请检查路由设置</div>

  if (LazyFileComponent) {
    Component = <LazyFileComponent {...rest} />
  }
  if (RouteComponent) {
    Component = <RouteComponent {...rest} />
  }
  if (lazyFileAmisProps) {
    lazyFileAmisProps.schema.preset = {
      ...lazyFileAmisProps.schema.preset,
      ...preset,
    }
    Component = <Amis {...rest} {...lazyFileAmisProps} />
  }

  return <PresetContext.Provider value={preset}>{Component}</PresetContext.Provider>
}

// 处理每个路由，包裹 PrestComponent 组件
export const PrestRoute = (props: PresetRouteProps) => {
  const {
    withSuspense = true,
    fallback = PageSpinner,
    path = '',
    component,
    exact = true,
    children,
    ...rest
  } = props

  const routePath = getRoutePath(path)
  if (exact && !isSubStr(routePath, ':') && routePath !== location.pathname) {
    return <Redirect to="/404" />
  }

  const RouteComponent = (
    <Route
      {...rest}
      path={routePath}
      exact={exact}
      component={
        !component
          ? getPageAsync(props)
          : () => <PrestComponent {...props} RouteComponent={component} />
      }
    />
  )

  if (withSuspense) {
    return (
      <ErrorBoundary type="page">
        <Suspense fallback={fallback}>{RouteComponent}</Suspense>
      </ErrorBoundary>
    )
  }

  return RouteComponent
}

// 将 routeConfig 转换为 route
export const AppMenuRoutes = () => {
  const routes: any = []

  getAuthRoutes().forEach(({ children }) => {
    if (!children) {
      return
    }

    eachTree(children, (item) => {
      if (item.path && !item.limitOnly) {
        routes.push(<PrestRoute key={routes.length + 1} withSuspense={false} {...item} />)
      }
    })
  })

  return (
    <ErrorBoundary type="page">
      <Suspense fallback={<LayoutLazyFallback />}>
        <Switch>
          {routes}
          <Route path="*" component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  )
}
