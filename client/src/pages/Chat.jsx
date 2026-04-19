import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

export default function Chat() {
    const { roomId } = useParams();
    const { user } = useAuth();
    const { socket, joinRoom, leaveRoom } = useSocket();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [typing, setTyping] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const typingTimeout = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await API.get(`/messages/${roomId}`);
                setMessages(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
        joinRoom(roomId);
        return () => leaveRoom(roomId);
    }, [roomId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receive-message', (msg) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('user-typing', (data) => {
            setTyping(`${data.name} is typing...`);
        });

        socket.on('user-stop-typing', () => {
            setTyping('');
        });

        return () => {
            socket.off('receive-message');
            socket.off('user-typing');
            socket.off('user-stop-typing');
        };
    }, [socket]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgData = {
            roomId,
            content: newMessage,
            senderId: user.id,
            senderName: user.name,
            senderRole: user.role,
        };

        socket?.emit('send-message', msgData);

        try {
            await API.post('/messages', { roomId, content: newMessage });
        } catch (err) {
            console.error(err);
        }

        setNewMessage('');
        socket?.emit('stop-typing', { roomId, userId: user.id });
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        socket?.emit('typing', { roomId, userId: user.id, name: user.name });
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket?.emit('stop-typing', { roomId, userId: user.id });
        }, 1500);
    };

    const roleColor = (role) => {
        if (role === 'donor') return 'bg-blue-100 text-blue-700';
        if (role === 'receiver') return 'bg-green-100 text-green-700';
        if (role === 'volunteer') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-6">
                <div className="card p-0 overflow-hidden flex flex-col" style={{ height: '75vh' }}>

                    {/* Header */}
                    <div className="bg-primary-600 text-white px-4 py-3 flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-lg">💬</div>
                        <div>
                            <div className="font-semibold text-sm">Pickup Chat</div>
                            <div className="text-xs text-primary-200">Donor · Receiver · Volunteer</div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">
                                <div className="text-3xl mb-2">💬</div>
                                <div className="text-sm">No messages yet. Start the conversation!</div>
                            </div>
                        ) : (
                            messages.map((msg, i) => {
                                const isMe = msg.sender?._id === user?.id || msg.sender === user?.id;
                                return (
                                    <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            {!isMe && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="text-xs font-medium text-gray-600">{msg.sender?.name || msg.senderName}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${roleColor(msg.sender?.role || msg.senderRole)}`}>
                                                        {msg.sender?.role || msg.senderRole}
                                                    </span>
                                                </div>
                                            )}
                                            <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                                                {msg.content}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5 px-1">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {typing && <div className="text-xs text-gray-400 italic">{typing}</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
                        <input
                            value={newMessage}
                            onChange={handleTyping}
                            placeholder="Type a message..."
                            className="input-field flex-1"
                        />
                        <button type="submit" disabled={!newMessage.trim()} className="btn-primary px-4 disabled:opacity-50">
                            Send →
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}