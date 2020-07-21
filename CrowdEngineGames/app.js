var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http, {
    pingInterval: 10000,
    pingTimeout: 5000,
});
var port = process.env.PORT || 2000;

var usernames = [];
var SOCKET_LIST = {};

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.get('/bldo', function (req, res) {
    res.sendFile(__dirname + '/bldo/expandGame.html');
});

http.listen(port, function () {
    console.log('listening on *:' + port);
});

setInterval(function () {
    var pack = [];
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        //socket.x++;
        //socket.y++;
        pack.push({
            x: socket.x,
            y: socket.y,
            id: socket.username
        });
    }
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('playerUpdate', pack);
    }
}, 1000 / 25);


io.on('connection', (socket) => {
    socket.id = Math.random();
    socket.username = ('Guest ' + Math.round(Math.random() * 1000));
    usernames.push(socket.username);
    SOCKET_LIST[socket.id] = socket;
    socket.x = Math.round(Math.random() * 100);
    socket.y = Math.round(Math.random() * 100);
    console.log(socket.username+' :connected');

    for (var i in usernames) {
        console.log('User name: ' + i + ' ' + usernames[i]);
        //  console.log(usernames.indexOf('Guest 1'));
    }
    socket.on('keyPress', function (chatroom, msg) {

        msg = socket.username + ': ' + msg;
        for (var i in SOCKET_LIST) {
            var socketed = SOCKET_LIST[i];
            socketed.emit('chat message', chatroom, msg);
        }
    });

    socket.on('disconnect', function () {
        console.log(socket.username + ' :disconnected');
        var olduser = socket.username;
        usernames.splice(usernames.indexOf(socket.username), 1);
        delete SOCKET_LIST[socket.id];
        for (var i in SOCKET_LIST) {
            var socketed = SOCKET_LIST[i];
            socketed.emit('chat message', 1, 'Username: ' + olduser + ' has disconnected.');
            socketed.emit('connectedusers', usernames.length);
        }
        socket.disconnect();
    });
    
    socket.on('changeUsername', function (chatroom,data) {
            if (usernames.indexOf(data) != -1) {
                socket.emit('chat message', chatroom, 'Username: ' + data + ' is taken.');
            } else {
                for (var i in SOCKET_LIST) {
                    var socketed = SOCKET_LIST[i];
                    socketed.emit('chat message', chatroom, socket.username + ' Changed their name to: ' + data);
                }
                usernames.splice(usernames.indexOf(socket.username), 1);
                socket.username = data; // adds username to the socket
                usernames.push(socket.username);
                socket.emit('usernameSet', socket.username);
            }
    });

    socket.on('chat message', function (chatroom, msg) {
    
        msg = socket.username + ': ' + msg;
        for (var i in SOCKET_LIST) {
            var socketed = SOCKET_LIST[i];
            socketed.emit('chat message', chatroom, msg);
        }
    });

});
