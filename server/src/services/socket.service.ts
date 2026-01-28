import { Server } from "socket.io";

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Initialized SocketService...");

    this._io = new Server({
      cors: { origin: "*", allowedHeaders: ["*"] },
    });
  }

  public initListeners() {
    const emailToSocketIdMap = new Map();
    const socketidToEmailMap = new Map();

    this._io.on("connection", (socket) => {
      // for dwaring
      socket.on("join-room", (slug) => {
        socket.join(slug);
      });

      socket.on("client-connect", ({ name, roomNumber }) => {
        console.log(`User ${name} connected to room ${roomNumber}`);
        socket.join(roomNumber);
        socket.to(roomNumber).emit("play-audio");

        emailToSocketIdMap.set(name, roomNumber);
        socketidToEmailMap.set(roomNumber, name);
        this._io.to(roomNumber).emit("user:joined", { name, id: socket.id });
        this._io.to(socket.id).emit("client-connect", { name, roomNumber });
      });

      socket.on("client-ready", (slug) => {
        if (slug) {
          socket.to(slug).emit("get-canvas-state");
        }
      });

      socket.on("canvas-state", (state, slug) => {
        if (slug) {
          socket.to(slug).emit("canvas-state-from-server", state);
        }
      });

      socket.on(
        "draw-line",
        ({ prevPoint, currentPoint, color, lineWidth, slug }) => {
          if (slug) {
            socket
              .to(slug)
              .emit("draw-line", { prevPoint, currentPoint, color, lineWidth });
          }
        },
      );

      socket.on("clear-canvas", (slug) => {
        // const roomNumber = socket.roomNumber;
        // if (slug) {
        this._io.to(slug).emit("clear-canvas");
        // }
      });

      // Handle client disconnect
      socket.on("disconnect", () => {
        const email = socketidToEmailMap.get(socket.id);
        console.log(`User ${email || socket.id} disconnected`);
        if (email) {
          emailToSocketIdMap.delete(email);
        }
        socketidToEmailMap.delete(socket.id);
      });

      // For WebRTC connection
      // socket.on("room:join", (data) => {
      //   const { email, room } = data;
      //   emailToSocketIdMap.set(email, socket.id);
      //   socketidToEmailMap.set(socket.id, email);
      //   io.to(room).emit("user:joined", { email, id: socket.id });
      //   socket.join(room);
      //   io.to(socket.id).emit("room:join", data);
      // });

      socket.on("user:call", ({ to, offer }) => {
        this._io.to(to).emit("incomming:call", { from: socket.id, offer });
      });

      socket.on("call:accepted", ({ to, ans }) => {
        this._io.to(to).emit("call:accepted", { from: socket.id, ans });
      });

      socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        this._io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
      });

      socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        this._io.to(to).emit("peer:nego:final", { from: socket.id, ans });
      });
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
