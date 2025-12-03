import React, { Component } from "react";

import io from "socket.io-client";

import TweenMax from "gsap";

import rand_arr_elem from "../../helpers/rand_arr_elem";
import rand_to_fro from "../../helpers/rand_to_fro";
import Hints from "./Hints";

export default class GameMain extends Component {
  constructor(props) {
    super(props);

    this.winningCombinations = [
      // Rows
      ["c1", "c2", "c3"],
      ["c4", "c5", "c6"],
      ["c7", "c8", "c9"],
      // Columns
      ["c1", "c4", "c7"],
      ["c2", "c5", "c8"],
      ["c3", "c6", "c9"],
      // Diagonals
      ["c1", "c5", "c9"],
      ["c3", "c5", "c7"],
    ];

    const isLiveGame = this.props.game_type === "live";

    this.state = {
      cellValues: {},
      isPlayerTurn: true,
      isGameActive: !isLiveGame,
      gameStatus: isLiveGame ? "Connecting" : "Start game",
      gameKey: 0, // Used to trigger hint component reset
    };

    if (isLiveGame) {
      this.initializeSocket();
    }
  }

  componentDidMount() {
    this.animateGameStart();
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  initializeSocket() {
    this.socket = io(app.settings.ws_conf.loc.SOCKET__io.u);

    this.socket.on("connect", () => {
      this.socket.emit("new player", { name: app.settings.curr_user.name });
    });

    this.socket.on("pair_players", (data) => {
      this.setState({
        isPlayerTurn: data.mode === "m",
        isGameActive: true,
        gameStatus: "Playing with " + data.opp.name,
      });
    });

    this.socket.on("opp_turn", this.handleOpponentMove.bind(this));
  }

  animateGameStart() {
    TweenMax.from("#game_stat", 1, {
      display: "none",
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeIn,
    });

    TweenMax.from("#game_board", 1, {
      display: "none",
      opacity: 0,
      x: -200,
      y: -200,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeIn,
    });
  }

  animateCellMove(cellId) {
    TweenMax.from(this.refs[cellId], 0.7, {
      opacity: 0,
      scaleX: 0,
      scaleY: 0,
      ease: Power4.easeOut,
    });
  }

  animateWinningCells(winningSet) {
    winningSet.forEach((cellId) => {
      this.refs[cellId].classList.add("win");
    });

    TweenMax.killAll(true);
    TweenMax.from("td.win", 1, { opacity: 0, ease: Linear.easeIn });
  }

  renderCellContent(cellId) {
    const { cellValues } = this.state;

    return (
      <div>
        {cellValues[cellId] === "x" && <i className="fa fa-times fa-5x"></i>}
        {cellValues[cellId] === "o" && <i className="fa fa-circle-o fa-5x"></i>}
      </div>
    );
  }

  renderCell(cellId, additionalClasses = "") {
    return (
      <td
        key={cellId}
        id={`game_board-${cellId}`}
        ref={cellId}
        onClick={this.handleCellClick.bind(this)}
        className={additionalClasses}
      >
        {this.renderCellContent(cellId)}
      </td>
    );
  }

  renderGameBoard() {
    const boardRows = [
      [
        { id: "c1", classes: "" },
        { id: "c2", classes: "vbrd" },
        { id: "c3", classes: "" },
      ],
      [
        { id: "c4", classes: "hbrd" },
        { id: "c5", classes: "vbrd hbrd" },
        { id: "c6", classes: "hbrd" },
      ],
      [
        { id: "c7", classes: "" },
        { id: "c8", classes: "vbrd" },
        { id: "c9", classes: "" },
      ],
    ];

    return (
      <div id="game_board">
        <table>
          <tbody>
            {boardRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell) => this.renderCell(cell.id, cell.classes))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  handleCellClick(event) {
    const { isPlayerTurn, isGameActive, cellValues } = this.state;

    // Ignore clicks if it's not player's turn or game is not active
    if (!isPlayerTurn || !isGameActive) return;

    const cellId = event.currentTarget.id.substr(11); // Remove 'game_board-' prefix

    // Ignore clicks on already filled cells
    if (cellValues[cellId]) return;

    // Handle move based on game type
    if (this.props.game_type === "live") {
      this.makePlayerMoveInLiveGame(cellId);
    } else {
      this.makePlayerMoveAgainstComputer(cellId);
    }
  }

  makePlayerMoveAgainstComputer(cellId) {
    const newCellValues = {
      ...this.state.cellValues,
      [cellId]: "x",
    };

    this.animateCellMove(cellId);

    this.setState({ cellValues: newCellValues }, () => this.checkGameResult());
  }

  makeComputerMove() {
    const { cellValues } = this.state;
    const emptyCells = this.getEmptyCells(cellValues);

    if (emptyCells.length === 0) return;

    const bestMove = this.getBestComputerMove(cellValues, emptyCells);
    const newCellValues = {
      ...cellValues,
      [bestMove]: "o",
    };

    this.animateCellMove(bestMove);

    this.setState(
      {
        cellValues: newCellValues,
      },
      () => this.checkGameResult()
    );
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

  getBestComputerMove(cellValues, emptyCells) {
    const difficulty = this.props.difficulty || "hard";

    switch (difficulty) {
      case "easy":
        return this.getEasyComputerMove(emptyCells);

      case "medium":
        return this.getMediumComputerMove(cellValues, emptyCells);

      case "hard":
      default:
        return this.getHardComputerMove(cellValues, emptyCells);
    }
  }

  getEasyComputerMove(emptyCells) {
    // Easy: Just make random moves
    return rand_arr_elem(emptyCells);
  }

  getMediumComputerMove(cellValues, emptyCells) {
    // Medium: Sometimes make strategic moves, sometimes random
    const shouldPlaySmart = Math.random() > 0.4; // 60% chance to play smart

    if (!shouldPlaySmart) {
      return rand_arr_elem(emptyCells);
    }

    // 1. Try to win
    for (let cell of emptyCells) {
      const testValues = { ...cellValues, [cell]: "o" };
      if (this.checkForWinner(testValues, "o")) {
        return cell;
      }
    }

    // 2. Sometimes block player from winning (70% chance)
    if (Math.random() > 0.3) {
      for (let cell of emptyCells) {
        const testValues = { ...cellValues, [cell]: "x" };
        if (this.checkForWinner(testValues, "x")) {
          return cell;
        }
      }
    }

    // 3. Take center if available (50% chance)
    if (emptyCells.includes("c5") && Math.random() > 0.5) {
      return "c5";
    }

    // 4. Random move for remaining cases
    return rand_arr_elem(emptyCells);
  }

  getHardComputerMove(cellValues, emptyCells) {
    // 1. Try to win
    for (let cell of emptyCells) {
      const testValues = { ...cellValues, [cell]: "o" };
      if (this.checkForWinner(testValues, "o")) {
        return cell;
      }
    }

    // 2. Block player from winning
    for (let cell of emptyCells) {
      const testValues = { ...cellValues, [cell]: "x" };
      if (this.checkForWinner(testValues, "x")) {
        return cell;
      }
    }

    // 3. Take center if available
    if (emptyCells.includes("c5")) {
      return "c5";
    }

    // 4. Take corners
    const corners = ["c1", "c3", "c7", "c9"];
    const availableCorners = corners.filter((corner) =>
      emptyCells.includes(corner)
    );
    if (availableCorners.length > 0) {
      return rand_arr_elem(availableCorners);
    }

    // 5. Take edges
    const edges = ["c2", "c4", "c6", "c8"];
    const availableEdges = edges.filter((edge) => emptyCells.includes(edge));
    if (availableEdges.length > 0) {
      return rand_arr_elem(availableEdges);
    }

    // 6. Fallback to random
    return rand_arr_elem(emptyCells);
  }

  makePlayerMoveInLiveGame(cellId) {
    const newCellValues = {
      ...this.state.cellValues,
      [cellId]: "x",
    };

    this.animateCellMove(cellId);
    this.socket.emit("ply_turn", { cell_id: cellId });

    this.setState(
      {
        cellValues: newCellValues,
        isPlayerTurn: false,
      },
      () => this.checkGameResult()
    );
  }

  handleOpponentMove(data) {
    const newCellValues = {
      ...this.state.cellValues,
      [data.cell_id]: "o",
    };

    this.animateCellMove(data.cell_id);

    this.setState(
      {
        cellValues: newCellValues,
        isPlayerTurn: true,
      },
      () => this.checkGameResult()
    );
  }

  checkGameResult() {
    const { cellValues } = this.state;
    const isLiveGame = this.props.game_type === "live";

    const winnerInfo = this.findWinner(cellValues);
    if (winnerInfo) {
      this.handleGameWin(winnerInfo);
      return;
    }

    if (this.isBoardFull(cellValues)) {
      this.handleGameDraw();
      return;
    }

    this.continueGame(isLiveGame);
  }

  findWinner(cellValues) {
    for (let combination of this.winningCombinations) {
      const [a, b, c] = combination;
      if (
        cellValues[a] &&
        cellValues[a] === cellValues[b] &&
        cellValues[a] === cellValues[c]
      ) {
        return {
          winner: cellValues[a],
          winningCells: combination,
        };
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

  isBoardFull(cellValues) {
    for (let i = 1; i <= 9; i++) {
      if (!cellValues[`c${i}`]) {
        return false;
      }
    }
    return true;
  }

  handleGameWin(winnerInfo) {
    const { winner, winningCells } = winnerInfo;

    this.animateWinningCells(winningCells);

    const winMessage = winner === "x" ? "You win" : "Opponent wins";

    this.setState({
      gameStatus: winMessage,
      isGameActive: false,
    });

    this.disconnectSocket();
  }

  handleGameDraw() {
    this.setState({
      gameStatus: "Draw",
      isGameActive: false,
    });

    this.disconnectSocket();
  }

  continueGame(isLiveGame) {
    if (!isLiveGame) {
      if (this.state.isPlayerTurn) {
        this.setState({
          gameStatus: "Play",
          isPlayerTurn: false,
        });

        setTimeout(() => {
          this.makeComputerMove();
        }, rand_to_fro(500, 1000));
      } else {
        this.setState({
          gameStatus: "Play",
          isPlayerTurn: true,
        });
      }
    } else {
      this.setState({
        isPlayerTurn: !this.state.isPlayerTurn,
      });
    }
  }

  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  endGame() {
    this.disconnectSocket();
    this.props.onEndGame();
  }

  restartGame() {
    this.setState({
      cellValues: {},
      isPlayerTurn: true,
      isGameActive: this.props.game_type !== "live",
      gameStatus: this.props.game_type === "live" ? "Connecting" : "Start game",
      gameKey: this.state.gameKey + 1,
    });

    const cells = document.querySelectorAll("td.win");
    cells.forEach((cell) => {
      cell.classList.remove("win");
    });

    if (this.props.game_type === "live") {
      this.disconnectSocket();
      this.initializeSocket();
    }

    this.animateGameStart();
  }

  render() {
    const { cellValues, gameStatus, isGameActive, isPlayerTurn, gameKey } =
      this.state;
    const gameTypeDisplay =
      this.props.game_type === "live"
        ? "Live"
        : `Computer (${this.props.difficulty || "Hard"})`;

    return (
      <div id="GameMain" style={{ paddingBottom: "60px", minHeight: "100vh" }}>
        <h1>Play {gameTypeDisplay}</h1>

        <div id="game_stat">
          <div id="game_stat_msg">{gameStatus}</div>
          {isGameActive && (
            <div id="game_turn_msg">
              {isPlayerTurn ? "Your turn" : "Opponent turn"}
            </div>
          )}
        </div>

        <Hints
          cellValues={cellValues}
          isPlayerTurn={isPlayerTurn}
          isGameActive={isGameActive}
          gameType={this.props.game_type}
          gameKey={gameKey}
          winningCombinations={this.winningCombinations}
        />

        {this.renderGameBoard()}

        <div className="game-controls">
          <button
            type="button"
            onClick={this.restartGame.bind(this)}
            className="button restart-button"
          >
            <span>
              Restart Game <span className="fa fa-refresh"></span>
            </span>
          </button>

          <button
            type="submit"
            onClick={this.endGame.bind(this)}
            className="button end-button"
          >
            <span>
              End Game <span className="fa fa-caret-right"></span>
            </span>
          </button>
        </div>
      </div>
    );
  }
}
