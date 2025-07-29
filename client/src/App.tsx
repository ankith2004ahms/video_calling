import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./pages/Lobby";
import { SocketProvider } from "./context/SocketProvider";
import RoomPage from "./pages/Room";
import Home from "./pages/Home";

export default function App(){
  return(
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join" element={<Lobby />} />  
          <Route path="/room" element={<RoomPage />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  )
}