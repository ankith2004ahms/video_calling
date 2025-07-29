import { useState,useCallback ,useEffect} from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

export default function Lobby(){
    const [email,SetEmail] = useState("");
    const [room,SetRoom] = useState("");
    const socket = useSocket();
    const navigate = useNavigate();

    const handleSubmit = useCallback((e:React.FormEvent<HTMLFormElement>)=>{
        e.preventDefault();
        socket?.emit("join-room",{email,room});
        console.log(email,room);
    }, [email, room, socket]);

    const handleJoinRoom = useCallback((data: any) => {
        const { email, room } = data;
        SetEmail(email);
        SetRoom(room);
        navigate(`/room?room=${room}`);
    },[SetEmail,SetRoom,navigate]);

    useEffect(()=>{
        if(socket){
            socket.on("joined-room",handleJoinRoom);
            return ()=>{
                socket.off("joined-room",handleJoinRoom);
            }
        }
    },[socket]);

    return (
        <div>
            <h1>Lobby</h1>
            <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email Id</label>
                <input type="text" id="email" value={email} onChange={(e)=>SetEmail(e.target.value)} placeholder="Enter your email id" />
                <br />
                <label htmlFor="room">Room Number</label>
                <input type="text" id="room" value={room} onChange={(e)=>SetRoom(e.target.value)} placeholder="Enter your room number" />
                <br />
                <button type="submit">Join</button>
            </form>
        </div>
    )
}