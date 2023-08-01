import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import VideoCall from "./components/VideoCall";
import VideoConference from "./components/VideoConference";
import About from "./components/About";
import { io } from "socket.io-client";
import { useEffect, useState } from "react";
import { ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

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
              <Route index element={<Navigate to="/videocall" />} />
              <Route path="/videocall" element={<VideoCall socket={socket} whoami={whoami} />} />
              <Route path="/videoconference" element={<VideoConference socket={socket} whoami={whoami} />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" 
      />
    </div>
  )
}

export default App
