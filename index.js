const express = require('express')
const app = express()
const server = require('http').Server(app) // socket.io
const io = require('socket.io')(server) // socket.io

const { v4: uuidv4 } = require('uuid')

app.set('view engine', 'ejs')

app.use(express.static('public')) // will server as a static file

app.get('/', (req, res) => {
    res.redirect(`/${uuidv4()}`)
})

app.get('/:roomId', (req, res) => {
    res.render('main', { roomId: req.params.roomId }) // redirect to main.ejs file
})






io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        })
    })
})

server.listen(3000);