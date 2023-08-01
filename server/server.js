const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Store rooms and their participants
const users = {};

const socketToRoom = {};

const videoToCall = {};

const invertObject = (obj) => {
    const invertedObject = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            invertedObject[value] = key;
        }
    }
    return invertedObject;
}


io.on("connection", (socket) => {

    console.log("client connected whose id is", socket.id);

    // 1 on 1 implementation
    socket.emit("whoami", socket.id);


    socket.on("callUser", (data) => {
        io.to(data.userToCall).emit("callUser", { signal: data.signalData, from: data.from, name: data.name, socketId: socket.id });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
        videoToCall[data.to] = socket.id;
    });

    // Group call implementation
    // Handle creating a new room
    socket.on("join room", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 5) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
        socket.join(roomID);

        socket.emit("all users", {users: usersInThisRoom, joinedRoom: roomID});
    });

    socket.on("sending signal", payload => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returning signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });

    socket.on('disconnect', () => {
        let initiators = videoToCall;
        let receivers = invertObject(videoToCall);
        io.to(initiators[socket.id] || receivers[socket.id]).emit("callEnded");
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        io.to(roomID).emit("user disconnected", socket.id);
    });

    socket.on('exit room', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
        io.to(roomID).emit("user disconnected", socket.id);
    });

    socket.on("callEnded", () => {
        let initiators = videoToCall;
        let receivers = invertObject(videoToCall);
        io.to(initiators[socket.id] || receivers[socket.id]).emit("callEnded");
    });

});


server.listen(PORT, "0.0.0.0", () => console.log("Server started on port 5000 ..."));