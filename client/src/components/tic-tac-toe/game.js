import { useEffect, useState } from "react";
import { Board } from "./board";
import { ResetButton } from "./resetButton";
import { ScoreBoard } from "./scoreBoard";
import socket from "../../services/socketIoService";

function Game(props) {
  const WIN_CONDITIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ]

  const [xPlaying, setXPlaying] = useState(true);
  const [isMyTurn, setIsMyTurn] = useState(true);
  const [board, setBoard] = useState(Array(9).fill(null))
  const [scores, setScores] = useState({ xScore: 0, oScore: 0 })
  const [gameOver, setGameOver] = useState(false);

  const updateBoard = (squareIndex, xo) => {
    const updatedBoard = board.map((value, idx) => {
      if (idx === squareIndex) {
        return xo;
      } else {
        return value;
      }
    });

    setBoard(updatedBoard);
    onTurnMadeCheckWinner(updatedBoard);
    return updatedBoard;
  }

  const onTurnMadeCheckWinner = (updatedBoard) => {
    const winner = checkWinner(updatedBoard);
    if (winner) {
      if (winner === "O") {
        let { oScore } = scores;
        oScore += 1;
        setScores({ ...scores, oScore })
        console.log(`O score is: ${oScore} `)
      } else {
        let { xScore } = scores;
        xScore += 1;
        setScores({ ...scores, xScore })
        console.log(`X score is: ${xScore} `)
      }
      setGameOver(true);
      resetBoard();
    }
  }

  socket.on("on_game_init", (data) => {
    console.log(`${props.username} is going to play "${data.isX ? "x" : "o"}" and the first turn is for: ${data.isMyTurn ? "me" : "other player"}`)
    setXPlaying(data.isX)
    setIsMyTurn(data.isMyTurn)
  });


  socket.on("game_reset", () => {
    setGameOver(true);
    resetBoard();
  });

  useEffect(() => {
    console.log(board)
  }, [board])

  useEffect(() => {
    console.log(scores)
  }, [scores])

  socket.on("on_turn_made", (data) => {
    let xo = xPlaying ? "O" : "X"
    updateBoard(data.squareIndex, xo)
    setIsMyTurn(true)
    console.log(`player made a turn on index: ${data.squareIndex}, Who am i? ${xPlaying ? "x" : "o"}`)
  });

  socket.on("validated_turn", (data) => {
    let xo = xPlaying ? "X" : "O"
    updateBoard(data.squareIndex, xo)
    setIsMyTurn(false)
    console.log(`You made a turn on index: ${data.squareIndex}, Who am i? ${xPlaying ? "x" : "o"}`)
  });

  useEffect(() => {
    socket.emit("game_start", { "roomId": props.roomId });




  }, [])

  const handleSquareClick = (squareIndex) => {
    if (!isMyTurn) {
      console.log("not your turn")
      return
    }
    socket.emit("make_turn", { "squareIndex": squareIndex, "roomId": props.roomId })
  }

  const checkWinner = (board) => {
    for (let i = 0; i < WIN_CONDITIONS.length; i++) {
      const [x, y, z] = WIN_CONDITIONS[i];

      if (board[x] && board[x] === board[y] && board[y] === board[z]) {
        return board[x];
      }
    }
  }

  const resetBoard = () => {
    setGameOver(false);
    setBoard(Array(9).fill(null));
  }

  const askToResetGame = () => {
    let is_board_full = board.filter(function (square) { return square === null }).length === 0

    if (!gameOver && is_board_full) {
      socket.emit("reset_game", { "roomId": props.roomId });
      setGameOver(true);
      resetBoard();
    } else {
      alert("You can reset the game only in case of a tie");
    }
  }

  return (
    <div>
      <ScoreBoard scores={scores} xPlaying={xPlaying} />
      <Board board={board} onClick={gameOver ? resetBoard : handleSquareClick} />
      <ResetButton resetBoard={askToResetGame} />
    </div>
  );
}
export default Game;