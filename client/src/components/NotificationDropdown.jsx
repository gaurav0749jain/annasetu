import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import API from '../utils/axios';

export default function NotificationDropdown() {
    const { notifications, markNotificationsRead, clearNotification } = useSocket();
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
        if (!open) {
            setTimeout(() => markNotificationsRead(), 1000);
        }
    };

    const typeIcon = (type) => {
        const icons = {
            'new-listing': '🍱',
            'claim': '🤝',
            'confirmed': '✅',
            'in-transit': '🏃',
            'delivered': '🎉',
            'message': '💬',
            'system': '📢',
        };
        return icons[type] || '🔔';
    };

    // Merge real-time + DB notifications, deduplicate
    const merged = [...notifications];
    dbNotifs.forEach(dbN => {
        if (!merged.some(n => n._id?.toString() === dbN._id?.toString())) {
            merged.push(dbN);
        }
    });
    const allNotifs = merged.slice(0, 15);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleOpen}
                className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
                title="Notifications"
            >
                <span className="text-xl">🔔</span>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-800">Notifications</span>
                            {unread > 0 && (
                                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unread} new</span>
                            )}
                        </div>
                        <button onClick={markNotificationsRead} className="text-xs text-primary-600 hover:underline">
                            Mark all read
                        </button>
                    </div>

                    {/* Notifications list */}
                    <div className="max-h-96 overflow-y-auto">
                        {allNotifs.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <div className="text-4xl mb-2">🔔</div>
                                <div className="text-sm">No notifications yet</div>
                                <div className="text-xs mt-1">Actions like claims and deliveries will show here</div>
                            </div>
                        ) : (
                            allNotifs.map((n, i) => (
                                <div
                                    key={n._id || i}
                                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-primary-50 border-l-2 border-l-primary-400' : ''}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-xs text-gray-800">{n.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {new Date(n.createdAt).toLocaleString([], {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        {!n.isRead && (
                                            <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                        <span className="text-xs text-gray-400">{allNotifs.length} total notifications</span>
                    </div>
                </div>
            )}
        </div>
    );
}