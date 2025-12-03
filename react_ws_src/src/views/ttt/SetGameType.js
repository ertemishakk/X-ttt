import React, { Component } from "react";
import DifficultySelection from "./DifficultySelection";

class SetGameType extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showDifficultySelection: false,
    };
  }

  selTypeLive = (e) => {
    this.props.onSetType("live");
  };

  showDifficultyOptions = (e) => {
    this.setState({ showDifficultySelection: true });
  };

  goBack = (e) => {
    this.setState({ showDifficultySelection: false });
  };

  selTypeComp = (difficulty) => {
    this.props.onSetType("comp", difficulty);
  };

  render() {
    const { showDifficultySelection } = this.state;

    return (
      <div id="SetGameType">
        <h1>
          {showDifficultySelection
            ? "Choose difficulty level"
            : "Choose game type"}
        </h1>

        {!showDifficultySelection && (
          <div>
            <button
              type="button"
              onClick={this.selTypeLive}
              className="button long"
            >
              <span>
                Live against another player{" "}
                <span className="fa fa-caret-right"></span>
              </span>
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button
              type="button"
              onClick={this.showDifficultyOptions}
              className="button long"
            >
              <span>
                Against a computer <span className="fa fa-caret-right"></span>
              </span>
            </button>
          </div>
        )}

        {showDifficultySelection && (
          <DifficultySelection
            onSelectDifficulty={this.selTypeComp}
            onGoBack={this.goBack}
          />
        )}
      </div>
    );
  }
}

export default SetGameType;
