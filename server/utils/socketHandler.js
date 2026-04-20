const Message = require('../models/Message');
const Notification = require('../models/Notification');

const connectedUsers = {};
let ioInstance = null;

const socketHandler = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('user-online', (userId) => {
            connectedUsers[userId] = socket.id;
            socket.userId = userId;
            console.log(`User ${userId} is online`);
            io.emit('online-users', Object.keys(connectedUsers));
        });

        socket.on('join-room', (roomId) => {
            socket.join(roomId);
        });

        socket.on('leave-room', (roomId) => {
            socket.leave(roomId);
        });

        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, senderId, senderName, senderRole } = data;
                const message = await Message.create({ roomId, sender: senderId, content });
                await message.populate('sender', 'name avatar role');
                io.to(roomId).emit('receive-message', {
                    _id: message._id,
                    roomId,
                    content,
                    sender: { _id: senderId, name: senderName, role: senderRole },
                    createdAt: message.createdAt,
                });
            } catch (error) {
                console.error('Message error:', error);
                socket.emit('message-error', { message: 'Failed to send message' });
            }
        });

        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user-typing', { userId: data.userId, name: data.name });
        });

        socket.on('stop-typing', (data) => {
            socket.to(data.roomId).emit('user-stop-typing', { userId: data.userId });
        });

        socket.on('disconnect', () => {
            if (socket.userId) {
                delete connectedUsers[socket.userId];
                io.emit('online-users', Object.keys(connectedUsers));
                console.log(`User ${socket.userId} went offline`);
            }
        });
    });
};

// Send notification to a specific user — called from controllers
const sendNotificationToUser = async (recipientId, { title, message, type, relatedListing }) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            title,
            message,
            type,
            relatedListing,
        });

        if (ioInstance && connectedUsers[recipientId.toString()]) {
            ioInstance
                .to(connectedUsers[recipientId.toString()])
                .emit('new-notification', notification);
        }

        return notification;
    } catch (err) {
        console.error('sendNotificationToUser error:', err.message);
    }
};

// Broadcast new listing to all connected users
const broadcastNewListing = (listingData) => {
    if (ioInstance) {
        ioInstance.emit('listing-available', listingData);
    }
};

// Notify specific users about pickup status change
const notifyPickupUpdate = (userIds, payload) => {
    if (!ioInstance) return;
    userIds.forEach(userId => {
        if (userId && connectedUsers[userId.toString()]) {
            ioInstance
                .to(connectedUsers[userId.toString()])
                .emit('pickup-updated', payload);
        }
    });
};

module.exports = {
    socketHandler,
    connectedUsers,
    sendNotificationToUser,
    broadcastNewListing,
    notifyPickupUpdate,
};