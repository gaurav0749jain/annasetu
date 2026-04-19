import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

const categoryIcons = {
    cooked: '🍛', raw: '🥗', packaged: '📦',
    bakery: '🥖', fruits: '🍎', vegetables: '🥦', other: '🍽️',
};

export default function Listings() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ city: '', foodType: '', category: '' });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 9, ...filters });
            Object.keys(filters).forEach(k => !filters[k] && params.delete(k));
            const res = await API.get(`/listings?${params}`);
            setListings(res.data.listings);
            setTotalPages(res.data.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchListings(); }, [page, filters]);

    const handleFilter = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(1);
    };

    const timeLeft = (until) => {
        const diff = new Date(until) - new Date();
        if (diff < 0) return 'Expired';
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        if (hours > 0) return `${hours}h ${mins}m left`;
        return `${mins}m left`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Available Food</h1>
                        <p className="text-gray-500 text-sm">Fresh listings near you</p>
                    </div>
                    <Link to="/map" className="btn-secondary text-sm py-2 px-4 flex items-center gap-2 w-fit">
                        🗺️ Map View
                    </Link>
                </div>

                {/* Filters */}
                <div className="card mb-6 flex flex-wrap gap-3">
                    <input
                        name="city" value={filters.city} onChange={handleFilter}
                        placeholder="🏙️ Filter by city..." className="input-field flex-1 min-w-[150px]"
                    />
                    <select name="foodType" value={filters.foodType} onChange={handleFilter} className="input-field flex-1 min-w-[130px]">
                        <option value="">All types</option>
                        <option value="veg">🟢 Veg</option>
                        <option value="non-veg">🔴 Non-Veg</option>
                        <option value="both">🟡 Both</option>
                    </select>
                    <select name="category" value={filters.category} onChange={handleFilter} className="input-field flex-1 min-w-[130px]">
                        <option value="">All categories</option>
                        {Object.keys(categoryIcons).map(c => (
                            <option key={c} value={c}>{categoryIcons[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-5xl mb-4">🍽️</div>
                        <h3 className="text-lg font-semibold text-gray-600">No listings found</h3>
                        <p className="text-gray-400 text-sm mt-1">Try changing your filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {listings.map((listing) => (
                            <Link key={listing._id} to={`/listings/${listing._id}`}>
                                <div className="card hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer h-full">
                                    {/* Image */}
                                    <div className="h-40 bg-primary-50 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                                        {listing.images?.[0] ? (
                                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-5xl">{categoryIcons[listing.category] || '🍽️'}</span>
                                        )}
                                    </div>

                                    {/* Badges */}
                                    <div className="flex gap-2 mb-2 flex-wrap">
                                        <span className={listing.foodType === 'veg' ? 'badge-veg' : listing.foodType === 'non-veg' ? 'badge-nonveg' : 'badge-status bg-yellow-100 text-yellow-800'}>
                                            {listing.foodType === 'veg' ? '🟢 Veg' : listing.foodType === 'non-veg' ? '🔴 Non-Veg' : '🟡 Both'}
                                        </span>
                                        {listing.listingType === 'event' && (
                                            <span className="badge-status bg-purple-100 text-purple-800">🎉 Event</span>
                                        )}
                                        <span className="badge-status bg-gray-100 text-gray-600">
                                            {categoryIcons[listing.category]} {listing.category}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{listing.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{listing.description}</p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                                        <span>📦 {listing.quantity} {listing.unit}</span>
                                        <span>📍 {listing.city}</span>
                                        <span className="text-orange-500 font-medium">⏰ {timeLeft(listing.pickupUntil)}</span>
                                    </div>

                                    <div className="mt-2 text-xs text-gray-400">
                                        by {listing.donor?.name} · {listing.donor?.donorType}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
                            ← Prev
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-50">
                            Next →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}