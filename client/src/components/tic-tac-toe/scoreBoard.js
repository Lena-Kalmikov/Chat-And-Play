import "./scoreBoard.css"
import React from "react"

export const ScoreBoard = ({ scores, xPlaying }) => {
  return (
    <div className="scoreboard">
      <span className={`score x-score ${!xPlaying && "inactive"}`}>X - {scores.xScore}</span>
      <span className={`score o-score ${xPlaying && "inactive"}`}>O - {scores.oScore}</span>
    </div>
  )
}