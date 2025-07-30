"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://879e84f8c67c.ngrok-free.app",
        "*"
    ],
    methods: ["GET", "POST"],
    credentials: true,
};
const io = new socket_io_1.Server(8000, {
    cors: corsOptions
});
const emailToSocketMap = new Map();
const socketToEmailMap = new Map();
const socketToRoomMap = new Map();
io.on("connection", (socket) => {
    socket.on("join-room", (data) => {
        const { email, room } = data;
        // Store mappings
        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);
        socketToRoomMap.set(socket.id, room);
        // Get all users currently in the room (before this user joins)
        const existingUsers = Array.from(io.sockets.adapter.rooms.get(room) || []);
        // Join the room
        socket.join(room);
        // Notify existing users about the new user
        socket.to(room).emit("user-joined", { email, id: socket.id });
        // Send current room users to the newly joined user
        const roomUsers = existingUsers.map(socketId => ({
            email: socketToEmailMap.get(socketId),
            id: socketId
        })).filter(user => user.email); // Filter out any undefined emails
        // Confirm room join to the user
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
