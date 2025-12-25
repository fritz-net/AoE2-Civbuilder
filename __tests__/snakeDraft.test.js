/**
 * Unit tests for snake draft functionality
 */

describe('Snake Draft Turn Order', () => {
  // Mock the getCurrentPlayer function from server.js
  function getCurrentPlayer(draft) {
    var numPlayers = draft["preset"]["slots"];
    var roundType = Math.max(Math.floor(draft["gamestate"]["turn"] / numPlayers) - (draft["preset"]["rounds"] - 1), 0);
    var player = draft["gamestate"]["order"][draft["gamestate"]["turn"] % numPlayers];
    
    // Snake draft mode: alternate direction every round
    if (draft["preset"]["snake_draft"]) {
      // Calculate which round we're in (0-indexed)
      var currentRound = Math.floor(draft["gamestate"]["turn"] / numPlayers);
      // Reverse order on odd rounds (1, 3, 5, ...)
      if (currentRound % 2 === 1) {
        player = draft["gamestate"]["order"][numPlayers - 1 - (draft["gamestate"]["turn"] % numPlayers)];
      }
    } else {
      // Legacy mode: only reverse on specific round types
      if (roundType == 2 || roundType == 4) {
        player = draft["gamestate"]["order"][numPlayers - 1 - (draft["gamestate"]["turn"] % numPlayers)];
      }
    }
    
    return { player, roundType, numPlayers };
  }

  test('Snake draft with 4 players should alternate direction each round', () => {
    const draft = {
      preset: {
        slots: 4,
        rounds: 4,
        snake_draft: true
      },
      gamestate: {
        turn: 0,
        order: [0, 1, 2, 3]  // Player order
      }
    };

    // Round 1: Forward order (0, 1, 2, 3)
    draft.gamestate.turn = 0;
    expect(getCurrentPlayer(draft).player).toBe(0);
    
    draft.gamestate.turn = 1;
    expect(getCurrentPlayer(draft).player).toBe(1);
    
    draft.gamestate.turn = 2;
    expect(getCurrentPlayer(draft).player).toBe(2);
    
    draft.gamestate.turn = 3;
    expect(getCurrentPlayer(draft).player).toBe(3);

    // Round 2: Reverse order (3, 2, 1, 0)
    draft.gamestate.turn = 4;
    expect(getCurrentPlayer(draft).player).toBe(3);
    
    draft.gamestate.turn = 5;
    expect(getCurrentPlayer(draft).player).toBe(2);
    
    draft.gamestate.turn = 6;
    expect(getCurrentPlayer(draft).player).toBe(1);
    
    draft.gamestate.turn = 7;
    expect(getCurrentPlayer(draft).player).toBe(0);

    // Round 3: Forward order again (0, 1, 2, 3)
    draft.gamestate.turn = 8;
    expect(getCurrentPlayer(draft).player).toBe(0);
    
    draft.gamestate.turn = 9;
    expect(getCurrentPlayer(draft).player).toBe(1);
    
    draft.gamestate.turn = 10;
    expect(getCurrentPlayer(draft).player).toBe(2);
    
    draft.gamestate.turn = 11;
    expect(getCurrentPlayer(draft).player).toBe(3);

    // Round 4: Reverse order (3, 2, 1, 0)
    draft.gamestate.turn = 12;
    expect(getCurrentPlayer(draft).player).toBe(3);
    
    draft.gamestate.turn = 13;
    expect(getCurrentPlayer(draft).player).toBe(2);
  });

  test('Snake draft with 2 players should produce 1-2-2-1-1-2-2-1 pattern', () => {
    const draft = {
      preset: {
        slots: 2,
        rounds: 4,
        snake_draft: true
      },
      gamestate: {
        turn: 0,
        order: [0, 1]
      }
    };

    // Round 1: Forward (0, 1)
    draft.gamestate.turn = 0;
    expect(getCurrentPlayer(draft).player).toBe(0);
    draft.gamestate.turn = 1;
    expect(getCurrentPlayer(draft).player).toBe(1);

    // Round 2: Reverse (1, 0)
    draft.gamestate.turn = 2;
    expect(getCurrentPlayer(draft).player).toBe(1);
    draft.gamestate.turn = 3;
    expect(getCurrentPlayer(draft).player).toBe(0);

    // Round 3: Forward (0, 1)
    draft.gamestate.turn = 4;
    expect(getCurrentPlayer(draft).player).toBe(0);
    draft.gamestate.turn = 5;
    expect(getCurrentPlayer(draft).player).toBe(1);

    // Round 4: Reverse (1, 0)
    draft.gamestate.turn = 6;
    expect(getCurrentPlayer(draft).player).toBe(1);
    draft.gamestate.turn = 7;
    expect(getCurrentPlayer(draft).player).toBe(0);
  });

  test('Legacy mode (no snake draft) should work as before', () => {
    const draft = {
      preset: {
        slots: 4,
        rounds: 4,
        snake_draft: false
      },
      gamestate: {
        turn: 0,
        order: [0, 1, 2, 3]
      }
    };

    // Round 1 (roundType 0): All forward
    for (let i = 0; i < 4; i++) {
      draft.gamestate.turn = i;
      expect(getCurrentPlayer(draft).player).toBe(i);
    }

    // Round 2 (roundType 1): All forward
    for (let i = 0; i < 4; i++) {
      draft.gamestate.turn = 4 + i;
      expect(getCurrentPlayer(draft).player).toBe(i);
    }
  });

  test('Snake draft disabled by default should maintain backward compatibility', () => {
    const draft = {
      preset: {
        slots: 4,
        rounds: 4
        // snake_draft not specified, should be falsy
      },
      gamestate: {
        turn: 0,
        order: [0, 1, 2, 3]
      }
    };

    // Should behave like legacy mode
    draft.gamestate.turn = 0;
    expect(getCurrentPlayer(draft).player).toBe(0);
    
    draft.gamestate.turn = 4;
    expect(getCurrentPlayer(draft).player).toBe(0);
  });
});
