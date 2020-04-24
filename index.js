const http = require('http');
const express = require('./node_modules/express');
const socketio = require('./node_modules/socket.io/lib');
const logger = require('./logger');

const PORT = process.env.PORT || 5000;

const router = require('./router.js');
const { addUser, removeUser, getUser } = require('./users.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);


app.use(router);

io.on('connection', (socket) => {
    let timer;
    const inactivityTimeout = 60000 * 15;
    let disconnectReason = "logged out";

    socket.on('join', ({ name }) => {
        const { error, user } = addUser({ id: socket.id, name });

        if (error) {
            socket.emit('problem', { error });

            disconnectReason = error;

            logger.error({
                description: 'Unavailable username', reason: disconnectReason, socketID: socket.id, username: name,
            });

            return socket.disconnect(true);
        }

        logger.info({
            description: 'User joined chat', socketID: socket.id, name
        });

        socket.emit('message', { user: 'admin', text: `${user.name}, Welcome!` });

        socket.broadcast.emit('message', { user: 'admin', text: `${user.name}, has joined!` });


        timer = setTimeout(() => {
            disconnectReason = 'Disconnected due to inactivity';
            socket.emit('message', { user: 'admin', text: `${user.name} ${disconnectReason}` });
            socket.emit('problem', { error: disconnectReason });

            logger.info({
                description: 'User disconnected', reason: disconnectReason, socketID: socket.id, username: name,
            });

            socket.disconnect(true);
        }, inactivityTimeout);


    });

    socket.on('sentMessage', (message) => {
        const user = getUser(socket.id);
        io.emit('message', { user: user.name, text: message });

        clearTimeout(timer);

        timer = setTimeout(() => {
            disconnectReason = 'Disconnected due to inactivity';

            socket.emit('message', { user: 'admin', text: `${user.name} ${disconnectReason}` });
            socket.emit('problem', { error: disconnectReason });

            socket.disconnect(true);
        }, inactivityTimeout);

    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (disconnectReason === "logged out") {
            logger.info({
                description: 'User disconnected', reason: disconnectReason, socketID: socket.id,
            });
        }

        if (user) io.emit('message', { user: 'admin', text: `${user.name} left the chat` });
    });
});


server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));