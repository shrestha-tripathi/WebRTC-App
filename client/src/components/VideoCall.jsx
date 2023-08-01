import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { CopyToClipboard } from "react-copy-to-clipboard";
import calls from "../assets/calls.png";
import calle from "../assets/calle.png";
import copy from "../assets/copy.png";
import { toast } from 'react-toastify';

const VideoCall = ({ socket, whoami }) => {

    const [stream, setStream] = useState(null);
    // const [remoteStream, setRemoteStream] = useState(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState("");
    const [name, setName] = useState("");
    const [callerSignal, setCallerSignal] = useState(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(true);
    const [ idToCall, setIdToCall ] = useState("")

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();

    useEffect(() => {
        navigator?.mediaDevices?.getUserMedia && navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
            setStream(stream);
            setTimeout(() => {
                myVideo.current.srcObject = stream;
            },0);
        });

        socket.on("callUser", (data) => {
            setReceivingCall(true);
            setCaller(data.from);
            setName(data.name || data.socketId);
            setCallerSignal(data.signal);
        });

        socket.on("callEnded", () => {
            setReceivingCall(false);
            setCaller("");
            setName("");
            setCallerSignal(null);
            setCallAccepted(false);
            setCallEnded(true);
            userVideo.current.srcObject = stream;
            toast("Other user ended the call!");
        });

    }, []);

    const callUser = (id) => {
        toast("Calling the user " + id);
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            console.log("peer signal");
            socket.emit("callUser", {
                userToCall: id,
                signalData: data,
                from: whoami,
                name: name,
            });
        });


        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });

        socket.on("callAccepted", (signal) => {
            console.log("call accepted");
            setCallAccepted(true);
            setCallEnded(false);
            peer.signal(signal);
        });

        connectionRef.current = peer;

    }

    const answerCall = () => {
        setCallAccepted(true);
        setCallEnded(false);
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream,
        });

        peer.on("signal", (data) => {
            socket.emit("answerCall", {signal: data, to: caller })
        });

        peer.on("stream", (stream) => {
            userVideo.current.srcObject = stream;
        });

        peer.signal(callerSignal);
        connectionRef.current = peer;
    }


    const leaveCall = () => {
        setCallEnded(true);
        setCallAccepted(false);
        setReceivingCall(false);
        connectionRef.current.destroy();
        userVideo.current.srcObject = null;
        socket.emit("callEnded");
    }

    return (
        <div className="w-full h-full flex gap-5">
        <section className="">
            <h1 className="text-[26px]">1 on 1 Video Call</h1>
            <div className="container">
                <div className="video-container">
                    <div className="video border-2 border-orange-500">
                        {stream && <video playsInline muted ref={myVideo} autoPlay style={{ width: "350px" }} />}
                    </div>
                </div>
                    <div className="whoami">
                        <div className="w-full mt-4">
                        <label>Name: &nbsp;</label>
                        <input type="text"
                            className="px-2"
                            label="name"
                            onChange={(e) => setName(e.target.value)}
                        />
                        </div>
                        <div className="w-full mt-4 flex flex-row">
                            <div>User ID: </div>
                            <span className="px-2">{whoami}</span>
                        </div>
                        <div className="w-full mt-4 flex flex-row">
                        <CopyToClipboard text={whoami} style={{ marginBottom: "2rem" }}>
                            <button onClick={() => toast("Copied the User ID!")} color="primary" className="bg-blue-500 px-4 rounded-2xl flex">
                                Copy ID
                                <img className="h-5 w-5 pt-1 pl-1" src={copy} alt={"copyId"} />
                            </button>
                        </CopyToClipboard>
                        </div>
                        <div className="w-full -mt-2">
                        <label>ID to Call: &nbsp;</label>
                        <input type="text"
                            className="px-2"
                            label="idToCall"
                            onChange={(e) => setIdToCall(e.target.value)} 
                        />
                        </div>

                        <div className="call-button mt-3">
                            {callAccepted && !callEnded ? (
                                <img src={calle} alt={"EndCall"} className="h-10 w-10 cursor-pointer" onClick={leaveCall}>
                                </img>
                            ) : (
                                <img src={calls} alt={"MakeCall"} className="h-10 w-10 cursor-pointer" onClick={() => callUser(idToCall)}>
                                </img>
                            )}
                            <div className="py-4">{idToCall}</div>
                            
                        </div>
                    </div>
                    <div>
                        {receivingCall && !callAccepted ? (
                            <div className="caller">
                                <h1 >{name} is calling...</h1>
                                <button className="bg-green-400 px-4 rounded-2xl" color="primary" onClick={answerCall}>
                                    Answer
                                </button>
                            </div>
                        ) : null}
                    </div>
            </div>
        </section>
        <div className="mt-10 flex-1 w-full h-full">
        <section className="">
                <div className="video w-full h-full">
                    <video className="border-2 border-green-500" playsInline ref={userVideo} autoPlay style={{ width: "850px" }} />
                </div>
        </section>
        </div>
        </div>
    )
}

export default VideoCall;