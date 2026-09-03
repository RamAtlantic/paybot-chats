"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { SettingsService } from "@/services/settings-service"
import { SettingsData, UpdateSettingsRequest } from "@/types/settings"

// Query keys para React Query
export const SETTINGS_QUERY_KEYS = {
  settings: ['settings'] as const,
  settingsData: () => [...SETTINGS_QUERY_KEYS.settings, 'data'] as const,
}

// Hook para obtener las configuraciones
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEYS.settingsData(),
    queryFn: SettingsService.getSettings,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: (failureCount, error) => {
      // No reintentar en errores 4xx
      if (error instanceof Error && error.message.includes('4')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Hook para actualizar las configuraciones
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settingsData: UpdateSettingsRequest) => SettingsService.updateSettings(settingsData),
    onSuccess: (data) => {
      console.log(data, "data")
      // Invalidar y refetch de las settings después de actualizar
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEYS.settings })
    },
  })
}

// Hook para obtener solo displayName y logo
export function useSettingsDisplay(): {
  data: SettingsData | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
} {
  const { data, isLoading, error, refetch } = useSettings()
  return {
    data: data || undefined,
    isLoading,
    error,
    refetch
  }
}
