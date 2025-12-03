import React, { Component } from "react";

export default class DifficultySelection extends Component {
  render() {
    const { onSelectDifficulty, onGoBack } = this.props;

    const difficultyLevels = [
      {
        level: "easy",
        label: "Easy",
      },
      {
        level: "medium",
        label: "Medium",
      },
      {
        level: "hard",
        label: "Hard",
      },
    ];

    return (
      <div>
        {difficultyLevels.map((difficulty, index) => (
          <div key={difficulty.level}>
            <button
              type="submit"
              onClick={() => onSelectDifficulty(difficulty.level)}
              className="button long"
            >
              <span>
                {difficulty.label} <span className="fa fa-caret-right"></span>
              </span>
            </button>
          </div>
        ))}

        <button type="submit" onClick={onGoBack} className="button back-button">
          <span>
            <span className="fa fa-caret-left"></span> Back
          </span>
        </button>
      </div>
    );
  }
}
