require("dotenv").config();
const port = process.env.PORT || 4000;

const http = require("http");
const express = require("express");
const cors = require("cors");

const { Server } = require("socket.io");

const user = require("./routes/usersRoute");
const conversation = require("./routes/conversationRoute");
const avatar = require("./routes/avatarsRoute");

const {
  handleUserMessage,
  sendMessageToOpenAI,
} = require("./controllers/messageController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

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

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

server.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

module.exports = app;
