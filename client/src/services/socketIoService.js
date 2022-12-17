import io from "socket.io-client";

// localhost:3001
const socket = io.connect("https://chatgameapp.azurewebsites.net");

export default socket;