import "./chat.css"
import React, { useEffect, useState } from "react";
import ScrollToBottom from "react-scroll-to-bottom";
import socket from "../services/socketIoService";


function Chat(props) {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const sendMessage = () => {
    let hours = new Date(Date.now()).getHours();
    let minutes = new Date(Date.now()).getMinutes();
    minutes = minutes <= 9 ? "0" + minutes : minutes;

    if (currentMessage !== "") {
      const messageData = {
        room: props.roomId,
        username: props.username,
        message: currentMessage,
        time:
          hours +
          ":" +
          minutes,
      };
      socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
    }
  };
  const backToUsers = () => {
    props.userWantsToChat(false);
  }

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("on_leave_room", () => {
      backToUsers();
    });
  }, []);

  useEffect(() => {
    return () => {
      // Anything in here is fired on component unmount.
      console.log(`leaving room: ${props.roomId}`);
      socket.emit("leave_room", { "roomId": props.roomId });
    }
  }, [])

  return (
    <div className="chat-window">
      <div className="chat-header">
        <p>&#128994;</p>
        <p>Live Chat</p>
      </div>
      <div className="chat-body">
        <ScrollToBottom className="message-container">
          {messageList.map((messageContent) => {
            return (
              <div
                className="message"
                id={props.username === messageContent.username ? "you" : "other"}
                key={messageList[messageContent.time][messageContent.username][messageContent.message]}>
                <div>
                  <div className="message-content">
                    <p>{messageContent.message}</p>
                  </div>
                  <div className="message-meta">
                    <p id="time">{messageContent.time}</p>
                    <p id="username">{messageContent.username}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className="chat-footer">
        <input
          type="text"
          value={currentMessage}
          placeholder="Hey..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={(event) => {
            event.key === "Enter" && sendMessage();
          }}
        />
        <button onClick={sendMessage}>&#10148;</button>
      </div>
      <div>
        <button className="back" onClick={backToUsers}>Back to Users</button>
      </div>
    </div>
  );
}
export default Chat;