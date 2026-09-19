const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const User = require('../models/User');

const socketHandler = (io)=>{
  io.use(async (socket, next)=>{
    try{
      const token = socket.handshake.auth.token;
      if (!token){
        return next(new Error('Authentication error'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found'));
      }
      socket.user = user;
      next();
    } catch (err){
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket)=>{
    await User.findByIdAndUpdate(socket.user._id, { isOnline: true });
    io.emit('user_status_change', { userId: socket.user._id, isOnline: true });

    socket.on('join_room', (room)=>{
      socket.join(room);
    });

    socket.on('send_message', async (data)=>{
      const { room, content } = data;
      
      if (!content || !content.trim()) return;

      const message = await Message.create({
        room: room || 'global',
        sender: socket.user._id,
        content: content.trim()
      });

      const populatedMessage = await Message.findById(message._id).populate('sender', 'username avatar');

      if (room && room !== 'global'){
        io.to(room).emit('receive_message', populatedMessage);
      } else {
        io.emit('receive_message', populatedMessage);
      }
    });

    socket.on('disconnect', async ()=>{
      await User.findByIdAndUpdate(socket.user._id, { isOnline: false });
      io.emit('user_status_change', { userId: socket.user._id, isOnline: false });
    });
  });
};

module.exports = socketHandler;
