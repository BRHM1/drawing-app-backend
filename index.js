const { instrument } = require('@socket.io/admin-ui');
const express = require('express');
const app = express();
require('dotenv').config()

const expressServer = app.listen(3000)
const { Server } = require('socket.io');

const io = new Server(expressServer, {
    cors: {
        origin: ["https://dddraw.vercel.app/", "https://admin.socket.io"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

const rooms = {}

io.on('connection', socket => {
    socket.on('join-room', (roomID, username) => {
        if (rooms[roomID] === undefined) rooms[roomID] = {}
        if (Object.keys(rooms[roomID]).length > 4) return

        rooms[roomID][socket.id] = username
        socket.join(roomID)
        // send all users in the room the new user
        socket.to(roomID).emit('all-users', rooms[roomID])
        // send the recently joined user the list of all users in the room
        socket.emit('all-users', rooms[roomID])

        console.log("User " + socket.id + " joined room " + roomID)
    })
    // send drawing data to all clients in the same room
    socket.on('send-draw', (roomID, data) => {
        console.log(roomID)
        socket.to(roomID).emit('receive-draw', data)
    })

    socket.on('delete-element', (roomID, id) => {
        socket.to(roomID).emit('handle-delete', id)
    }
    )

    socket.on('send-cursor', (roomID, data, sender) => {
        socket.to(roomID).emit('receive-cursor', data, sender)
    })

    socket.on('lock-element', (id, roomID) => {
        socket.to(roomID).emit('update-locked-elements', id, true)
    })

    socket.on('unlock-element', (id, roomID) => {
        socket.to(roomID).emit('update-locked-elements', id, false)
    })
});

instrument(io, {
    auth: false,
});
