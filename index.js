const http = require('http');
const express = require('./node_modules/express');
const socketio = require('./node_modules/socket.io/lib');

const PORT = process.env.PORT || 5000;

const router = require('./router.js');
const { addUser, removeUser, getUser } = require('./users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(router);

io.on('connection', (socket) => {
    let timer;

    socket.on('join', ({ name }, callback) => {
        const { error, user } = addUser({ id: socket.id, name });

        if (error) {
            socket.emit('problem', { error: 'Username already taken' });
            return socket.disconnect(true);
        }

        socket.emit('message', { user: 'admin', text: `${user.name}, Welcome!` });

        socket.broadcast.emit('message', { user: 'admin', text: `${user.name}, has joined!` });


        timer = setTimeout(() => {
            socket.emit('message', { user: 'admin', text: `${user.name} logged of due to inactivity` });
            socket.emit('problem', { error: 'Logged of due to inactivity' });
            socket.disconnect(true);
        }, 60000 * 15);

        callback();
    });

    socket.on('sentMessage', (message, callback) => {
        const user = getUser(socket.id);
        io.emit('message', { user: user.name, text: message });

        clearTimeout(timer);

        timer = setTimeout(() => {
            socket.emit('message', { user: 'admin', text: `${user.name} logged of due to inactivity` });
            socket.emit('problem', { error: 'Logged of due to inactivity' });
            socket.disconnect(true);
        }, 60000 * 15);

        callback();
    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);
        console.log('user disconnected!');
        if (user) io.emit('message', { user: user.name, text: `${user.name} left the chat` });
    });
});


server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));