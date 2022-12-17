import "./board.css"
import React from "react"
import { Square } from "./square"

export const Board = ({ board, onClick }) => {
  return (
    <div className="board">
      {
        board.map((value, idx) => {
          return <Square key={idx} value={value} onClick={() => value === null && onClick(idx)} />;
        })
      }
    </div>
  )
}