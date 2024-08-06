require("dotenv").config();
const port = process.env.PORT || 4000;

const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const { Server } = require("socket.io");

const user = require("./routes/usersRoute");
const conversation = require("./routes/conversationRoute");
const avatar = require("./routes/avatarsRoute");
const payment = require("./routes/paymentRoute");
const webhook = require("./routes/webhookRoute");
const { handleUserMessage } = require("./controllers/messageController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());

// Serve static files from /tmp directory
app.use('/tmp', express.static('/tmp'));

// Webhook APIs (keeping at the top to receive raw req.body)
app.use("/api/webhook", express.raw({ type: "application/json" }), webhook);

app.use(express.json());

// WebSocket setup
io.on("connection", (socket) => {
  // WebRTC signaling
  socket.on("offer", (data) => {
    socket.broadcast.emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.broadcast.emit("answer", data);
  });

  socket.on("candidate", (data) => {
    socket.broadcast.emit("candidate", data);
  });

  // Chat handling
  socket.on("message", async (data) => {
    await handleUserMessage(socket, data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.use("/api/users", user);
app.use("/api/conversation", conversation);
app.use("/api/avatar", avatar);
app.use("/api/payments", payment);

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

module.exports = app;
