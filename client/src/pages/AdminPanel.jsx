import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/axios';
import Navbar from '../components/Navbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#16a34a', '#2563eb', '#d97706', '#dc2626'];

export default function AdminPanel() {
    const [stats, setStats] = useState(null);
    const [topDonors, setTopDonors] = useState([]);
    const [users, setUsers] = useState([]);
    const [listings, setListings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, usersRes, listingsRes] = await Promise.all([
                    API.get('/admin/stats'),
                    API.get('/admin/users'),
                    API.get('/admin/listings'),
                ]);
                setStats(statsRes.data.stats);
                setTopDonors(statsRes.data.topDonors);
                setUsers(usersRes.data.users);
                setListings(listingsRes.data.listings);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUserStatus = async (userId, isApproved) => {
        try {
            await API.put(`/admin/users/${userId}/status`, { isApproved });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isApproved } : u));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await API.delete(`/admin/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            console.error(err);
        }
    };

    const roleData = stats ? [
        { name: 'Donors', value: stats.totalDonors },
        { name: 'Receivers', value: stats.totalReceivers },
        { name: 'Volunteers', value: stats.totalVolunteers },
    ] : [];

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">🛡️ Admin Panel</h1>
                    <p className="text-gray-500 text-sm">Platform overview and management</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Users', value: stats?.totalUsers, icon: '👥' },
                        { label: 'Active Listings', value: stats?.activeListings, icon: '🍱' },
                        { label: 'Meals Saved', value: stats?.totalMealsSaved, icon: '🍽️' },
                        { label: 'CO₂ Saved (kg)', value: stats?.co2Saved, icon: '🌱' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value || 0}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['overview', 'users', 'listings'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* User Roles Chart */}
                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-4">User Distribution</h2>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={roleData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {roleData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top Donors */}
                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-4">🏆 Top Donors</h2>
                            {topDonors.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
                            ) : (
                                <div className="space-y-3">
                                    {topDonors.map((d, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                                                {i + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{d.donor?.name}</div>
                                                <div className="text-xs text-gray-500">{d.donor?.city} · {d.donor?.donorType}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold text-primary-600">{d.totalMeals} meals</div>
                                                <div className="text-xs text-gray-500">{d.count} listings</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Platform Summary */}
                        <div className="card md:col-span-2">
                            <h2 className="font-semibold text-gray-800 mb-4">Platform Summary</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'Donors', value: stats?.totalDonors, color: 'bg-blue-100 text-blue-700' },
                                    { label: 'Receivers', value: stats?.totalReceivers, color: 'bg-green-100 text-green-700' },
                                    { label: 'Volunteers', value: stats?.totalVolunteers, color: 'bg-yellow-100 text-yellow-700' },
                                    { label: 'Total Deliveries', value: stats?.totalDelivered, color: 'bg-purple-100 text-purple-700' },
                                ].map(s => (
                                    <div key={s.label} className={`rounded-lg p-4 text-center ${s.color}`}>
                                        <div className="text-2xl font-bold">{s.value || 0}</div>
                                        <div className="text-xs font-medium mt-1">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="card overflow-x-auto">
                        <h2 className="font-semibold text-gray-800 mb-4">All Users ({users.length})</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Role</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">City</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2 font-medium">{user.name}</td>
                                        <td className="py-2 text-gray-500">{user.email}</td>
                                        <td className="py-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'donor' ? 'bg-blue-100 text-blue-700' :
                                                    user.role === 'receiver' ? 'bg-green-100 text-green-700' :
                                                        user.role === 'volunteer' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="py-2 text-gray-500">{user.city || '-'}</td>
                                        <td className="py-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${user.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.isApproved ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="py-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUserStatus(user._id, !user.isApproved)}
                                                    className={`text-xs px-2 py-1 rounded ${user.isApproved ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                                >
                                                    {user.isApproved ? 'Suspend' : 'Approve'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id)}
                                                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Listings Tab */}
                {activeTab === 'listings' && (
                    <div className="card overflow-x-auto">
                        <h2 className="font-semibold text-gray-800 mb-4">All Listings ({listings.length})</h2>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-2 text-gray-500 font-medium">Title</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Donor</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">City</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Quantity</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listings.map(listing => (
                                    <tr key={listing._id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="py-2 font-medium">
                                            <Link to={`/listings/${listing._id}`} className="hover:text-primary-600">
                                                {listing.title}
                                            </Link>
                                        </td>
                                        <td className="py-2 text-gray-500">{listing.donor?.name}</td>
                                        <td className="py-2 text-gray-500">{listing.city}</td>
                                        <td className="py-2">{listing.quantity} {listing.unit}</td>
                                        <td className="py-2">
                                            <span className={`text-xs px-2 py-1 rounded-full ${listing.status === 'available' ? 'bg-green-100 text-green-700' :
                                                    listing.status === 'claimed' ? 'bg-blue-100 text-blue-700' :
                                                        listing.status === 'delivered' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {listing.status}
                                            </span>
                                        </td>
                                        <td className="py-2 text-gray-500">
                                            {new Date(listing.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}