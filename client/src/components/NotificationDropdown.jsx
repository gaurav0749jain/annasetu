import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import API from '../utils/axios';

export default function NotificationDropdown() {
    const { notifications, markNotificationsRead } = useSocket();
    const [open, setOpen] = useState(false);
    const [dbNotifs, setDbNotifs] = useState([]);
    const dropdownRef = useRef(null);

    const unread = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const fetchNotifs = async () => {
            try {
                const res = await API.get('/notifications');
                setDbNotifs(res.data);
            } catch (err) { }
        };
        if (open) fetchNotifs();
    }, [open]);

    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleOpen = () => {
        setOpen(!open);
        if (!open) markNotificationsRead();
    };

    const allNotifs = [...notifications, ...dbNotifs].slice(0, 10);

    const typeIcon = (type) => {
        if (type === 'new-listing') return '🍱';
        if (type === 'claim') return '🤝';
        if (type === 'confirmed') return '✅';
        if (type === 'in-transit') return '🚗';
        if (type === 'delivered') return '🎉';
        if (type === 'message') return '💬';
        return '🔔';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
                <span className="text-xl">🔔</span>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800">Notifications</span>
                        <span className="text-xs text-gray-400">{allNotifs.length} total</span>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {allNotifs.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-3xl mb-2">🔔</div>
                                <div className="text-sm">No notifications yet</div>
                            </div>
                        ) : (
                            allNotifs.map((n, i) => (
                                <div key={n._id || i} className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50' : ''}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg flex-shrink-0">{typeIcon(n.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs text-gray-800">{n.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1"></div>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100">
                        <button onClick={markNotificationsRead} className="text-xs text-primary-600 hover:underline">
                            Mark all as read
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}