import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { notifications } = useSocket();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const unread = notifications.filter(n => !n.isRead).length;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🍱</span>
                        <span className="text-xl font-bold text-primary-600">AnnaSetu</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/listings" className="text-gray-600 hover:text-primary-600 text-sm font-medium">
                            Browse Food
                        </Link>
                        <Link to="/map" className="text-gray-600 hover:text-primary-600 text-sm font-medium">
                            Map View
                        </Link>
                        {user?.role === 'donor' && (
                            <Link to="/create-listing" className="text-gray-600 hover:text-primary-600 text-sm font-medium">
                                Donate Food
                            </Link>
                        )}
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="text-gray-600 hover:text-primary-600 text-sm font-medium">
                                Admin
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="relative">
                                    <button className="p-2 text-gray-600 hover:text-primary-600 relative">
                                        🔔
                                        {unread > 0 && (
                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {unread > 9 ? '9+' : unread}
                                            </span>
                                        )}
                                    </button>
                                </Link>
                                <Link to="/dashboard">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                </Link>
                                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn-secondary text-sm py-1.5 px-3">Login</Link>
                                <Link to="/register" className="btn-primary text-sm py-1.5 px-3">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}