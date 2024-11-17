const { instrument } = require('@socket.io/admin-ui');
const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors')

const PORT = process.env.PORT || 3000
const expressServer = app.listen(PORT)
const { Server } = require('socket.io');

const io = new Server(expressServer, {
    cors: {
        origin: ["https://dddraw.vercel.app/", "https://admin.socket.io", "https://draw.brhm.me" , "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
})

app.use(cors(
    {
        origin: ["https://dddraw.vercel.app/", "https://admin.socket.io", "https://draw.brhm.me", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
))

const rooms = {}  // {roomID: {socketID: username}}

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
    })
    // send drawing data to all clients in the same room
    socket.on('send-draw', (roomID, data) => {
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

    socket.on('leave-room', (roomID) => {
        socket.leave(roomID)
        if (rooms[roomID] !== undefined) {
            delete rooms[roomID][socket.id]
            socket.to(roomID).emit('all-users', rooms[roomID])
        }
    })

    socket.on('disconnect', () => {
        for (const roomID in rooms) {
            if (rooms[roomID][socket.id] !== undefined) {
                delete rooms[roomID][socket.id]
                socket.to(roomID).emit('all-users', rooms[roomID])
            }
        }
        socket.disconnect()
    })
});

instrument(io, {
    auth: false,
});
