import { Server } from "socket.io";
import cors from "cors";

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://879e84f8c67c.ngrok-free.app",
        "https://20edd27da997.ngrok-free.app",
        "https://98af8a197059.ngrok-free.app",
        "*"
      ],
    methods: ["GET", "POST"],
    credentials: true,
}

const io = new Server(8000, {
    cors: corsOptions
});

const emailToSocketMap = new Map<string, string>();
const socketToEmailMap = new Map<string, string>();
const socketToRoomMap = new Map<string, string>();

io.on("connection", (socket) => {
    
    socket.on("join-room", (data) => {
        const { email, room } = data;
        
        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);
        socketToRoomMap.set(socket.id, room);
        
        const existingUsers = Array.from(io.sockets.adapter.rooms.get(room) || []);
        
        socket.join(room);
        
        socket.to(room).emit("user-joined", { email, id: socket.id });
        
        const roomUsers = existingUsers.map(socketId => ({
            email: socketToEmailMap.get(socketId),
            id: socketId
        })).filter(user => user.email);
        
        socket.emit("joined-room", { email, room, existingUsers: roomUsers });
        
    });
    
    socket.on("call-user", (data) => {
        const { offer, to } = data;
        const from = socketToEmailMap.get(socket.id);
        
        if (from) {
            io.to(to).emit("call-made", { offer, from: socket.id });
        }
    });
    
    socket.on("make-answer", (data) => {
        const { answer, to } = data;
        const from = socketToEmailMap.get(socket.id);
        
        if (from) {
            io.to(to).emit("answer-made", { answer, from: socket.id });
        }
    });
    
    socket.on("make-offer", (data) => {
        const { offer, to } = data;
        const from = socketToEmailMap.get(socket.id);
        
        if (from) {
            io.to(to).emit("offer-made", { offer, from: socket.id });
        }
    });
    
    socket.on("ice-candidate", (data) => {
        const { candidate, to } = data;
        const from = socketToEmailMap.get(socket.id);
        
        if (from) {
            io.to(to).emit("ice-candidate", { candidate, from: socket.id });
        }
    });
    
    socket.on("disconnect", () => {
        
        const email = socketToEmailMap.get(socket.id);
        const room = socketToRoomMap.get(socket.id);
        
        if (email && room) {
            socket.to(room).emit("user-left", { email, id: socket.id });
        }
        if (email) {
            emailToSocketMap.delete(email);
        }
        socketToEmailMap.delete(socket.id);
        socketToRoomMap.delete(socket.id);
    });
    socket.on("hang-up", (data) => {
        const { room } = data;
        const email = socketToEmailMap.get(socket.id);
        
        if (email && room) {
            socket.to(room).emit("user-hung-up", { email, id: socket.id });
        }
    });
    socket.on("send-message", (data) => {
        const { message, to } = data;
        const from = socketToEmailMap.get(socket.id);
        
        if (from) {
            io.to(to).emit("receive-message", { message, from: socket.id });
        }
    });
});