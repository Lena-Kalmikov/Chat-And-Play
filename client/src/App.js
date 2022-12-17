import "./App.css";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Chat from "./components/chat";
import Users from "./components/users";
import Game from "./components/tic-tac-toe/game";

function App() {

  const navigate = useNavigate();
  const location = useLocation();

  const [chatButtonclicked, SetChatButtonclicked] = useState(false);
  const [username] = useState(location != null && location.state != null && "username" in location.state ? location.state.username : null);
  const [roomId, setRoomId] = useState("");

  const isLoggedIn = (username != null && username !== "");

  if (!isLoggedIn) {
    navigate("/")
    return
  }

  const userWantsToChat = (isChatButtonClicked) => {
    SetChatButtonclicked(isChatButtonClicked);
  };

  const joinRoom = (roomid) => {
    setRoomId(roomid);
  };

  return (
    <div className="App">
      {!chatButtonclicked ? (<div>
        <Users userWantsToChat={userWantsToChat} joinRoom={joinRoom} username={username} />
      </div>) : (<div className="parent">
        <div className="child">
          <Chat userWantsToChat={userWantsToChat} username={username} roomId={roomId} />
        </div>
        <div className="child">
          <Game username={username} roomId={roomId} />
        </div>
      </div>)
      }
    </div>
  );
}
export default App;