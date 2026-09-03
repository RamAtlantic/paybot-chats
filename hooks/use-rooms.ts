"use client"

import { useState, useEffect, useCallback } from "react"
import { API_ENDPOINTS } from "@/lib/api-config"

interface Room {
  id: string
  name: string
  phone: string
  channel: string
  source: string
  status: "open" | "closed"
  openedAt?: string
  closedAt?: string
  createdAt: string
  createdFrom: string
  lastConnectionDate?: string
  connectedSockets: string[]
  connectedCount: number
  messageCount: number
  metadata?: Record<string, unknown>
  contactId?: string
  username?: string
  tags?: string
  lastMessage?: string
  lastMessageType?: string
  lastMessageSource?: string
  unreadCount?: number
  unreadRoom?: boolean
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface RoomsResponse {
  connections: Room[]
  archived?: Room[]
  pagination: PaginationInfo
}

interface UseRoomsOptions {
  page?: number
  limit?: number
  search?: string
  tags?: string
  archived?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

interface UseRoomsReturn {
  rooms: Room[]
  pagination: PaginationInfo | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  refetchSilently: () => Promise<void>
  loadMore: () => Promise<void>
  hasMore: boolean
}

export function useRooms(options: UseRoomsOptions = {}): UseRoomsReturn {
  const {
    page = 1,
    limit = 20,
    search = "",
    tags = "",
    archived = false,
  } = options

  const [rooms, setRooms] = useState<Room[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(page)

  const buildUrl = useCallback((pageNum: number, searchQuery: string, tagFilter?: string) => {
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: limit.toString()
    })

    if (searchQuery.trim()) {
      params.append('search', searchQuery.trim())
    }

    if (tagFilter && tagFilter.trim()) {
      params.append('tags', tagFilter.trim())
    }

    // Usar endpoint diferente para archived rooms
    const baseUrl = archived
      ? `${API_ENDPOINTS.rooms}/archived`
      : `${API_ENDPOINTS.rooms}/connections/status`

    return `${baseUrl}?${params.toString()}`
  }, [limit, archived])

  const fetchRooms = useCallback(async (pageNum: number = currentPage, searchQuery: string = search, tagFilter?: string, append: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const url = buildUrl(pageNum, searchQuery, tagFilter)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RoomsResponse = await response.json()

      // El endpoint de archived usa "archived" en lugar de "connections"
      if (archived && data.archived) {
        data.connections = data.archived
      }

      setPagination(data.pagination)

      if (append) {
        setRooms(prev => [...prev, ...data.connections])
      } else {
        setRooms(data.connections)
      }

      setCurrentPage(pageNum)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }, [buildUrl, currentPage, search, archived])

  const fetchRoomsSilently = useCallback(async (pageNum: number = currentPage, searchQuery: string = search, tagFilter?: string, append: boolean = false) => {
    setError(null)

    try {
      const url = buildUrl(pageNum, searchQuery, tagFilter)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RoomsResponse = await response.json()

      // El endpoint de archived usa "archived" en lugar de "connections"
      if (archived && data.archived) {
        data.connections = data.archived
      }

      setPagination(data.pagination)

      if (append) {
        setRooms(prev => [...prev, ...data.connections])
      } else {
        setRooms(data.connections)
      }

      setCurrentPage(pageNum)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      console.error('Error fetching rooms silently:', err)
    }
  }, [buildUrl, currentPage, search, archived])

  const refetch = useCallback(async () => {
    await fetchRooms(1, search, tags === "all" ? undefined : tags, false)
  }, [fetchRooms, search, tags, archived])

  const refetchSilently = useCallback(async () => {
    await fetchRoomsSilently(1, search, tags === "all" ? undefined : tags, false)
  }, [fetchRoomsSilently, search, tags, archived])

  const loadMore = useCallback(async () => {
    if (pagination?.hasNextPage && !loading) {
      const nextPage = currentPage + 1
      await fetchRooms(nextPage, search, tags === "all" ? undefined : tags, true)
    }
  }, [pagination?.hasNextPage, loading, currentPage, fetchRooms, search, tags, archived])

  // Efecto para carga inicial y búsqueda con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRooms(1, search, tags === "all" ? undefined : tags, false)
    }, search === "" && (tags === "" || tags === "all") ? 0 : 300) // Sin debounce para carga inicial

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tags, archived]) // Dependemos de search, tags y archived

/*   // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchRooms(currentPage, search, tags === "all" ? undefined : tags, false)
    }, refreshInterval)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, currentPage, search, tags])  */// fetchRooms está memoizado

  return {
    rooms,
    pagination,
    loading,
    error,
    refetch,
    refetchSilently,
    loadMore,
    hasMore: pagination?.hasNextPage ?? false
  }
}
