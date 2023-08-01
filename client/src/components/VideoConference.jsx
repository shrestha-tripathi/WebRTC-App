import React, { useEffect, useRef, useState } from "react";
// import io from "socket.io-client";
import Peer from "simple-peer";
import { toast } from 'react-toastify';

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <video className="h-[300px] w-[350px] border-2 border-green-500" playsInline autoPlay ref={ref} />
    );
}

const VideoConference = ({ socket, whoami }) => {
    const [peers, setPeers] = useState([]);
    const userVideo = useRef();
    const peersRef = useRef([]);
    const [roomID, setRoomID] = useState('');
    const [joinedRoom, setJoinedRoom] = useState("");

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
            userVideo.current.srcObject = stream;
            // socket.emit("join room", roomID);
            socket.on("all users", ({users, joinedRoom}) => {
                const peers = [];
                users.forEach(userID => {
                    const peer = createPeer(userID, socket.id, stream);
                    peersRef.current.push({
                        peerID: userID,
                        peer,
                    })
                    peers.push(peer);
                })
                setPeers(peers);
                setJoinedRoom(joinedRoom);
                toast("You joined the Room!");
            });

            socket.on("room full", () => {
                toast("Sorry, Room Full!");
            });

            socket.on("user joined", payload => {
                const peer = addPeer(payload.signal, payload.callerID, stream);
                peersRef.current.push({
                    peerID: payload.callerID,
                    peer,
                })

                setPeers(users => [...users, peer]);
                payload.callerID !== socket.id && toast(`User with ID: ${payload.callerID} entered the room`);
                payload.callerID === socket.id && toast("You joined the Room!");
            });

            socket.on("receiving returned signal", payload => {
                const item = peersRef.current.find(p => p.peerID === payload.id);
                item.peer.signal(payload.signal);
            });

            socket.on('user disconnected', (otherUserId) => {
                // When a user disconnects, remove their peer connection
                peersRef.current.forEach(peer => {
                    if (peer.peerID === otherUserId) {
                        peer.peer.destroy();
                    }
                });
                let connectedPeers = peersRef.current.filter(peer => peer.peerID !== otherUserId);
                setPeers([...connectedPeers]);
                socket.id === otherUserId && toast("You left the Room!");
                socket.id !== otherUserId && toast(`User with ID: ${otherUserId} ${whoami} left the room`);
            });
        })
    }, []);

    function createPeer(userToSignal, callerID, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.emit("sending signal", { userToSignal, callerID, signal })
        })

        return peer;
    }

    function addPeer(incomingSignal, callerID, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socket.emit("returning signal", { signal, callerID })
        })

        peer.signal(incomingSignal);

        return peer;
    }

    const joinRoom = () => {
        // const roomName = prompt('Enter room name:');
        if (roomID) {
            socket.emit('join room', roomID);
        }
    };

    const exitRoom = () => {
        socket.emit("exit room", roomID);
        peersRef.current.forEach(peer => {
            peer.peer.destroy();
        });
        peersRef.current = [];
        setPeers([]);
        setRoomID("");
        setJoinedRoom("");
        
    }

    return (
        <div className="w-full h-full flex gap-5">
            <section className="">
                <h1 className="text-[26px]">Video Conferencing</h1>
                <div className="container">
                    <div className="video-container">
                        <div className="video border-2 border-orange-500">
                            {userVideo && <video playsInline muted ref={userVideo} autoPlay style={{ width: "350px" }} />}
                        </div>
                    </div>
                    <div className="whoami">
                        <div className="w-full mt-4 flex flex-row">
                            <div>User ID: </div>
                            <span className="px-2">{whoami}</span>
                        </div>
                        <div className="w-full mt-2">
                            <label>Room to Enter: &nbsp;</label>
                            <input type="text"
                                value={roomID}
                                className="px-2"
                                label="idToCall"
                                onChange={(e) => setRoomID(e.target.value)}
                            />
                        </div>

                        {joinedRoom && <div className="w-full mt-2">
                            <label>Entered Room: &nbsp;</label>
                            <span>{roomID}</span>
                        </div>
                        }

                        {!joinedRoom ? 
                        <div className="call-button mt-3 gap-4">
                            {/* <button className="h-15 w-15 cursor-pointer px-5" onClick={createRoom}>Create Room</button> */}
                            <button className="h-15 w-15 cursor-pointer mt-4 px-4 bg-blue-500 rounded-full" onClick={joinRoom}>Join Room</button>
                        </div>
                        :
                        <div>
                            <button className="h-15 w-15 cursor-pointer mt-4 px-4 bg-red-500 rounded-full" onClick={exitRoom}>Exit Room</button>
                        </div>
                        }   
                    </div>
                </div>
            </section>
            <div className="mt-10 flex-1 w-full h-full">
                <section className="">
                    <div className="video w-full h-full w-[63rem] h-[40rem] border-2 border-white">
                        {peers?.length ? 
                        <div className="flex flex-row flex-wrap">
                            {peers.map((peer, index) => {
                                return (
                                    <Video key={index} peer={peer} />
                                );
                            })}
                        </div> 
                        : 
                        <div className="mt-20 text-[32px] text-center">{`${joinedRoom ? "Waiting for others to join..." : "Waiting to join the room..."}`}</div>
                        }
                    </div>
                </section>
            </div>
        </div>
    );
};

export default VideoConference;
