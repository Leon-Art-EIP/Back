// socketManager.mjs
import { Server as SocketServer } from 'socket.io';
import Message from '../models/messageModel.mjs';  // Assurez-vous que le chemin est correct

class SocketManager {
  constructor(server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.onlineUsers = new Map();
    this.init();
  }

  init() {
    this.io.on("connection", (socket) => {

      socket.on("add-user", (userId) => {
        this.onlineUsers.set(userId, socket.id);
      });

      socket.on("send-msg", (data) => {
        this.handleSendMessage(data);
      });

      socket.on("disconnect", () => {
        this.onlineUsers.forEach((value, key) => {
          if (value === socket.id) {
            this.onlineUsers.delete(key);
          }
        });
      });
    });
  }

  handleSendMessage(data) {
    const sendUserSocket = this.onlineUsers.get(data.to);
    if (sendUserSocket) {
      const message = new Message({
        senderId: data.from,
        content: data.msg,
        dateTime: new Date()
      });
      this.io.to(sendUserSocket).emit("msg-receive", message);
    }
  }

  handleRefreshOrders(userId) {
    const userIdStr = userId.toString();
    if (userIdStr) {
        const userSocket = this.onlineUsers.get(userIdStr);
        if (userSocket) {
            this.io.to(userSocket).emit("refresh-orders");
        }
    }
  }

  // Vous pouvez ajouter ici d'autres méthodes pour gérer les notifications ou autres événements
}

export default SocketManager;
