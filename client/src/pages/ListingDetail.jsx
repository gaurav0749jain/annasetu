import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function ListingDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const res = await API.get(`/listings/${id}`);
                setListing(res.data);
            } catch (err) {
                setError('Listing not found');
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [id]);

    const handleClaim = async () => {
        if (!user) { navigate('/login'); return; }
        setClaiming(true);
        try {
            await API.put(`/listings/${id}/claim`);
            setClaimed(true);
            setListing(prev => ({ ...prev, status: 'claimed' }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to claim');
        } finally {
            setClaiming(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="text-center py-20 text-gray-500">Listing not found</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link to="/listings" className="text-primary-600 text-sm hover:underline mb-4 inline-block">
                    ← Back to listings
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Image */}
                    <div className="h-72 bg-primary-50 rounded-xl overflow-hidden flex items-center justify-center">
                        {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-8xl">🍽️</span>
                        )}
                    </div>

                    {/* Details */}
                    <div className="card">
                        <div className="flex gap-2 mb-3 flex-wrap">
                            <span className={listing.foodType === 'veg' ? 'badge-veg' : 'badge-nonveg'}>
                                {listing.foodType === 'veg' ? '🟢 Veg' : '🔴 Non-Veg'}
                            </span>
                            <span className="badge-status bg-blue-100 text-blue-800">{listing.category}</span>
                            {listing.listingType === 'event' && (
                                <span className="badge-status bg-purple-100 text-purple-800">🎉 Event</span>
                            )}
                            <span className={`badge-status ${listing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {listing.status}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-2">{listing.title}</h1>
                        <p className="text-gray-600 text-sm mb-4">{listing.description}</p>

                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>📦</span> <span>{listing.quantity} {listing.unit}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>📍</span> <span>{listing.pickupAddress}, {listing.city}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span>⏰</span>
                                <span>Pickup: {new Date(listing.pickupFrom).toLocaleString()} — {new Date(listing.pickupUntil).toLocaleString()}</span>
                            </div>
                            {listing.safetyWindow && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <span>🛡️</span> <span>Safe for: {listing.safetyWindow}</span>
                                </div>
                            )}
                        </div>

                        {/* Donor info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                            <div className="text-xs text-gray-500 mb-1">Posted by</div>
                            <div className="font-medium text-gray-800">{listing.donor?.name}</div>
                            <div className="text-xs text-gray-500">{listing.donor?.donorType} · {listing.donor?.city}</div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-700 rounded-lg px-3 py-2 text-sm mb-3">{error}</div>
                        )}

                        {claimed || listing.status === 'claimed' ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                <div className="text-2xl mb-1">✅</div>
                                <div className="font-semibold text-green-800">Successfully Claimed!</div>
                                <div className="text-sm text-green-600 mt-1">Check your dashboard for pickup details</div>
                                <Link to="/dashboard" className="btn-primary mt-3 inline-block text-sm px-6">
                                    Go to Dashboard
                                </Link>
                            </div>
                        ) : listing.status === 'available' && user?.role === 'receiver' ? (
                            <button onClick={handleClaim} disabled={claiming} className="btn-primary w-full py-3 text-base">
                                {claiming ? 'Claiming...' : '🤝 Claim This Food'}
                            </button>
                        ) : !user ? (
                            <Link to="/login" className="btn-primary w-full py-3 text-base text-center block">
                                Login to Claim
                            </Link>
                        ) : listing.status === 'available' && user?.role !== 'receiver' ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-center">
                                Only receivers (NGOs) can claim food listings
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Tags */}
                {listing.tags?.length > 0 && (
                    <div className="card mt-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Tags</div>
                        <div className="flex flex-wrap gap-2">
                            {listing.tags.map(tag => (
                                <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{tag}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}