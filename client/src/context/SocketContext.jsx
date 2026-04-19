import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (user) {
            const newSocket = io('http://localhost:5000', {
                transports: ['websocket'],
            });

            newSocket.on('connect', () => {
                newSocket.emit('user-online', user.id);
            });

            newSocket.on('online-users', (users) => {
                setOnlineUsers(users);
            });

            newSocket.on('new-notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
            });

            newSocket.on('listing-available', (data) => {
                setNotifications(prev => [{
                    _id: Date.now(),
                    title: 'New Food Available!',
                    message: `${data.donorName} listed ${data.title} in ${data.city}`,
                    type: 'new-listing',
                    isRead: false,
                    createdAt: new Date(),
                }, ...prev]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        }
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

    return (
        <SocketContext.Provider value={{
            socket, notifications, onlineUsers,
            joinRoom, leaveRoom, sendMessage, markNotificationsRead,
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);