import type {
  MicroRouter,
  MicroLocation,
} from '@micro-app/types'
import globalEnv from '../../libs/global_env'
import {
  getMicroPathFromURL,
  setMicroPathToURL,
  removeMicroPathFromURL,
  removeMicroState,
  setMicroState,
} from './core'
import {
  createMicroLocation,
  updateMicroLocation,
  autoTriggerNavigationGuard,
} from './location'
import {
  createMicroHistory,
  attachRouteToBrowserURL,
} from './history'
import { createURL } from '../../libs/utils'
import { clearRouterWhenUnmount } from './api'
export { router } from './api'
export { addHistoryListener } from './event'
export { getNoHashMicroPathFromURL } from './core'
export { patchHistory, releasePatchHistory } from './history'

/**
 * The router system has two operations: read and write
 * Read through location and write through history & location
 * @param appName app name
 * @param url app url
 * @returns MicroRouter
 */
export default function createMicroRouter (appName: string, url: string): MicroRouter {
  const microLocation = createMicroLocation(appName, url)
  return {
    microLocation,
    microHistory: createMicroHistory(appName, microLocation),
  }
}

/**
 * When the sandbox executes start, or the hidden keep-alive application is re-rendered, the location is updated according to the browser url or attach router info to browser url
 * @param appName app.name
 * @param microLocation MicroLocation for sandbox
 * @param defaultPage default page
 */
export function initRouteStateWithURL (
  appName: string,
  microLocation: MicroLocation,
  defaultPage?: string,
): void {
  const microPath = getMicroPathFromURL(appName)
  if (microPath) {
    updateMicroLocation(appName, microPath, microLocation, 'auto')
  } else {
    updateBrowserURLWithLocation(appName, microLocation, defaultPage)
  }
}

/**
 * initialize browser information according to microLocation
 * called on sandbox.start or reshow of keep-alive app
 */
export function updateBrowserURLWithLocation (
  appName: string,
  microLocation: MicroLocation,
  defaultPage?: string,
): void {
  // update microLocation with defaultPage
  if (defaultPage) updateMicroLocation(appName, defaultPage, microLocation, 'prevent')
  // attach microApp route info to browser URL
  attachRouteToBrowserURL(
    appName,
    setMicroPathToURL(appName, microLocation),
    setMicroState(
      appName,
      null,
    ),
  )
  // trigger guards after change browser URL
  autoTriggerNavigationGuard(appName, microLocation)
}

/**
 * In any case, microPath & microState will be removed from browser, but location will be initialized only when keep-router-state is false
 * @param appName app name
 * @param url app url
 * @param microLocation location of microApp
 * @param keepRouteState keep-router-state is only used to control whether to clear the location of microApp
 */
export function clearRouteStateFromURL (
  appName: string,
  url: string,
  microLocation: MicroLocation,
  keepRouteState: boolean,
): void {
  if (!keepRouteState) {
    const { pathname, search, hash } = createURL(url)
    updateMicroLocation(appName, pathname + search + hash, microLocation, 'prevent')
  }
  removeStateAndPathFromBrowser(appName)
  clearRouterWhenUnmount(appName)
}

/**
 * remove microState from history.state and remove microPath from browserURL
 * called on sandbox.stop or hidden of keep-alive app
 */
export function removeStateAndPathFromBrowser (appName: string): void {
  attachRouteToBrowserURL(
    appName,
    removeMicroPathFromURL(appName),
    removeMicroState(appName, globalEnv.rawWindow.history.state),
  )
}
