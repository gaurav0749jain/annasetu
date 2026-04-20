import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import API from '../utils/axios';
import Navbar from '../components/Navbar';
import StatusTracker from '../components/StatusTracker';
import QRCodeDisplay from '../components/QRCodeDisplay';

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

// ─────────────────────────────────────────────
// DONOR DASHBOARD
// ─────────────────────────────────────────────
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

    const totalMeals = listings.reduce((sum, l) => sum + (l.mealsCount || l.quantity || 0), 0);
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

                {pendingConfirm.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                        <h3 className="font-semibold text-yellow-800 mb-3">
                            ⏳ {pendingConfirm.length} claim(s) waiting for your confirmation!
                        </h3>
                        <div className="space-y-3">
                            {pendingConfirm.map(pickup => (
                                <div key={pickup._id} className="flex items-center justify-between bg-white rounded-lg p-3 flex-wrap gap-2">
                                    <div>
                                        <div className="font-medium text-sm">{pickup.listing?.title || 'Food Listing'}</div>
                                        <div className="text-xs text-gray-500">Claimed by: <strong>{pickup.receiver?.name}</strong></div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => handleConfirmPickup(pickup._id)}
                                            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                                            ✓ Confirm
                                        </button>
                                        <button onClick={() => handleRejectPickup(pickup._id)}
                                            className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200">
                                            ✕ Reject
                                        </button>
                                        <Link to={`/chat/${pickup._id}`}
                                            className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                                            💬 Chat
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                {listings.slice(0, 6).map(listing => (
                                    <Link key={listing._id} to={`/listings/${listing._id}`}>
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                                                {listing.images?.[0]
                                                    ? <img src={listing.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                                                    : '🍱'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-gray-800 truncate">{listing.title}</div>
                                                <div className="text-xs text-gray-500">{listing.quantity} {listing.unit} · {listing.city}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${listing.status === 'available' ? 'bg-green-100 text-green-700' :
                                                    listing.status === 'claimed' ? 'bg-blue-100 text-blue-700' :
                                                        listing.status === 'delivered' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-yellow-100 text-yellow-700'
                                                }`}>{listing.status}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

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
                                    {notifications.slice(0, 5).map((n, i) => (
                                        <div key={i} className={`p-2 rounded-lg text-xs ${n.isRead ? 'bg-gray-50' : 'bg-primary-50 border-l-2 border-primary-400'}`}>
                                            <div className="font-medium text-gray-800">{n.title}</div>
                                            <div className="text-gray-500 mt-0.5">{n.message}</div>
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

                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-3">Quick Links</h2>
                            <div className="space-y-2">
                                <Link to="/leaderboard" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50">🏆 Leaderboard</Link>
                                <Link to="/food-safety" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50">🛡️ Food Safety Check</Link>
                                <Link to="/map" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50">🗺️ Map View</Link>
                                <Link to="/profile" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-50">👤 My Profile</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// RECEIVER DASHBOARD
// ─────────────────────────────────────────────
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
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : pickups.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🍽️</div>
                                    <p className="text-gray-500 text-sm">No claims yet</p>
                                    <Link to="/listings" className="btn-primary mt-3 inline-block text-sm px-6">Browse Food</Link>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {pickups.map(pickup => (
                                        <div key={pickup._id} className="border border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
                                                    {pickup.listing?.images?.[0]
                                                        ? <img src={pickup.listing.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                                                        : '🍱'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-sm text-gray-800 truncate">
                                                        {pickup.listing?.title || 'Food Listing'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">From: {pickup.donor?.name} · {pickup.donor?.city}</div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${pickup.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                        pickup.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                                                            pickup.status === 'confirmed' ? 'bg-yellow-100 text-yellow-700' :
                                                                pickup.status === 'volunteer-assigned' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                    }`}>{pickup.status}</span>
                                            </div>

                                            <div className="flex gap-2 mb-3 flex-wrap">
                                                <Link to={`/chat/${pickup._id}`}
                                                    className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200">
                                                    💬 Chat
                                                </Link>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg">
                                                    📦 {pickup.listing?.quantity} {pickup.listing?.unit}
                                                </span>
                                            </div>

                                            <StatusTracker currentStatus={pickup.status} />

                                            {/* QR for receiver — show delivery QR when in-transit */}
                                            {['volunteer-assigned', 'in-transit'].includes(pickup.status) && (
                                                <div className="mt-3">
                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 mb-2">
                                                        📱 <strong>Action needed:</strong> When the volunteer arrives with food,
                                                        scan the <strong>Delivery QR code</strong> to confirm receipt.
                                                    </div>
                                                    <QRCodeDisplay pickupId={pickup._id} userRole="receiver" />
                                                </div>
                                            )}

                                            {pickup.status === 'delivered' && (
                                                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-700">
                                                    🎉 <strong>Delivered & verified!</strong> This pickup is complete.
                                                    {pickup.deliveryQRScannedAt && (
                                                        <span className="block mt-1">
                                                            Confirmed at: {new Date(pickup.deliveryQRScannedAt).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
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
                                        <div key={i} className={`p-2 rounded-lg text-xs ${n.isRead ? 'bg-gray-50' : 'bg-primary-50 border-l-2 border-primary-400'}`}>
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
                            <div className="text-2xl mb-2">🛡️</div>
                            <h3 className="font-semibold text-gray-800 mb-1">Food Safety Check</h3>
                            <p className="text-xs text-gray-500 mb-3">AI-powered food safety checker</p>
                            <Link to="/food-safety" className="btn-secondary w-full text-sm py-2 block text-center">Check Safety</Link>
                        </div>

                        <div className="card">
                            <div className="text-2xl mb-2">📱</div>
                            <h3 className="font-semibold text-gray-800 mb-1">QR Scanner</h3>
                            <p className="text-xs text-gray-500 mb-3">Scan delivery QR to confirm food receipt</p>
                            <Link to="/qr-verify" className="btn-primary w-full text-sm py-2 block text-center">Open Scanner</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// VOLUNTEER DASHBOARD
// ─────────────────────────────────────────────
function VolunteerDashboard({ user }) {
    const [pickups, setPickups] = useState([]);
    const [available, setAvailable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusError, setStatusError] = useState({});
    const navigate = useNavigate();

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
            setStatusError(prev => ({ ...prev, [pickupId]: '' }));
            await API.put(`/pickups/${pickupId}/status`, { status });
            fetchData();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to update status';
            const requiresQR = err.response?.data?.requiresQR;
            const qrType = err.response?.data?.qrType;

            if (requiresQR) {
                setStatusError(prev => ({
                    ...prev,
                    [pickupId]: { message: msg, requiresQR: true, qrType }
                }));
            } else {
                setStatusError(prev => ({ ...prev, [pickupId]: { message: msg } }));
            }
        }
    };

    const delivered = pickups.filter(p => p.status === 'delivered').length;
    const active = pickups.filter(p => !['delivered', 'cancelled'].includes(p.status)).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-6xl mx-auto px-4 py-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Volunteer Dashboard 🚗</h1>
                        <p className="text-gray-500 text-sm">Welcome, {user.name} · {user.city}</p>
                    </div>
                    <Link to="/qr-verify" className="btn-primary flex items-center gap-2 w-fit">
                        📱 Scan QR Code
                    </Link>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'Available Pickups', value: available.length, icon: '📦' },
                        { label: 'Active Deliveries', value: active, icon: '🚗' },
                        { label: 'Completed', value: delivered, icon: '✅' },
                    ].map(s => (
                        <div key={s.label} className="card text-center">
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-primary-600">{s.value}</div>
                            <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* QR Info Banner */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <div className="text-2xl flex-shrink-0">📱</div>
                    <div className="flex-1">
                        <div className="font-semibold text-blue-800 text-sm mb-1">QR Code Required for Delivery</div>
                        <div className="text-xs text-blue-700 leading-relaxed">
                            <strong>Step 1:</strong> Scan <strong>Pickup QR</strong> at donor's location → food marked "In Transit" automatically<br />
                            <strong>Step 2:</strong> Ask receiver to scan <strong>Delivery QR</strong> when food arrives → delivery confirmed
                        </div>
                    </div>
                    <Link to="/qr-verify" className="btn-primary text-xs px-3 py-2 flex-shrink-0">Open Scanner</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Available Pickups */}
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-4">Available Pickups 📦</h2>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                        ) : available.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-sm">No pickups available right now</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {available.map(pickup => (
                                    <div key={pickup._id} className="p-3 border border-gray-200 rounded-xl hover:border-primary-300 transition-colors">
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {pickup.listing?.title || 'Food Pickup'}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-1">📍 {pickup.listing?.pickupAddress || pickup.listing?.city}</div>
                                        <div className="text-xs text-gray-500 mb-1">📦 {pickup.listing?.quantity} {pickup.listing?.unit}</div>
                                        <div className="text-xs text-gray-500 mb-3">
                                            🤝 {pickup.donor?.name} → 🏠 {pickup.receiver?.name}
                                        </div>
                                        <button onClick={() => handleAccept(pickup._id)} className="btn-primary text-xs py-1.5 px-4">
                                            Accept Pickup →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* My Deliveries */}
                    <div className="card">
                        <h2 className="font-semibold text-gray-800 mb-4">My Deliveries 🚗</h2>
                        {pickups.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-4xl mb-2">🚗</div>
                                <p className="text-sm">No deliveries yet. Accept a pickup!</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {pickups.map(pickup => (
                                    <div key={pickup._id} className="border border-gray-200 rounded-xl p-4">
                                        <div className="font-medium text-sm text-gray-800 mb-1">
                                            {pickup.listing?.title || 'Food Pickup'}
                                        </div>
                                        <div className="text-xs text-gray-500 mb-3">
                                            🤝 {pickup.donor?.name} → 🏠 {pickup.receiver?.name}
                                        </div>

                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <span className={`text-xs px-2 py-1 rounded-full ${pickup.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                                    pickup.status === 'in-transit' ? 'bg-blue-100 text-blue-700' :
                                                        pickup.status === 'volunteer-assigned' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>{pickup.status}</span>

                                            <Link to={`/chat/${pickup._id}`}
                                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-200">
                                                💬 Chat
                                            </Link>
                                        </div>

                                        {/* QR enforcement messages */}
                                        {statusError[pickup._id] && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-xs text-red-700">
                                                <div className="font-medium mb-1">⚠️ {statusError[pickup._id].message}</div>
                                                {statusError[pickup._id].requiresQR && (
                                                    <Link to="/qr-verify"
                                                        className="inline-block mt-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 font-medium">
                                                        📱 Open QR Scanner →
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        {/* Action buttons with QR requirement shown */}
                                        {pickup.status === 'volunteer-assigned' && (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 text-xs text-yellow-800">
                                                <div className="font-medium mb-2">📱 Next step: Scan Pickup QR at donor's location</div>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Link to="/qr-verify"
                                                        className="bg-primary-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-700">
                                                        📱 Scan Pickup QR
                                                    </Link>
                                                    <button
                                                        onClick={() => handleStatusUpdate(pickup._id, 'in-transit')}
                                                        className="bg-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-xs cursor-not-allowed"
                                                        disabled
                                                        title="Scan QR first"
                                                    >
                                                        🔒 Start Pickup (scan QR first)
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {pickup.status === 'in-transit' && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3 text-xs text-blue-800">
                                                <div className="font-medium mb-2">📱 Next step: Ask receiver to scan Delivery QR</div>
                                                <div className="flex gap-2 flex-wrap">
                                                    <Link to="/qr-verify"
                                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700">
                                                        📱 Scan Delivery QR
                                                    </Link>
                                                    <button
                                                        onClick={() => handleStatusUpdate(pickup._id, 'delivered')}
                                                        className="bg-gray-200 text-gray-500 px-3 py-1.5 rounded-lg text-xs cursor-not-allowed"
                                                        disabled
                                                        title="Receiver must scan delivery QR first"
                                                    >
                                                        🔒 Mark Delivered (scan QR first)
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {pickup.status === 'delivered' && (
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 text-xs text-green-700">
                                                🎉 <strong>Completed!</strong> QR verified delivery confirmed.
                                                {pickup.deliveryQRScannedAt && (
                                                    <span className="block mt-1">
                                                        Delivered at: {new Date(pickup.deliveryQRScannedAt).toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Status Tracker */}
                                        <StatusTracker currentStatus={pickup.status} />

                                        {/* QR Codes display */}
                                        {['volunteer-assigned', 'in-transit', 'delivered'].includes(pickup.status) && (
                                            <QRCodeDisplay pickupId={pickup._id} userRole="volunteer" />
                                        )}
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