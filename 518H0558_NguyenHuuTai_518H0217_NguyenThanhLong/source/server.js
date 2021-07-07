const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const moment = require('moment');
const formatMessage = require('./users/messages');
const formatOldMessage = require('./users/store_mess');


const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./users/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'views')));

const botName = 'Room';

//Connect to mongoDB
const Mess = require('./models/mess')
const mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/websocket', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}, (err, db) => {
  if (err) {
    throw err;
  }
  console.log("connect MongooseDB sucessful");
  io.on('connection', socket => {
    socket.on('joinRoom', async ({ username, room }) => {
      const user = userJoin(socket.id, username, room);

      socket.join(user.room);

      //Load existing message in room
      try {
        let message = await Mess.find();
        message.forEach(mess => {
          if (mess.room == user.room) {
            socket.emit("loadMessage", formatOldMessage(mess.user, mess.content, mess.time));
          }
        })

        console.log(message);
      } catch (err) {
        console.log(err);
      }


      // Welcome current user
      socket.emit('message', formatMessage(botName, `Welcome to ${user.room}!`));

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          'message',
          formatMessage(botName, `${user.username} has joined the chat`)
        );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    });

    // Listen for chatMessage
    socket.on('chatMessage', async msg => {
      const user = getCurrentUser(socket.id);

      const mess = new Mess({
        user: user.username,
        time: moment().format('h:mm a'),
        content: msg,
        room: user.room,
      });
      try {
        const newMess = await mess.save()
        console.log("mess: ", newMess)
      } catch (e) {
        console.log(e)
      }

      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // Runs when client disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);

      if (user) {
        io.to(user.room).emit(
          'message',
          formatMessage(botName, `${user.username} has left the chat`)
        );

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
          room: user.room,
          users: getRoomUsers(user.room)
        });
      }
    });
  });


});


// Run when client connects




const port = process.env.PORT || 8080;

server.listen(port, () => console.log(`Server running on http://localhost:${port}`));
