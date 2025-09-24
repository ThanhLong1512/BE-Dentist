const io = require("socket.io")(8090, {
  cors: {
    origin: "http://localhost:5173"
  }
});
let users = [];
function addUser(userID, socketID) {
  !users.some(user => user.userID === userID) &&
    users.push({ userID, socketID });
}
function removeUser(socketID) {
  users = users.filter(user => user.socketID !== socketID);
}
function getUser(userID) {
  return users.find(user => user.userID === userID);
}
io.on("connection", socket => {
  console.log("New client connected");
  // take UserID and SocketID from client
  socket.on("addUser", userID => {
    addUser(userID, socket.id);
    io.emit("getUsers", users);
  });
  //send message and get message from client
  socket.on("sendMessage", ({ senderID, receiverID, text }) => {
    const user = getUser(receiverID);
    if (user) {
      io.to(user.socketID).emit("getMessage", {
        senderID,
        text
      });
    }
  });
  // when client disconnects
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
