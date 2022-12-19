import "./users.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socketIoService";
import ScrollToBottom from "react-scroll-to-bottom";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContentText from "@material-ui/core/DialogContentText";
import Dialog from "@material-ui/core/Dialog";
import Button from "@material-ui/core/Button";

function Users(props) {
  const navigate = useNavigate();

  const [joinRoomDialogOpen, setJoinRoomDialogOpen] = useState(false);
  const [offlineUsersList, setOfflineUsersList] = useState([]);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [corrunetChoice, setCurrentChoice] = useState(-1);
  const [selectedUser, setSelectedUser] = useState("");
  const [invitingUser, setInvitingUser] = useState("");
  const [roomId, setRoomId] = useState("");

  const getOnlineUsers = () => {
    socket.emit("load_online_users")
  };

  const getOfflineUsers = () => {
    socket.emit("load_offline_users")
  }

  const openChat = () => {
    socket.emit("open_room", { "username": selectedUser });
    alert(`Invite sent to ${selectedUser}, waiting for their answer`);
  }

  const onJoinChatConfirmation = () => {
    socket.emit("join_room", { "request_answer": true, "roomId": roomId, "inviting_username": invitingUser })
    console.log(`Joining chat room ${roomId}`)
    props.userWantsToChat(true);
    setJoinRoomDialogOpen(false)
  }

  const onJoinChatClose = () => {
    socket.emit("join_room", { "request_answer": false, "roomId": roomId, "inviting_username": invitingUser })
    setJoinRoomDialogOpen(false)
  }

  const chosenUser = (username) => {
    setSelectedUser(username);
    setCurrentChoice(username);
  }

  socket.emit("is_session_logged_in");

  useEffect(() => {
    getOnlineUsers();
    getOfflineUsers();

    socket.on("online_user_list", (data) => {
      let users = data.filter(function (user) { return user !== props.username })
      setOnlineUsersList(users);
    });

    socket.on("offline_user_list", (data) => {
      setOfflineUsersList(data);
    });

    socket.on("on_user_list_changed", () => {
      getOnlineUsers();
      getOfflineUsers();
    });

    socket.on("isLoggedIn", (data) => {
      if (!data.isLoggedIn) {
        navigate("/")
      }
    });

    // notify the invited user someone wants to invite him to a chat room
    socket.on("on_room_join_request", (data) => {
      setInvitingUser(data.requesting_user);
      props.joinRoom(data.roomId);
      setRoomId(data.roomId);
      setJoinRoomDialogOpen(true);
    });

    // answer to the inviting user from the invited user to join chat
    socket.on("on_room_request_answer", (data) => {
      if (data.isAccepted) {
        props.userWantsToChat(true);
      }
      if (!data.isAccepted) {
        alert(`The user has rejected your invite :(`)
      }
    });

    // when requesting to open a new room with someone, notify success request
    socket.on("on_room_opened", (data) => {
      props.joinRoom(data.roomId)

      if (data.error) {
        alert(data.error)
        return
      }
    });
  }, []);

  return (
    <div>
      <div className="users" id="online">
        <h1>&#128994; Online Users</h1>
        <ScrollToBottom className="list-container-online">
          {onlineUsersList.map((username) => {
            return <h2
              onClick={() => chosenUser(username)}
              key={username}
              className={username === corrunetChoice ? "clicked" : ""}>
              {username}
            </h2>
          })}
        </ScrollToBottom>
        <button className="btn" onClick={openChat}>Open Chat</button>
      </div>
      <div className="users" id="offline">
        <h1>&#128308; Offline Users</h1>
        <ScrollToBottom className="list-container-offline">
          {offlineUsersList.map((username) => {
            return <h2 key={username}>{username}</h2>
          })}
        </ScrollToBottom>
      </div>
      <Dialog open={joinRoomDialogOpen} onClose={onJoinChatClose}>
        <DialogTitle>
          <b>{invitingUser}</b> is inviting you to chat
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="dialogContentText" >
            Would you like to join them?
          </DialogContentText>
        </DialogContent>
        <DialogActions className="dialogActions">
          <Button onClick={onJoinChatConfirmation} color="primary" autoFocus>
            <b>Yes</b>
          </Button>
          <Button onClick={onJoinChatClose} color="primary">
            <b>No</b>
          </Button>
        </DialogActions>
      </Dialog>
    </div >
  );
}
export default Users;