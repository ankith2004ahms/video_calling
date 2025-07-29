import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./screens/Lobby";
import { SocketProvider } from "./context/SocketProvider";
import RoomPage from "./screens/Room";

export default function App(){
  return(
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Lobby />} />  
          <Route path="/room" element={<RoomPage />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}