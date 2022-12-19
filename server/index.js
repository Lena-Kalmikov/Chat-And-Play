const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");
const { on } = require("events");

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  perMessageDeflate: false,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// to do - move the users to an external DB.
let users = {
  "test": { "password": "test", "isOnline": false },
  "test2": { "password": "test2", "isOnline": false },
  "test3": { "password": "test3", "isOnline": false },
  "dana": { "password": "dana", "isOnline": false },
  "tigo": { "password": "tigo", "isOnline": false },
  "adam": { "password": "adam", "isOnline": false },
  "avi": { "password": "avi", "isOnline": false },
  "tal": { "password": "tal", "isOnline": false },
};

// keeps track of all rooms.
let rooms = { 1: { "users": ["dana", "tigo"] } };

// goes over the users and notifies if a user's online status has changed. 
// called whenever the user list needs to be updated. 
const notifyUserListChanged = () => {
  Object.keys(users).forEach(function (username) {
    if (users[username]["isOnline"]) {
      io.to(users[username]["socketId"]).emit("on_user_list_changed", {});
      console.log(`"notifyUserListChanged" ${username} is online`);
    }
  });
}

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  //<------------------register------------------>
  socket.on("register_user", (data) => {
    console.log(`User is trying to register with Username: ${data.username}, Password: ${data.password}, Socket id: ${socket.id}`);

    // checks if a user trying to register with an existing username
    // and then sends the data to client using emit
    if (data.username in users) {
      socket.emit("on_register_response", { "error": "Username already exists, try to Login instead" });
      console.log(`User is trying to register with Username: ${data.username} which already exists. Socket id: ${socket.id}`);
      return;
    }

    // if both fields are not empty, user will be registerd and added to users.
    if (data.username === "" || data.password === "") {
      socket.emit("on_register_response", { "error": "User is trying to register with empty Username or Password" });
      console.log(`User is trying to register with empty Username or Password. Socket id: ${socket.id}`);
      return;
    }

    socket.username = data.username;
    //saves the data from client to users.
    users[data.username] = { "password": data.password, "isOnline": true, "socketId": socket.id, "isJoinedRoom": false };
    //sends the username back to client
    socket.emit("on_register_response", { "error": null, "username": data.username });
    console.log(`Succsefully registered user ${data.username}, Socket id: ${socket.id}`);

    notifyUserListChanged();
  });

  //<------------------login------------------>
  socket.on("login_user", (data) => {
    console.log(`User is trying to login with Username: ${data.username}, Password: ${data.password}, Socket id: ${socket.id}`);
    // if user will try to login with empty fields, she'll get an error.
    // the error will be sent to client using emit
    if (data.username === "" || data.password === "") {
      socket.emit("on_login_response", { "error": "User is trying to Login with empty Username or Password" });
      console.log(`User is trying to login with empty Username or Password. Socket id: ${socket.id}`);
      return;
    }
    // if user tries to login with username not in users, she'll get an error.
    if (!(data.username in users)) {
      socket.emit("on_login_response", { "error": "User does not exist, try to Register instead" });
      console.log(`User is trying to login with username: ${data.username} which does not exist. Socket id: ${socket.id}`);
      return;
    }
    // if the user's username is in users, but the password is wrong, she'll get an error.
    if (users[data.username]["password"] !== data.password) {
      socket.emit("on_login_response", { "error": "Wrong password!" });
      console.log(`User entered wrong password for username ${data.username}. Socket id: ${socket.id}`);
      return;
    }
    // otherwise, a login in will be preformed
    users[data.username]["isOnline"] = true;
    users[data.username]["socketId"] = socket.id;
    users[data.username]["isJoinedRoom"] = false;
    socket.username = data.username;
    // the logged in username will be sent back to client
    socket.emit("on_login_response", { "error": null, "username": data.username });
    console.log(`User Succsefully logged in: ${data.username}. Socket id: ${socket.id}`);
    notifyUserListChanged();
  });

  //<------------------load user lists------------------>
  socket.on("load_online_users", () => {
    let onlineUsers = [];
    // checks if user is online and not in a room, and adds her to the online list.
    // once the user enters to a room, they will disappear from the online list as they're not available to chat.
    Object.keys(users).forEach(function (username) {
      if (users[username]["isOnline"] && !users[username]["isJoinedRoom"]) {
        onlineUsers.push(username)
      }
    });
    // sends the updated online list to the client
    socket.emit("online_user_list", onlineUsers);
    console.log("Online user list loaded");
  });

  socket.on("load_offline_users", () => {
    let offlineUsers = [];
    // checks if user is not online and adds her to the offline list.
    Object.keys(users).forEach(function (username) {
      if (users[username]["isOnline"] === false) {
        offlineUsers.push(username)
      }
    });
    // sends the updated offline list to client
    socket.emit("offline_user_list", offlineUsers);
    console.log("Offline user list loaded");
  });

  //<------------------open room------------------>
  socket.on("open_room", (data) => {
    // inviting user is me, invited user's data comes from the client
    inviting_user = socket.username
    invited_user = data.username

    // if there's no invited user, error will be sent to client.
    if (invited_user === "") {
      socket.emit("on_room_opened", { "error": "Missing invited user" });
      return;
    }

    // if the invited user is already in another room, error will be sent to client.
    Object.keys(rooms).forEach(function (room) {
      if (rooms[room]["users"].includes(invited_user)) {
        socket.emit("on_room_opened", { "error": "User is already in another room" });
        return;
      }
    });

    // otherwise a room with random number will be opened. 
    roomId = uuidv4();
    socket.join(roomId);
    // sends back the info of the inviting user to client.
    io.to(users[invited_user]["socketId"]).emit("on_room_join_request", { "requesting_user": inviting_user, "roomId": roomId });
    // sends back the info of the room to client.
    socket.emit("on_room_opened", { "roomId": roomId, "error": null });
    // adds the inviting user to the room.
    rooms[roomId] = { "users": [inviting_user] };
    console.log(`Opened room id: ${roomId} by ${inviting_user} inviting ${invited_user} to join`);
  });

  //<------------------join room------------------>
  socket.on("join_room", (data) => {
    // checks if the number of people in a room is equal or higher than 2
    if (rooms[data.roomId]["users"].length >= 2) {
      // sends error to client that the room is full, so they can't join.
      socket.emit("on_room_request_answer", { "error": "Room is already full, it can have only 2 people" });
      return;
    }

    inviting_userSocket = io.to(users[data.inviting_username]["socketId"]);
    // if the invited user doesn't accept the invite, the room will be decalred as empty.
    if (!data["request_answer"]) {
      inviting_userSocket.emit("on_room_request_answer", { "isAccepted": false });
      rooms[roomId] = { "users": [] };
      return;
    }
    // the invited user accetps and this info sent to client.
    inviting_userSocket.emit("on_room_request_answer", { "isAccepted": true });
    // the user list will be updated to both users.
    users_list = [data.inviting_username, socket.username];
    // the room will include the users in the list, if they want to play, the inviting user will start as "x".
    rooms[data.roomId] = { "users": users_list, "x": data.inviting_username, "o": socket.username, "currentTurn": data.inviting_username };
    socket.join(data.roomId);
    // now both users are joined the room.
    users_list.forEach(user => users[user]["isJoinedRoom"] = true);
    socket.emit("on_room_answer", {});

    notifyUserListChanged();
  });

  //<------------------leave room------------------>
  socket.on("leave_room", (data) => {
    // in case someone leaves the room, both users in a room will be removed from it.
    rooms[data.roomId]["users"].forEach(user => {
      userSocket = io.to(users[user]["socketId"]);
      userSocket.emit("on_leave_room");
      users[user]["isJoinedRoom"] = false;
      users[user]["isOnline"] = true;

      console.log(`is user in a room? ${users[user]["isJoinedRoom"]}`)
    });

    rooms[data.roomId]["users"] = [];
    notifyUserListChanged();
  });

  //<------------------send message------------------>
  socket.on("send_message", (data) => {
    // checks if a user is in a room before the can send a message.
    if (rooms[data.room]["users"].filter(user => user = socket.username).length < 1) {
      console.log("you can't send a message to a room you are not in")
      return
    }
    // sends the message to client.
    socket.to(data.room).emit("receive_message", data);
    console.log(`${socket.username} is sending a message to ${rooms[data.room]["users"].filter(user => user != socket.username)} in room: ${data.room}`);
  });

  //<------------------game------------------>
  socket.on("game_start", (data) => {
    let room = rooms[data.roomId]
    // sets the inviting user as x
    isX = room["x"] === socket.username
    // set the turn of inviting user be true
    isMyTurn = room["currentTurn"] === socket.username
    // send the info to client
    socket.emit("on_game_init", { "isX": isX, "isMyTurn": isMyTurn })

    console.log(`${socket.username} is going to play "${isX ? "x" : "o"}" and the first turn is for: ${room["currentTurn"]}`);
  });

  socket.on("make_turn", (data) => {
    let room = rooms[data.roomId]

    if (room["currentTurn"] !== socket.username) {
      console.log(`${socket.username} tried to make turn when it's not hers, cheater!`);
      return
    }

    // other user is the user who's been invited to the room.
    let otherUser = rooms[data.roomId]["users"].filter(user => user !== socket.username)[0]
    let userSocket = io.to(users[otherUser]["socketId"]);

    // sets the turn to be other user's
    room["currentTurn"] = otherUser
    let isX = room["x"] === socket.username

    // sends other users move to client.
    userSocket.emit("on_turn_made", { "squareIndex": data.squareIndex, 'isX': isX })
    socket.emit("validated_turn", { "squareIndex": data.squareIndex, 'isX': isX })

    console.log(`${socket.username} made a turn to put "${isX ? "x" : "o"}" on index: ${data.squareIndex}`);
  });

  socket.on("reset_game", (data) => {
    socket.to(data.roomId).emit("game_reset");
  });

  //<------------------username check------------------>
  socket.on("who_am_i", () => {
    socket.emit("on_who_am_i", socket.username);
  });

  //<------------------session check------------------>
  socket.on("is_session_logged_in", () => {
    let username = "username" in socket ? socket.username : null;
    let isLoggedIn = username !== null;
    socket.emit("isLoggedIn", { "isLoggedIn": isLoggedIn });
    console.log(`Socket closed: ${socket.id}`);
  });

  //<------------------disconnect------------------>
  socket.on("disconnect", () => {
    console.log(`Socket closed: ${socket.id}`);
    if (socket.username) {
      // changes the user to be offline
      users[socket.username]["isOnline"] = false;
    }
    notifyUserListChanged();
  });
});

// config for Azure:
server.listen(process.env.PORT || 3001, () => {
  var addr = server.address();
  console.log('app listening on http://' + addr.address + ':' + addr.port);
});

// //localhost:
// server.listen(3001, () => {
//   console.log("Server Running");
// });