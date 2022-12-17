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
  perMessageDeflate :false,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let users = {
  "test": { "password": "test", "isOnline": false },
  "test2": { "password": "test2", "isOnline": false },
  "dana": { "password": "dana", "isOnline": false },
  "tigo": { "password": "tigo", "isOnline": false },
  "adam": { "password": "adam", "isOnline": false },
  "avi": { "password": "avi", "isOnline": false },
  "tal": { "password": "tal", "isOnline": false },
};

let rooms = { 1: { "users": ["dana", "tigo"] } };

const notify_user_list_changed = () => {
  Object.keys(users).forEach(function (username) {
    if (users[username]["isOnline"]) {
      io.to(users[username]["socketId"]).emit("on_user_list_changed", {});
      console.log(`"notify_user_list_changed" ${username} is online`);
    }
  });
}

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  //<------------------register------------------>
  socket.on("register_user", (data) => {
    console.log(`User is trying to register with Username: ${data.username}, Password: ${data.password}, Socket id: ${socket.id}`);

    if (data.username in users) {
      socket.emit("on_register_response", { "error": "Username already exists, try to Login instead" });
      console.log(`User is trying to register with Username: ${data.username} which already exists. Socket id: ${socket.id}`);
      return;
    }

    if (data.username === "" || data.password === "") {
      socket.emit("on_register_response", { "error": "User is trying to register with empty Username or Password" });
      console.log(`User is trying to register with empty Username or Password. Socket id: ${socket.id}`);
      return;
    }

    socket.username = data.username;
    users[data.username] = { "password": data.password, "isOnline": true, "socketId": socket.id, "isJoinedRoom": false };
    socket.emit("on_register_response", { "error": null, "username": data.username });
    console.log(`Succsefully registered user ${data.username}, Socket id: ${socket.id}`);

    notify_user_list_changed();
  });

  //<------------------login------------------>
  socket.on("login_user", (data) => {
    console.log(`User is trying to login with Username: ${data.username}, Password: ${data.password}, Socket id: ${socket.id}`);

    if (data.username === "" || data.password === "") {
      socket.emit("on_login_response", { "error": "User is trying to Login with empty Username or Password" });
      console.log(`User is trying to login with empty Username or Password. Socket id: ${socket.id}`);
      return;
    }

    if (!(data.username in users)) {
      socket.emit("on_login_response", { "error": "User does not exist, try to Register instead" });
      console.log(`User is trying to login with username: ${data.username} which does not exist. Socket id: ${socket.id}`);
      return;
    }

    if (users[data.username]["password"] !== data.password) {
      socket.emit("on_login_response", { "error": "Wrong password!" });
      console.log(`User entered wrong password for username ${data.username}. Socket id: ${socket.id}`);
      return;
    }

    users[data.username]["isOnline"] = true;
    users[data.username]["socketId"] = socket.id;
    users[data.username]["isJoinedRoom"] = false;
    socket.username = data.username;
    socket.emit("on_login_response", { "error": null, "username": data.username });
    console.log(`User Succsefully logged in: ${data.username}. Socket id: ${socket.id}`);

    notify_user_list_changed();
  });

  //<------------------load user lists------------------>
  socket.on("load_online_users", () => {
    let onlineUsers = [];

    Object.keys(users).forEach(function (username) {
      if (users[username]["isOnline"] && !users[username]["isJoinedRoom"]) {
        onlineUsers.push(username)
      }
    });

    socket.emit("online_user_list", onlineUsers);
    console.log("Online user list loaded");
  });

  socket.on("load_offline_users", () => {
    let offlineUsers = [];

    Object.keys(users).forEach(function (username) {
      if (users[username]["isOnline"] === false) {
        offlineUsers.push(username)
      }
    });

    socket.emit("offline_user_list", offlineUsers);
    console.log("Offline user list loaded");
  });

  //<------------------open room------------------>
  socket.on("open_room", (data) => {
    inviting_user = socket.username
    invited_user = data.username

    if (invited_user === "") {
      socket.emit("on_room_opened", { "error": "Missing invited user" });
      return;
    }

    Object.keys(rooms).forEach(function (room) {
      if (rooms[room]["users"].includes(invited_user)) {
        socket.emit("on_room_opened", { "error": "User is already in another room" });
        return;
      }
    });

    roomId = uuidv4();
    socket.join(roomId);
    io.to(users[invited_user]["socketId"]).emit("on_room_join_request", { "requesting_user": inviting_user, "roomId": roomId });
    socket.emit("on_room_opened", { "roomId": roomId, "error": null });
    rooms[roomId] = { "users": [inviting_user] };
    console.log(`Opened room id: ${roomId} by ${inviting_user} inviting ${invited_user} to join`);
  });

  //<------------------join room------------------>
  socket.on("join_room", (data) => {
    if (rooms[data.roomId]["users"].length >= 2) {
      socket.emit("on_room_request_answer", { "error": "Room is already full" });
      return;
    }

    inviting_user_socket = io.to(users[data.inviting_username]["socketId"]);

    if (!data["request_answer"]) {
      inviting_user_socket.emit("on_room_request_answer", { "isAccepted": false });
      rooms[roomId] = { "users": [] };
      return;
    }

    inviting_user_socket.emit("on_room_request_answer", { "isAccepted": true });
    users_list = [data.inviting_username, socket.username];
    rooms[data.roomId] = { "users": users_list, "x": data.inviting_username, "o": socket.username, "currentTurn": data.inviting_username };
    socket.join(data.roomId);
    users_list.forEach(user => users[user]["isJoinedRoom"] = true);
    socket.emit("on_room_answer", {});



    notify_user_list_changed();
  });

  //<------------------leave room------------------>
  socket.on("leave_room", (data) => {
    rooms[data.roomId]["users"].forEach(user => {
      user_socket = io.to(users[user]["socketId"]);
      user_socket.emit("on_leave_room");
      users[user]["isJoinedRoom"] = false;
      console.log(`is user in a room? ${users[user]["isJoinedRoom"]}`)
    });

    rooms[data.roomId]["users"] = [];
  });

  //<------------------send message------------------>
  socket.on("send_message", (data) => {
    if (rooms[data.room]["users"].filter(user => user = socket.username).length < 1) {
      console.log("you can't send a message to a room you are not in")
      return
    }

    socket.to(data.room).emit("receive_message", data);
    console.log(`${socket.username} is sending a message to ${rooms[data.room]["users"].filter(user => user != socket.username)} in room: ${data.room}`);
  });

  //<------------------game------------------>
  socket.on("game_start", (data) => {
    let room = rooms[data.roomId]

    isX = room["x"] === socket.username
    isMyTurn = room["currentTurn"] == socket.username

    socket.emit("on_game_init", { "isX": isX, "isMyTurn": isMyTurn })

    console.log(`${socket.username} is going to play "${isX ? "x" : "o"}" and the first turn is for: ${room["currentTurn"]}`);
  });

  socket.on("make_turn", (data) => {
    let room = rooms[data.roomId]

    if (room["currentTurn"] !== socket.username) {
      console.log(`${socket.username} tired to make turn when its not is, cheater!`);
      return
    }

    let other_username = rooms[data.roomId]["users"].filter(user => user !== socket.username)[0]
    let user_socket = io.to(users[other_username]["socketId"]);

    room["currentTurn"] = other_username
    let isX = room["x"] === socket.username

    user_socket.emit("on_turn_made", { "squareIndex": data.squareIndex })

    socket.emit("validated_turn", { "squareIndex": data.squareIndex })

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
    let isLoggedIn = username != null;
    socket.emit("isLoggedIn", { "isLoggedIn": isLoggedIn });
    console.log(`Socket closed: ${socket.id}`);
  });

  //<------------------disconnect------------------>
  socket.on("disconnect", () => {
    console.log(`Socket closed: ${socket.id}`);
    if (socket.username) {
      users[socket.username]["isOnline"] = false;
    }
    notify_user_list_changed();
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