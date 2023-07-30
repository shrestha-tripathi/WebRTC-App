import { BrowserRouter, Route, Routes} from "react-router-dom";
import Navbar from "./components/Navbar";
import VideoCall from "./components/VideoCall";
import VideoConference from "./components/VideoConference";
import About from "./components/About";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const socket = io("http://192.168.230.129:5000");

const App = () => {
  const [whoami, setWhoami] = useState("");

  useEffect(() => {
    socket.on("whoami", (id) => {
      setWhoami(id);
    });
  }, []);

  return (
    <div>
    <BrowserRouter>
      <div className="relative z-0 bg-primary">
        <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center bg-red-300"> 
          <Navbar />
        </div>
        <div className="fixed top-20 ms-8 overflow-y-scroll">
        <Routes>
          <Route path="/" element={<VideoCall socket={socket} whoami={whoami} />}/>
          <Route path="/videocall" element={<VideoCall socket={socket} whoami={whoami} />}/>
          <Route path="/videoconference" element={<VideoConference socket={socket} />}/>
          <Route path="/about" element={<About />}/>
        </Routes>
        </div>
      </div>
    </BrowserRouter>
    </div>
  )
}

export default App
