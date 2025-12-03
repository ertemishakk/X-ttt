import React, { Component } from "react";

import io from "socket.io-client";

import TweenMax from "gsap";

import rand_arr_elem from "../../helpers/rand_arr_elem";
import rand_to_fro from "../../helpers/rand_to_fro";

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

  render() {
    const { cellValues, gameStatus, isGameActive, isPlayerTurn } = this.state;

    return (
      <div id="GameMain">
        <h1>Play {this.props.game_type}</h1>

        <div id="game_stat">
          <div id="game_stat_msg">{gameStatus}</div>
          {isGameActive && (
            <div id="game_turn_msg">
              {isPlayerTurn ? "Your turn" : "Opponent turn"}
            </div>
          )}
        </div>

        <div id="game_board">
          <table>
            <tbody>
              <tr>
                <td
                  id="game_board-c1"
                  ref="c1"
                  onClick={this.handleCellClick.bind(this)}
                >
                  {this.renderCellContent("c1")}
                </td>
                <td
                  id="game_board-c2"
                  ref="c2"
                  onClick={this.handleCellClick.bind(this)}
                  className="vbrd"
                >
                  {this.renderCellContent("c2")}
                </td>
                <td
                  id="game_board-c3"
                  ref="c3"
                  onClick={this.handleCellClick.bind(this)}
                >
                  {this.renderCellContent("c3")}
                </td>
              </tr>
              <tr>
                <td
                  id="game_board-c4"
                  ref="c4"
                  onClick={this.handleCellClick.bind(this)}
                  className="hbrd"
                >
                  {this.renderCellContent("c4")}
                </td>
                <td
                  id="game_board-c5"
                  ref="c5"
                  onClick={this.handleCellClick.bind(this)}
                  className="vbrd hbrd"
                >
                  {this.renderCellContent("c5")}
                </td>
                <td
                  id="game_board-c6"
                  ref="c6"
                  onClick={this.handleCellClick.bind(this)}
                  className="hbrd"
                >
                  {this.renderCellContent("c6")}
                </td>
              </tr>
              <tr>
                <td
                  id="game_board-c7"
                  ref="c7"
                  onClick={this.handleCellClick.bind(this)}
                >
                  {this.renderCellContent("c7")}
                </td>
                <td
                  id="game_board-c8"
                  ref="c8"
                  onClick={this.handleCellClick.bind(this)}
                  className="vbrd"
                >
                  {this.renderCellContent("c8")}
                </td>
                <td
                  id="game_board-c9"
                  ref="c9"
                  onClick={this.handleCellClick.bind(this)}
                >
                  {this.renderCellContent("c9")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          onClick={this.endGame.bind(this)}
          className="button"
        >
          <span>
            End Game <span className="fa fa-caret-right"></span>
          </span>
        </button>
      </div>
    );
  }
}
