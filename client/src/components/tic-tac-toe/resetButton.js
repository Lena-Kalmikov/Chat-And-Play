import "./resetButton.css";
import React from "react";

export const ResetButton = ({ resetBoard }) => {
    return (
        <div>
            <button className="reset-btn" onClick={resetBoard}>Reset Game</button>
        </div>
    )
}