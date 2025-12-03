import React, { Component } from "react";
import HintSystem from "../../helpers/hintSystem";

export default class Hints extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showHint: false,
      hintMessage: "",
      hintsUsed: 0,
    };

    this.hintSystem = new HintSystem(props.winningCombinations);
  }

  showHint = () => {
    const { cellValues, isPlayerTurn, isGameActive, gameType } = this.props;

    const hint = this.hintSystem.getHint(
      cellValues,
      isPlayerTurn,
      isGameActive,
      gameType
    );

    this.setState({
      hintMessage: hint,
      showHint: true,
      hintsUsed: this.state.hintsUsed + 1,
    });

    this.autoHideTimeout = setTimeout(() => {
      this.hideHint();
    }, 5000);
  };

  hideHint = () => {
    this.setState({ showHint: false });
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  };

  resetHints = () => {
    this.setState({
      showHint: false,
      hintMessage: "",
      hintsUsed: 0,
    });
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  };

  componentDidUpdate(prevProps) {
    // Reset hints when game restarts
    if (prevProps.gameKey !== this.props.gameKey) {
      this.resetHints();
    }
  }

  componentWillUnmount() {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
    }
  }

  render() {
    const { showHint, hintMessage, hintsUsed } = this.state;
    const { gameType, isGameActive, isPlayerTurn } = this.props;

    const canShowHint = gameType !== "live" && isGameActive && isPlayerTurn;

    return (
      <div className="hint-container">
        {showHint && (
          <div className="hint-popup">
            <div className="hint-content">
              <span className="hint-icon">💡</span>
              <span className="hint-text">{hintMessage}</span>
              <button
                className="hint-close"
                onClick={this.hideHint}
                title="Close hint"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {canShowHint && (
          <button
            type="button"
            onClick={this.showHint}
            className="button hint-button"
            disabled={!canShowHint}
          >
            <span>💡 Get Hint {hintsUsed > 0 && `(${hintsUsed})`}</span>
          </button>
        )}
      </div>
    );
  }
}
