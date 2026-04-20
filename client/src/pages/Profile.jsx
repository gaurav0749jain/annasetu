import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axios';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { user, login } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        city: user?.city || '',
        address: user?.address || '',
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await API.put('/auth/profile', form);
            const updatedUser = { ...user, ...form };
            login(updatedUser, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
            setSuccess('Profile updated successfully!');
            setEditing(false);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">

                {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">
                        {success}
                    </div>
                )}

                {/* Profile Card */}
                <div className="card text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-4xl font-bold text-primary-700 mx-auto mb-3">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <h1 className="text-xl font-bold text-gray-800">{user?.name}</h1>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                    <div className="flex justify-center gap-2 mt-2 flex-wrap">
                        <span className="badge-status bg-primary-100 text-primary-700 capitalize">{user?.role}</span>
                        {user?.donorType && (
                            <span className="badge-status bg-gray-100 text-gray-600 capitalize">{user?.donorType}</span>
                        )}
                        {user?.city && (
                            <span className="badge-status bg-blue-100 text-blue-700">📍 {user?.city}</span>
                        )}
                    </div>
                </div>

                {/* Details */}
                <div className="card mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-700">Account Details</h2>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="text-sm text-primary-600 hover:underline"
                        >
                            {editing ? 'Cancel' : '✏️ Edit'}
                        </button>
                    </div>

                    {editing ? (
                        <form onSubmit={handleSave} className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input name="name" value={form.name} onChange={handleChange} className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={form.phone} onChange={handleChange} className="input-field" placeholder="10-digit number" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input name="city" value={form.city} onChange={handleChange} className="input-field" placeholder="Your city" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input name="address" value={form.address} onChange={handleChange} className="input-field" placeholder="Your address" />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary w-full py-2">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-3 text-sm">
                            {[
                                { label: 'Name', value: user?.name },
                                { label: 'Email', value: user?.email },
                                { label: 'Phone', value: user?.phone || 'Not set' },
                                { label: 'City', value: user?.city || 'Not set' },
                                { label: 'Role', value: user?.role },
                                { label: 'Donor Type', value: user?.donorType },
                            ].filter(i => i.value).map(item => (
                                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                                    <span className="text-gray-500">{item.label}</span>
                                    <span className="font-medium capitalize">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="card">
                    <h2 className="font-semibold text-gray-700 mb-3">Quick Links</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link to="/dashboard" className="btn-secondary text-sm py-2 text-center">📊 Dashboard</Link>
                        <Link to="/listings" className="btn-secondary text-sm py-2 text-center">🍱 Browse Food</Link>
                        <Link to="/leaderboard" className="btn-secondary text-sm py-2 text-center">🏆 Leaderboard</Link>
                        <Link to="/food-safety" className="btn-secondary text-sm py-2 text-center">🛡️ Safety Check</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}