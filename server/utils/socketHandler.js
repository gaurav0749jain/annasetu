const Message = require('../models/Message');
const Notification = require('../models/Notification');

const connectedUsers = {};

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Save user socket id when they login
        socket.on('user-online', (userId) => {
            connectedUsers[userId] = socket.id;
            socket.userId = userId;
            console.log(`User ${userId} is online`);
            io.emit('online-users', Object.keys(connectedUsers));
        });

        // Join a chat room (listing-based room)
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room: ${roomId}`);
        });

        // Leave a room
        socket.on('leave-room', (roomId) => {
            socket.leave(roomId);
            console.log(`User ${socket.id} left room: ${roomId}`);
        });

        // Send message in a room
        socket.on('send-message', async (data) => {
            try {
                const { roomId, content, senderId, senderName, senderRole } = data;

                // Save message to database
                const message = await Message.create({
                    roomId,
                    sender: senderId,
                    content,
                });

                await message.populate('sender', 'name avatar role');

                // Broadcast to everyone in the room
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

        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(data.roomId).emit('user-typing', {
                userId: data.userId,
                name: data.name,
            });
        });

        // Stop typing
        socket.on('stop-typing', (data) => {
            socket.to(data.roomId).emit('user-stop-typing', {
                userId: data.userId,
            });
        });

        // Send notification to specific user
        socket.on('send-notification', async (data) => {
            try {
                const { recipientId, title, message, type, relatedListing } = data;

                // Save to database
                const notification = await Notification.create({
                    recipient: recipientId,
                    title,
                    message,
                    type,
                    relatedListing,
                });

                // Send in real-time if user is online
                const recipientSocketId = connectedUsers[recipientId];
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('new-notification', notification);
                }

            } catch (error) {
                console.error('Notification error:', error);
            }
        });

        // New listing created — notify nearby receivers
        socket.on('new-listing', (data) => {
            // Broadcast to all connected receivers
            socket.broadcast.emit('listing-available', {
                listingId: data.listingId,
                title: data.title,
                city: data.city,
                foodType: data.foodType,
                quantity: data.quantity,
                donorName: data.donorName,
            });
        });

        // Listing claimed — notify donor
        socket.on('listing-claimed', (data) => {
            const donorSocketId = connectedUsers[data.donorId];
            if (donorSocketId) {
                io.to(donorSocketId).emit('your-listing-claimed', {
                    listingId: data.listingId,
                    title: data.title,
                    receiverName: data.receiverName,
                });
            }
        });

        // Pickup status update — notify all parties
        socket.on('pickup-status-update', (data) => {
            const { donorId, receiverId, volunteerId, status, pickupId } = data;
            const payload = { pickupId, status, updatedAt: new Date() };

            if (connectedUsers[donorId]) {
                io.to(connectedUsers[donorId]).emit('pickup-updated', payload);
            }
            if (connectedUsers[receiverId]) {
                io.to(connectedUsers[receiverId]).emit('pickup-updated', payload);
            }
            if (volunteerId && connectedUsers[volunteerId]) {
                io.to(connectedUsers[volunteerId]).emit('pickup-updated', payload);
            }
        });

        // Volunteer accepted pickup
        socket.on('volunteer-accepted', (data) => {
            const { donorId, receiverId, volunteerName, pickupId } = data;
            const payload = { pickupId, volunteerName, message: `${volunteerName} will pick up your food!` };

            if (connectedUsers[donorId]) {
                io.to(connectedUsers[donorId]).emit('volunteer-assigned', payload);
            }
            if (connectedUsers[receiverId]) {
                io.to(connectedUsers[receiverId]).emit('volunteer-assigned', payload);
            }
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            if (socket.userId) {
                delete connectedUsers[socket.userId];
                io.emit('online-users', Object.keys(connectedUsers));
                console.log(`User ${socket.userId} went offline`);
            }
            console.log('Socket disconnected:', socket.id);
        });
    });
};

module.exports = { socketHandler, connectedUsers };