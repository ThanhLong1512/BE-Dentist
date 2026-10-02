const io = require("socket.io")(8090, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true
  }
});

let users = [];

function extractUserId(val) {
  if (!val) return null;
  if (typeof val === "object") {
    return (val.userID || val._id || val.id || "")?.toString();
  }
  return val.toString();
}

function addUser(userID, socketID) {
  const uid = extractUserId(userID);
  if (!uid) return;
  const existingIndex = users.findIndex(u => u.userID === uid);
  if (existingIndex !== -1) {
    users[existingIndex].socketID = socketID;
  } else {
    users.push({ userID: uid, socketID });
  }
  console.log(`Socket user active: ${uid} -> ${socketID}. Total online: ${users.length}`);
}

function removeUser(socketID) {
  users = users.filter(user => user.socketID !== socketID);
  console.log(`Socket disconnected: ${socketID}. Remaining online: ${users.length}`);
}

function getUser(userID) {
  const uid = extractUserId(userID);
  if (!uid) return null;
  return users.find(user => user.userID === uid);
}

io.on("connection", socket => {
  console.log("New socket connected:", socket.id);

  socket.on("addUser", (userData) => {
    addUser(userData, socket.id);
    if (typeof userData === "object" && userData?.role === "admin") {
      socket.join("admin_room");
    }
    io.emit("getUsers", users);
  });

  socket.on("joinDashboard", (data) => {
    socket.join("admin_room");
    console.log(`Socket ${socket.id} joined admin_room`);
  });

  socket.on("sendMessage", (payload) => {
    const { senderID, receiverID, text, content, messageType = "text", mediaUrl = "", conservationID } = payload || {};
    const messageContent = text || content || "";
    const receiverUid = extractUserId(receiverID);
    const senderUid = extractUserId(senderID);

    console.log(`Socket routing: from ${senderUid} -> to ${receiverUid} | text: "${messageContent}" | conv: ${conservationID}`);

    const msgData = {
      senderID: senderUid,
      receiverID: receiverUid,
      text: messageContent,
      content: messageContent,
      messageType,
      mediaUrl,
      conservationID
    };

    // 1. Direct delivery to specific receiver
    const targetUser = getUser(receiverUid);
    if (targetUser && targetUser.socketID) {
      io.to(targetUser.socketID).emit("getMessage", msgData);
      console.log(`Delivered directly to socketID: ${targetUser.socketID}`);
    }

    // 2. If receiver is admin or target is clinic admin ID, also deliver to admin_room
    const defaultAdminId = process.env.ADMIN_ID || "69a7e435f4e1e2029d5830ca";
    if (receiverUid === defaultAdminId || receiverUid === "admin") {
      socket.to("admin_room").emit("getMessage", msgData);
      console.log(`Forwarded message to admin_room`);
    }
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});
