import { Server } from "socket.io";
import cors from "cors";

const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
}

const io = new Server(8000, {
    cors: corsOptions
});
const emailToSocketMap = new Map<string, string>();
const socketToEmailMap = new Map<string, string>();


io.on("connection", (socket) => {
    console.log("a user connected");
    socket.on("join-room", (data) => {
        const { email, room } = data;
        emailToSocketMap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);
        io.to(room).emit("user-joined", { email, id: socket.id });
        socket.join(room);
        io.to(socket.id).emit("joined-room", { email, room });
    });
    socket.on("call-user",(data)=>{
        const {offer,to} = data;
        const from = socketToEmailMap.get(socket.id);
        if(from){
            io.to(to).emit("call-made",{offer,from});
        }
    });
    socket.on("make-answer",(data)=>{
        const {answer,to} = data;
        const from = socketToEmailMap.get(socket.id);
        if(from){
            io.to(to).emit("answer-made",{answer,from});
        }
    });
    socket.on("make-offer",(data)=>{
        const {offer,to} = data;
        const from = socketToEmailMap.get(socket.id);
        if(from){
            io.to(to).emit("offer-made",{offer,from});
        }
    });
    socket.on("ice-candidate", (data) => {
        const { candidate, to } = data;
        io.to(to).emit("ice-candidate", { candidate });
    });
})
