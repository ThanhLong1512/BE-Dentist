const io = require("socket.io")(8090, {
  cors: {
    origin: "http://localhost:5173"
  }
});
io.on("connection", socket => {
  console.log("New client connected");
});
