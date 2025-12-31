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
  timer_enabled: boolean
  timer_duration: number
  snake_draft?: boolean
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
  timer_paused: boolean
  timer_remaining: number
  timer_last_update: number | null
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
    const turnModPlayers = draft.value.gamestate.turn % numPlayers
    let playerNum = draft.value.gamestate.order[turnModPlayers]
    
    // Snake draft mode: alternate direction every round
    if (draft.value.preset.snake_draft) {
      // Calculate which round we're in (0-indexed)
      const currentRound = Math.floor(draft.value.gamestate.turn / numPlayers)
      // Reverse order on odd rounds (1, 3, 5, ...)
      if (currentRound % 2 === 1) {
        playerNum = draft.value.gamestate.order[numPlayers - 1 - turnModPlayers]
      }
    } else {
      // Legacy mode: only reverse on specific round types
      if (roundType === 2 || roundType === 4) {
        playerNum = draft.value.gamestate.order[numPlayers - 1 - turnModPlayers]
      }
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

  // Timer duration computed property (current remaining time)
  const timerDuration = computed(() => {
    if (!draft.value) return 0
    if (!draft.value.preset.timer_enabled) return 0
    // Return remaining time even when paused so timer display stays visible
    return draft.value.gamestate.timer_remaining
  })

  // Timer max duration (for progress bar calculation)
  const timerMaxDuration = computed(() => {
    if (!draft.value) return 0
    if (!draft.value.preset.timer_enabled) return 0
    return draft.value.preset.timer_duration
  })

  // Timer paused state
  const isTimerPaused = computed(() => {
    if (!draft.value) return false
    return draft.value.gamestate.timer_paused
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

  // Update player tech tree progress (intermediate updates)
  const updateTreeProgress = (playerId: number, tree: number[][]) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('update tree progress', draft.value.id, playerId, tree)
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

  // Timer control - pause (host only)
  const pauseTimer = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('pause timer', draft.value.id)
  }

  // Timer control - resume (host only)
  const resumeTimer = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('resume timer', draft.value.id)
  }

  // Timer expired - notify server
  const notifyTimerExpired = (turn: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('timer expired', draft.value.id, turn)
  }

  // Sync timer with server
  const syncTimer = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('sync timer', draft.value.id)
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

    // Timer update handler (lightweight updates)
    socket.value.on('timer update', (timerData: { timer_remaining: number, timer_paused: boolean }) => {
      if (draft.value && draft.value.gamestate) {
        draft.value.gamestate.timer_remaining = timerData.timer_remaining
        draft.value.gamestate.timer_paused = timerData.timer_paused
      }
    })

    // Error handler
    socket.value.on('bug', () => {
      error.value = 'An error occurred in the draft'
    })

    // Draft not found handler - redirect to create draft page
    socket.value.on('draft not found', (roomID: string) => {
      console.log('Draft not found:', roomID)
      error.value = 'Draft not found. Redirecting to create draft page...'
      isLoading.value = false
      // Redirect to create draft page after a short delay
      setTimeout(() => {
        navigateTo('/draft/create')
      }, 2000)
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
    timerDuration,
    timerMaxDuration,
    isTimerPaused,
    initSocket,
    loadDraft,
    joinRoom,
    updateReady,
    startDraft,
    updateTree,
    updateTreeProgress,
    updateCivInfo,
    selectCard,
    getPrivateGamestate,
    refillCards,
    clearCards,
    pauseTimer,
    resumeTimer,
    notifyTimerExpired,
    syncTimer,
    setupSocketListeners,
    cleanup,
  }
}
