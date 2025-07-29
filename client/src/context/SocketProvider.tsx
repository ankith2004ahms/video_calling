import { createContext, useContext, useMemo } from "react";
import { io, Socket } from "socket.io-client";

const SocketContext = createContext<Socket | null>(null);

export const useSocket = ()=>{
    const socket = useContext(SocketContext);
    return socket;
}
export const SocketProvider = ({children}:{children:React.ReactNode})=>{
    const socket = useMemo(()=>{
        const newSocket = io("http://localhost:8000");
        return newSocket;
    },[])

    return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

