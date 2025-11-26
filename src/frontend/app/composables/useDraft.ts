/**
 * Composable for draft-related functionality
 * Uses Socket.io for real-time updates like legacy UI
 */
import { ref, computed } from 'vue'
import type { CivConfig } from './useCivData'

export interface DraftPreset {
  slots: number
  rounds: number
  points: number
  rarities: Record<string, boolean>
  cards: number[]
}

export interface DraftPlayer {
  name: string
  alias: string
  flag_palette: number[]
  architecture: number
  language: number
  tree: number[][]
  bonuses: any[][]
  ready: number
  customFlag: boolean
  customFlagData: string
  wonder: number
  castle: number
  description: string
}

export interface DraftGameState {
  phase: number
  turn: number
  order: number[]
  cards: number[]
  deck: number[]
}

export interface Draft {
  id: string
  timestamp: number
  preset: DraftPreset
  players: DraftPlayer[]
  gamestate: DraftGameState
}

export const useDraft = () => {
  const draft = ref<Draft | null>(null)
  const socket = ref<any>(null)
  const playerNumber = ref<number>(-1)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const isConnected = ref(false)

  // Computed properties
  const isHost = computed(() => playerNumber.value === 0)
  const currentPlayer = computed(() => {
    if (!draft.value || playerNumber.value < 0) return null
    return draft.value.players[playerNumber.value]
  })

  const currentPhase = computed(() => {
    if (!draft.value) return null
    return draft.value.gamestate.phase
  })

  const currentTurn = computed(() => {
    if (!draft.value) return null
    const numPlayers = draft.value.preset.slots
    const roundType = Math.max(
      Math.floor(draft.value.gamestate.turn / numPlayers) - (draft.value.preset.rounds - 1),
      0
    )
    let playerNum = draft.value.gamestate.order[draft.value.gamestate.turn % numPlayers]
    if (roundType === 2 || roundType === 4) {
      playerNum = draft.value.gamestate.order[numPlayers - 1 - (draft.value.gamestate.turn % numPlayers)]
    }
    return {
      roundType,
      playerNum,
      isMyTurn: playerNum === playerNumber.value,
    }
  })

  const roundTypeName = computed(() => {
    const turn = currentTurn.value
    if (!turn) return ''
    
    const names = [
      'Civilization Bonuses',
      'Unique Units',
      'Unique Techs: Castle',
      'Unique Techs: Imperial',
      'Team Bonuses',
    ]
    return names[turn.roundType] || ''
  })

  // Get cookie value helper
  const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=')
      if (key === name) {
        return value
      }
    }
    return null
  }

  // Load Socket.io script dynamically
  const loadSocketScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (typeof io !== 'undefined') {
        resolve()
        return
      }
      
      // Check if script already exists
      if (document.querySelector('script[src="/socket.io/socket.io.js"]')) {
        // Wait for it to load
        const checkIo = setInterval(() => {
          // @ts-ignore
          if (typeof io !== 'undefined') {
            clearInterval(checkIo)
            resolve()
          }
        }, 50)
        return
      }
      
      // Create and load script
      const script = document.createElement('script')
      script.src = '/socket.io/socket.io.js'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Socket.io'))
      document.head.appendChild(script)
    })
  }

  // Initialize socket connection
  const initSocket = async () => {
    if (typeof window === 'undefined') return
    
    try {
      // Load Socket.io script first
      await loadSocketScript()
      
      // @ts-ignore
      if (typeof io !== 'undefined') {
        // @ts-ignore
        socket.value = io()
        isConnected.value = true
        console.log('Socket.io connected')
      } else {
        throw new Error('Socket.io failed to initialize')
      }
    } catch (err) {
      console.error('Socket.io not available:', err)
      error.value = 'Socket.io not available'
    }
  }

  // Load draft data via Socket.io (like legacy code)
  const loadDraft = async (draftId: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      // Get player number from cookie
      const playerNumberCookie = getCookie('playerNumber')
      if (playerNumberCookie !== null) {
        playerNumber.value = parseInt(playerNumberCookie, 10)
      }
      
      // If socket is connected, use socket to get gamestate
      if (socket.value && isConnected.value) {
        // Join the room first
        socket.value.emit('join room', draftId)
        
        // Request gamestate via socket
        socket.value.emit('get gamestate', draftId, playerNumber.value)
      } else {
        // Fallback to API if socket not available
        const response = await fetch(`/api/draft/${draftId}`)
        if (response.ok) {
          draft.value = await response.json()
        } else {
          throw new Error('Failed to load draft')
        }
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      console.error('Failed to load draft:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Join socket room
  const joinRoom = (draftId: string) => {
    if (!socket.value) return
    socket.value.emit('join room', draftId)
  }

  // Update player ready status (toggle ready)
  const updateReady = (playerId: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('toggle ready', draft.value.id, playerId)
  }

  // Start the draft
  const startDraft = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('start draft', draft.value.id)
  }

  // Update player tech tree
  const updateTree = (playerId: number, tree: number[][]) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('update tree', draft.value.id, playerId, tree)
  }

  // Update player civilization info
  const updateCivInfo = (playerId: number, civName: string, flagPalette: number[], architecture: number, language: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('update civ info', draft.value.id, playerId, civName, flagPalette, architecture, language)
  }

  // End turn and select card
  const selectCard = (cardIndex: number, turn: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('end turn', draft.value.id, cardIndex, turn)
  }

  // Request private gamestate (for spectators)
  const getPrivateGamestate = (draftId: string) => {
    if (!socket.value) return
    socket.value.emit('get private gamestate', draftId)
  }

  // Refill cards
  const refillCards = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('refill', draft.value.id)
  }

  // Clear cards
  const clearCards = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('clear', draft.value.id)
  }

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socket.value) return

    // Main gamestate update handler (used by legacy code)
    socket.value.on('set gamestate', (updatedDraft: Draft) => {
      console.log('Received gamestate update:', updatedDraft)
      draft.value = updatedDraft
      isLoading.value = false
    })

    // Error handler
    socket.value.on('bug', () => {
      error.value = 'An error occurred in the draft'
    })

    // Connection handlers
    socket.value.on('connect', () => {
      isConnected.value = true
      console.log('Socket connected')
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      console.log('Socket disconnected')
    })
  }

  // Cleanup
  const cleanup = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  return {
    draft,
    playerNumber,
    isLoading,
    error,
    isConnected,
    isHost,
    currentPlayer,
    currentPhase,
    currentTurn,
    roundTypeName,
    initSocket,
    loadDraft,
    joinRoom,
    updateReady,
    startDraft,
    updateTree,
    updateCivInfo,
    selectCard,
    getPrivateGamestate,
    refillCards,
    clearCards,
    setupSocketListeners,
    cleanup,
  }
}
