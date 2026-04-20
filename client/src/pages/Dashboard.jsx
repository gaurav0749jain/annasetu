import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../utils/axios';
import Navbar from '../components/Navbar';
import StatusTracker from '../components/StatusTracker';

export default function Dashboard() {
    const { user } = useAuth();
    if (!user) return null;
    if (user.role === 'donor') return <DonorDashboard user={user} />;
    if (user.role === 'receiver') return <ReceiverDashboard user={user} />;
    if (user.role === 'volunteer') return <VolunteerDashboard user={user} />;
    if (user.role === 'admin') return <AdminRedirect />;
    return null;
}

function AdminRedirect() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 py-16 text-center">
                <div className="text-5xl mb-4">🛡️</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Admin Dashboard</h1>
                <Link to="/admin" className="btn-primary px-8 py-3">Go to Admin Panel →</Link>
            </div>
        </div>
    );
}

function DonorDashboard({ user }) {
    const [listings, setListings] = useState([]);
    const [pickups, setPickups] = useState([]);
    const [report, setReport] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const { notifications, markNotificationsRead } = useSocket();

    const fetchData = async () => {
        try {
            const [listRes, pickupRes] = await Promise.all([
                API.get('/listings/my'),
                API.get('/pickups/my'),
            ]);
            setListings(listRes.data);
            setPickups(pickupRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleConfirmPickup = async (pickupId) => {
        try {
            await API.put(`/pickups/${pickupId}/status`, { status: 'confirmed' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleRejectPickup = async (pickupId) => {
        try {
            await API.put(`/pickups/${pickupId}/status`, { status: 'cancelled' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const getImpactReport = async () => {
        setReportLoading(true);
        try {
            const res = await API.get('/ai/report');
            setReport(res.data.report);
        } catch (err) {
            setReport('Could not generate report. Try again later.');
        } finally {
            setReportLoading(false);
        }
    };

    const totalMeals = listings.reduce((sum, l) => sum + (l.mealsCount || l.quantity), 0);
    const delivered = pickups.filter(p => p.status === 'delivered').length;
    const active = listings.filter(l => l.status === 'available').length;
    const pendingConfirm = pickups.filter(p => p.status === 'claimed');

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}! 👋</h1>
                        <p className="text-gray-500 text-sm capitalize">{user.donorType} donor · {user.city}</p>
                    </div>
                    <Link to="/create-listing" className="btn-primary flex items-center gap-2 w-fit">
                        + Donate Food
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Listings', value: listings.length, icon: '📋' },
                        { label: 'Active Now', value: active, icon: '🟢' },
                        { label: 'Delivered', value: delivered, icon: '✅' },
                        { label: 'Meals Donated', value: totalMeals, icon: '🍱' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Pending Confirmations Alert */}
                {pendingConfirm.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-yellow-800 mb-3">
                            ⏳ {pendingConfirm.length} claim(s) waiting for your confirmation!
                        </h3>
                        <div className="space-y-2">
                            {pendingConfirm.map(pickup => (
                                <div key={pickup._id} className="flex items-center justify-between bg-white rounded-lg p-3">
                                    <div>
                                        <div className="font-medium text-sm">{pickup.listing?.title || 'Food Listing'}</div>
                                        <div className="text-xs text-gray-500">Claimed by: {pickup.receiver?.name}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleConfirmPickup(pickup._id)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                                            ✓ Confirm
                                        </button>
                                        <button onClick={() => handleRejectPickup(pickup._id)} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">
                                            ✕ Reject
                                        </button>
                                        <Link to={`/chat/${pickup._id}`} className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                                            💬 Chat
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* My Listings */}
                    <div className="md:col-span-2 card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-800">My Food Listings</h2>
                            <Link to="/create-listing" className="text-primary-600 text-sm hover:underline">+ New</Link>
                        </div>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : listings.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-2">🍽️</div>
                                <p className="text-gray-500 text-sm">No listings yet</p>
                                <Link to="/create-listing" className="btn-primary mt-3 inline-block text-sm px-6">Create First Listing</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {listings.slice(0, 5).map(listing => (
                                    <Link key={listing._id} to={`/listings/${listing._id}`}>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🍱</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-800 truncate">{listing.title}</div>
                                                <div className="text-xs text-gray-500">{listing.quantity} {listing.unit} · {listing.city}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${listing.status === 'available' ? 'bg-green-100 text-green-700' :
                                                    listing.status === 'claimed' ? 'bg-blue-100 text-blue-700' :
                                                        listing.status === 'delivered' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {listing.status}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <div className="card">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-800">Notifications</h2>
                                <button onClick={markNotificationsRead} className="text-xs text-primary-600 hover:underline">Mark all read</button>
                            </div>
                            {notifications.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No notifications yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 4).map((n, i) => (
                                        <div key={i} className={`p-2 rounded-lg text-xs ${n.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
                                            <div className="font-medium text-gray-800">{n.title}</div>
                                            <div className="text-gray-500">{n.message}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-2">AI Impact Report ✨</h2>
                            <p className="text-xs text-gray-500 mb-3">Get your personalized monthly impact story</p>
                            {report ? (
                                <div className="bg-primary-50 rounded-lg p-3 text-xs text-gray-700 leading-relaxed">{report}</div>
                            ) : (
                                <button onClick={getImpactReport} disabled={reportLoading} className="btn-primary w-full text-sm py-2">
                                    {reportLoading ? '✨ Generating...' : '✨ Generate Report'}
                                </button>
                            )}
                        </div>

                        <div className="card bg-primary-50 border-primary-100">
                            <div className="text-2xl mb-2">🏆</div>
                            <h3 className="font-semibold text-gray-800 mb-1">Leaderboard</h3>
                            <p className="text-xs text-gray-500 mb-3">See how you rank among donors</p>
                            <Link to="/leaderboard" className="btn-primary w-full text-sm py-2 block text-center">View Leaderboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ReceiverDashboard({ user }) {
    const [pickups, setPickups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { notifications } = useSocket();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await API.get('/pickups/my');
                setPickups(res.data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const active = pickups.filter(p => !['delivered', 'cancelled'].includes(p.status)).length;
    const delivered = pickups.filter(p => p.status === 'delivered').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}! 🏠</h1>
                        <p className="text-gray-500 text-sm">Receiver Dashboard · {user.city}</p>
                    </div>
                    <Link to="/listings" className="btn-primary w-fit">Browse Food →</Link>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Total Claims', value: pickups.length, icon: '📋' },
                        { label: 'Active Pickups', value: active, icon: '🚗' },
                        { label: 'Received', value: delivered, icon: '✅' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-4">My Claims & Pickups</h2>
                            {loading ? (
                                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
                            ) : pickups.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🍽️</div>
                                    <p className="text-gray-500 text-sm">No claims yet</p>
                                    <Link to="/listings" className="btn-primary mt-3 inline-block text-sm px-6">Browse Food</Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pickups.map(pickup => (
                                        <div key={pickup._id}>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">🍱</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-800 truncate">{pickup.listing?.title || 'Food Listing'}</div>
                                                    <div className="text-xs text-gray-500">From: {pickup.donor?.name} · {pickup.donor?.city}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${pickup.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                            pickup.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                                                                pickup.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                        }`}>{pickup.status}</span>
                                                    <Link to={`/chat/${pickup._id}`} className="text-xs text-primary-600 hover:underline">💬 Chat</Link>
                                                </div>
                                            </div>
                                            <StatusTracker currentStatus={pickup.status} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-3">Notifications</h2>
                            {notifications.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No notifications</p>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.slice(0, 5).map((n, i) => (
                                        <div key={i} className={`p-2 rounded-lg text-xs ${n.isRead ? 'bg-gray-50' : 'bg-primary-50'}`}>
                                            <div className="font-medium">{n.title}</div>
                                            <div className="text-gray-500">{n.message}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="card bg-primary-50 border-primary-100">
                            <div className="text-2xl mb-2">🗺️</div>
                            <h3 className="font-semibold text-gray-800 mb-1">Find Food Near You</h3>
                            <p className="text-xs text-gray-500 mb-3">See available food on the map</p>
                            <Link to="/map" className="btn-primary w-full text-sm py-2 block text-center">Open Map</Link>
                        </div>
                        <div className="card">
                            <h3 className="font-semibold text-gray-800 mb-1">🛡️ Food Safety Check</h3>
                            <p className="text-xs text-gray-500 mb-3">Check if food is safe using AI</p>
                            <Link to="/food-safety" className="btn-secondary w-full text-sm py-2 block text-center">Check Safety</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function VolunteerDashboard({ user }) {
    const [pickups, setPickups] = useState([]);
    const [available, setAvailable] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [myRes, availRes] = await Promise.all([
                API.get('/pickups/my'),
                API.get('/pickups/available'),
            ]);
            setPickups(myRes.data);
            setAvailable(availRes.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleAccept = async (pickupId) => {
        try {
            await API.put(`/pickups/${pickupId}/status`, { status: 'volunteer-assigned' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleStatusUpdate = async (pickupId, status) => {
        try {
            await API.put(`/pickups/${pickupId}/status`, { status });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const delivered = pickups.filter(p => p.status === 'delivered').length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Volunteer Dashboard 🚗</h1>
                    <p className="text-gray-500 text-sm">Welcome, {user.name} · {user.city}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Available Pickups', value: available.length, icon: '📦' },
                        { label: 'My Deliveries', value: pickups.length, icon: '🚗' },
                        { label: 'Completed', value: delivered, icon: '✅' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-4">Available Pickups 📦</h2>
                        {loading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
                        ) : available.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <div className="text-3xl mb-2">📭</div>
                                <p className="text-sm">No pickups available right now</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {available.map(pickup => (
                                    <div key={pickup._id} className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
                                        <div className="font-medium text-sm text-gray-800 mb-1">{pickup.listing?.title || 'Food Pickup'}</div>
                                        <div className="text-xs text-gray-500 mb-1">📍 {pickup.listing?.pickupAddress || pickup.listing?.city}</div>
                                        <div className="text-xs text-gray-500 mb-2">📦 {pickup.listing?.quantity} {pickup.listing?.unit} · From: {pickup.donor?.name}</div>
                                        <button onClick={() => handleAccept(pickup._id)} className="btn-primary text-xs py-1.5 px-4">
                                            Accept Pickup →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-4">My Deliveries 🚗</h2>
                        {pickups.length === 0 ? (
                            <div className="text-center py-6 text-gray-400">
                                <div className="text-3xl mb-2">🚗</div>
                                <p className="text-sm">No deliveries yet. Accept a pickup!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pickups.map(pickup => (
                                    <div key={pickup._id}>
                                        <div className="p-3 bg-gray-50 rounded-lg mb-2">
                                            <div className="font-medium text-sm text-gray-800 mb-1">{pickup.listing?.title || 'Food Pickup'}</div>
                                            <div className="text-xs text-gray-500 mb-2">
                                                Donor: {pickup.donor?.name} · Receiver: {pickup.receiver?.name}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {pickup.status === 'volunteer-assigned' && (
                                                    <button onClick={() => handleStatusUpdate(pickup._id, 'in-transit')} className="text-xs bg-blue-600 text-white px-2 py-1 rounded-md">
                                                        🏃 Start Pickup
                                                    </button>
                                                )}
                                                {pickup.status === 'in-transit' && (
                                                    <button onClick={() => handleStatusUpdate(pickup._id, 'delivered')} className="text-xs bg-green-600 text-white px-2 py-1 rounded-md">
                                                        ✓ Mark Delivered
                                                    </button>
                                                )}
                                                <Link to={`/chat/${pickup._id}`} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200">
                                                    💬 Chat
                                                </Link>
                                            </div>
                                        </div>
                                        <StatusTracker currentStatus={pickup.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}