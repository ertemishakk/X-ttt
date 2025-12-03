import rand_arr_elem from "./rand_arr_elem";

class HintSystem {
  constructor(winningCombinations) {
    this.winningCombinations = winningCombinations;
    this.cellDescriptions = {
      c1: "top-left",
      c2: "top-center",
      c3: "top-right",
      c4: "middle-left",
      c5: "center",
      c6: "middle-right",
      c7: "bottom-left",
      c8: "bottom-center",
      c9: "bottom-right",
    };
  }

  getHint(cellValues, isPlayerTurn, isGameActive, gameType) {
    // Don't provide hints if it's not the player's turn or game isn't active
    if (!isPlayerTurn || !isGameActive || gameType === "live") {
      return "Hints are only available when it's your turn in single-player mode.";
    }

    const emptyCells = this.getEmptyCells(cellValues);

    if (emptyCells.length === 0) {
      return "No moves available!";
    }

    // Priority 1: Check if player can win
    const winningMove = this.findWinningMove(cellValues, emptyCells, "x");
    if (winningMove) {
      return `You can win by playing ${this.getCellDescription(winningMove)}!`;
    }

    // Priority 2: Check if player needs to block computer from winning
    const blockingMove = this.findWinningMove(cellValues, emptyCells, "o");
    if (blockingMove) {
      return `Block the computer from winning by playing ${this.getCellDescription(
        blockingMove
      )}!`;
    }

    // Priority 3: Take center if available
    if (emptyCells.includes("c5")) {
      return "The center square is a strong strategic position!";
    }

    // Priority 4: Suggest corners
    const corners = ["c1", "c3", "c7", "c9"];
    const availableCorners = corners.filter((corner) =>
      emptyCells.includes(corner)
    );
    if (availableCorners.length > 0) {
      const suggestedCorner = rand_arr_elem(availableCorners);
      return `Corner squares like ${this.getCellDescription(
        suggestedCorner
      )} are good strategic choices!`;
    }

    // Priority 5: Suggest edges as fallback
    const edges = ["c2", "c4", "c6", "c8"];
    const availableEdges = edges.filter((edge) => emptyCells.includes(edge));
    if (availableEdges.length > 0) {
      const suggestedEdge = rand_arr_elem(availableEdges);
      return `Consider playing ${this.getCellDescription(
        suggestedEdge
      )} as a solid move.`;
    }

    // Fallback
    return "Any of the remaining squares would work!";
  }

  findWinningMove(cellValues, emptyCells, player) {
    for (let cell of emptyCells) {
      const testValues = { ...cellValues, [cell]: player };
      if (this.checkForWinner(testValues, player)) {
        return cell;
      }
    }
    return null;
  }

  checkForWinner(cellValues, player) {
    for (let combination of this.winningCombinations) {
      const [a, b, c] = combination;
      if (
        cellValues[a] === player &&
        cellValues[b] === player &&
        cellValues[c] === player
      ) {
        return true;
      }
    }
    return false;
  }

  getEmptyCells(cellValues) {
    const emptyCells = [];
    for (let i = 1; i <= 9; i++) {
      const cellId = `c${i}`;
      if (!cellValues[cellId]) {
        emptyCells.push(cellId);
      }
    }
    return emptyCells;
  }

  getCellDescription(cellId) {
    return this.cellDescriptions[cellId] || cellId;
  }
}

export default HintSystem;
