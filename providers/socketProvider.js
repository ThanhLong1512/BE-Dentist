const { Server } = require("socket.io");

let io = null;

const initSocketServer = (port = 8090) => {
  if (io) return io;

  io = new Server(port, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  });

  const users = [];

  const addUser = (userID, socketID, meta = {}) => {
    const existing = users.find(user => user.userID === userID);
    if (existing) {
      existing.socketID = socketID;
      existing.meta = { ...existing.meta, ...meta };
      return;
    }
    users.push({ userID, socketID, meta });
  };

  const removeUser = socketID => {
    const index = users.findIndex(user => user.socketID === socketID);
    if (index >= 0) users.splice(index, 1);
  };

  const getUser = userID => users.find(user => user.userID === userID);

  io.on("connection", socket => {
    console.log("Socket connected:", socket.id);

    socket.on("addUser", payload => {
      const userID = typeof payload === "string" ? payload : payload?.userID;
      const meta = typeof payload === "object" ? payload : {};
      if (!userID) return;

      addUser(userID, socket.id, meta);
      socket.join(`user:${userID}`);

      if (meta.role === "admin" || meta.role === "reception") {
        socket.join("dashboard:staff");
      }
      if (meta.role === "doctor" && meta.doctorId) {
        socket.join(`dashboard:doctor:${meta.doctorId}`);
      }

      io.emit("getUsers", users);
    });

    socket.on("joinDashboard", meta => {
      socket.join("dashboard:staff");
      if (meta?.doctorId) {
        socket.join(`dashboard:doctor:${meta.doctorId}`);
      }
    });

    socket.on("sendMessage", ({ senderID, receiverID, text }) => {
      const user = getUser(receiverID);
      if (user) {
        io.to(user.socketID).emit("getMessage", { senderID, text });
      }
    });

    socket.on("disconnect", () => {
      removeUser(socket.id);
      io.emit("getUsers", users);
    });
  });

  console.log(`Socket.IO running on port ${port}`);
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocketServer() first.");
  }
  return io;
};

const emitAppointmentUpdated = appointment => {
  if (!io) return;
  io.to("dashboard:staff").emit("appointment:updated", appointment);

  const doctorId = appointment?.shift?.employee?._id;
  if (doctorId) {
    io.to(`dashboard:doctor:${doctorId}`).emit("appointment:updated", appointment);
  }

  const accountId = appointment?.patient?.account?._id || appointment?.patient?.account;
  if (accountId) {
    io.to(`user:${accountId}`).emit("appointment:updated", appointment);
  }
};

const emitNotification = ({ userId, title, message, type, appointmentId }) => {
  if (!io) return;

  const payload = { title, message, type, appointmentId, at: new Date().toISOString() };

  io.to("dashboard:staff").emit("notification:push", payload);

  if (userId) {
    io.to(`user:${userId}`).emit("notification:push", payload);
  }
};

module.exports = {
  initSocketServer,
  getIO,
  emitAppointmentUpdated,
  emitNotification
};
