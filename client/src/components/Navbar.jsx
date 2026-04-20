import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [dark]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🍱</span>
                        <span className="text-xl font-bold text-primary-600">AnnaSetu</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/listings" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Browse Food</Link>
                        <Link to="/map" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Map View</Link>
                        <Link to="/leaderboard" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Leaderboard</Link>
                        <Link to="/food-safety" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Safety Check</Link>
                        {user?.role === 'donor' && (
                            <Link to="/create-listing" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Donate Food</Link>
                        )}
                        {user?.role === 'admin' && (
                            <Link to="/admin" className="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Admin</Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle */}
                        <button
                            onClick={() => setDark(!dark)}
                            className="p-2 text-gray-500 hover:text-primary-600 transition-colors text-lg"
                            title={dark ? 'Light mode' : 'Dark mode'}
                        >
                            {dark ? '☀️' : '🌙'}
                        </button>

                        {user ? (
                            <>
                                <NotificationDropdown />
                                <Link to="/profile">
                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm hover:bg-primary-200 transition-colors">
                                        {user.name?.charAt(0).toUpperCase()}
                                    </div>
                                </Link>
                                <Link to="/dashboard" className="text-sm text-gray-600 hover:text-primary-600 font-medium hidden md:block">
                                    Dashboard
                                </Link>
                                <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">Logout</button>
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