import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const addNotification = (notif) => {
        setNotifications(prev => {
            const exists = prev.some(n => n._id === notif._id);
            if (exists) return prev;
            return [{ ...notif, isRead: false }, ...prev];
        });
    };

    useEffect(() => {
        if (!user) return;

        const newSocket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            newSocket.emit('user-online', user.id);
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        newSocket.on('online-users', (users) => {
            setOnlineUsers(users);
        });

        // New notification from server (auto-triggered by backend)
        newSocket.on('new-notification', (notification) => {
            console.log('New notification received:', notification);
            addNotification({
                _id: notification._id || Date.now(),
                title: notification.title,
                message: notification.message,
                type: notification.type,
                isRead: false,
                createdAt: notification.createdAt || new Date(),
            });
        });

        // New listing broadcast
        newSocket.on('listing-available', (data) => {
            if (user.role === 'receiver' || user.role === 'volunteer') {
                addNotification({
                    _id: `listing-${data.listingId}-${Date.now()}`,
                    title: '🍱 New Food Available!',
                    message: `${data.donorName} listed "${data.title}" in ${data.city}`,
                    type: 'new-listing',
                    isRead: false,
                    createdAt: new Date(),
                });
            }
        });

        // Your listing was claimed (for donors)
        newSocket.on('your-listing-claimed', (data) => {
            addNotification({
                _id: `claimed-${data.listingId}-${Date.now()}`,
                title: '🤝 Listing Claimed!',
                message: `${data.receiverName} claimed "${data.title}"`,
                type: 'claim',
                isRead: false,
                createdAt: new Date(),
            });
        });

        // Pickup status updated
        newSocket.on('pickup-updated', (data) => {
            const statusMessages = {
                'confirmed': '✅ Claim confirmed by donor!',
                'volunteer-assigned': '🚗 Volunteer has been assigned!',
                'in-transit': '🏃 Food is on the way!',
                'delivered': '🎉 Food delivered successfully!',
                'cancelled': '❌ Pickup was cancelled',
            };
            addNotification({
                _id: `pickup-${data.pickupId}-${data.status}-${Date.now()}`,
                title: statusMessages[data.status] || 'Pickup Updated',
                message: `Status changed to: ${data.status}`,
                type: data.status === 'delivered' ? 'delivered' : 'confirmed',
                isRead: false,
                createdAt: new Date(),
            });
        });

        // Volunteer assigned notification
        newSocket.on('volunteer-assigned', (data) => {
            addNotification({
                _id: `vol-${data.pickupId}-${Date.now()}`,
                title: '🚗 Volunteer Assigned!',
                message: data.message || `${data.volunteerName} will pick up your food!`,
                type: 'confirmed',
                isRead: false,
                createdAt: new Date(),
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    const joinRoom = (roomId) => {
        if (socket) socket.emit('join-room', roomId);
    };

    const leaveRoom = (roomId) => {
        if (socket) socket.emit('leave-room', roomId);
    };

    const sendMessage = (data) => {
        if (socket) socket.emit('send-message', data);
    };

    const markNotificationsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const clearNotification = (id) => {
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    return (
        <SocketContext.Provider value={{
            socket,
            notifications,
            onlineUsers,
            joinRoom,
            leaveRoom,
            sendMessage,
            markNotificationsRead,
            clearNotification,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);