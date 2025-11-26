/**
 * Composable for draft-related functionality
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

  // Initialize socket connection
  const initSocket = () => {
    if (typeof window === 'undefined') return
    
    // Socket.io should be available from CDN or installed
    // @ts-ignore
    if (typeof io !== 'undefined') {
      // @ts-ignore
      socket.value = io()
    }
  }

  // Load draft data from server
  const loadDraft = async (draftId: string) => {
    isLoading.value = true
    error.value = null
    
    try {
      // Get player number from cookie
      const cookies = document.cookie.split(';')
      for (const cookie of cookies) {
        const [key, value] = cookie.trim().split('=')
        if (key === 'playerNumber') {
          playerNumber.value = parseInt(value, 10)
        }
      }

      // In production, this would load from server
      // For now, we'll simulate the draft structure
      const response = await fetch(`/api/draft/${draftId}`)
      if (response.ok) {
        draft.value = await response.json()
      } else {
        throw new Error('Failed to load draft')
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
    socket.value.emit('join', draftId)
  }

  // Update player ready status
  const updateReady = (playerId: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('ready', {
      draftID: draft.value.id,
      playerNumber: playerId,
    })
  }

  // Start the draft
  const startDraft = () => {
    if (!socket.value || !draft.value) return
    socket.value.emit('start', draft.value.id)
  }

  // Update player civilization info
  const updateCivInfo = (playerId: number, data: Partial<DraftPlayer>) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('updateCivInfo', {
      draftID: draft.value.id,
      playerNumber: playerId,
      ...data,
    })
  }

  // End turn and select card
  const selectCard = (cardIndex: number, turn: number) => {
    if (!socket.value || !draft.value) return
    socket.value.emit('endTurn', {
      draftID: draft.value.id,
      cardIndex,
      turn,
    })
  }

  // Setup socket listeners
  const setupSocketListeners = () => {
    if (!socket.value) return

    socket.value.on('updateLobby', (updatedDraft: Draft) => {
      draft.value = updatedDraft
    })

    socket.value.on('updateGame', (updatedDraft: Draft) => {
      draft.value = updatedDraft
    })

    socket.value.on('error', (message: string) => {
      error.value = message
    })
  }

  // Cleanup
  const cleanup = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
  }

  return {
    draft,
    playerNumber,
    isLoading,
    error,
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
    updateCivInfo,
    selectCard,
    setupSocketListeners,
    cleanup,
  }
}
