import io from "socket.io-client";

// // localhost:
// const socket = io.connect("http://localhost:3001/");

//config for Azure:
const socket = io.connect("https://chatgameapp.azurewebsites.net");

export default socket;