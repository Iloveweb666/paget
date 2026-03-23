/**
 * 用户配置组合式函数（统一走 Pinia Store）
 * User config composable (unified on top of Pinia store)
 */
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'

export type { PagetConfig } from '@/stores/config'

export function useConfig() {
  const configStore = useConfigStore()
  const { config } = storeToRefs(configStore)

  return {
    config,
    resetConfig: configStore.resetConfig,
  }
}
