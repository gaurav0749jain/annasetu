import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapView() {
    const [listings, setListings] = useState([]);
    const [userLocation, setUserLocation] = useState([20.5937, 78.9629]);
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState(10);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
                () => console.log('Location denied, using default')
            );
        }
    }, []);

    useEffect(() => {
        const fetchNearby = async () => {
            setLoading(true);
            try {
                const res = await API.get(`/listings/nearby?latitude=${userLocation[0]}&longitude=${userLocation[1]}&radius=${radius}`);
                setListings(res.data);
            } catch (err) {
                const res = await API.get('/listings?limit=20');
                setListings(res.data.listings || []);
            } finally {
                setLoading(false);
            }
        };
        fetchNearby();
    }, [userLocation, radius]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Food Map 🗺️</h1>
                        <p className="text-gray-500 text-sm">{listings.length} listings found near you</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600">Radius:</label>
                        <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field w-28">
                            <option value="5">5 km</option>
                            <option value="10">10 km</option>
                            <option value="25">25 km</option>
                            <option value="50">50 km</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '500px' }}>
                    <MapContainer center={userLocation} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {listings.map((listing) => (
                            listing.location?.coordinates?.[0] !== 0 && (
                                <Marker
                                    key={listing._id}
                                    position={[
                                        listing.location.coordinates[1],
                                        listing.location.coordinates[0],
                                    ]}
                                >
                                    <Popup>
                                        <div className="min-w-[180px]">
                                            <div className="font-semibold text-sm mb-1">{listing.title}</div>
                                            <div className="text-xs text-gray-500 mb-1">
                                                📦 {listing.quantity} {listing.unit} · {listing.foodType}
                                            </div>
                                            <div className="text-xs text-gray-500 mb-2">📍 {listing.city}</div>

                                            {/* FIX: Added opening <a> tag here */}
                                            <a
                                                href={`/listings/${listing._id}`}
                                                className="text-xs bg-green-600 text-white px-3 py-1 rounded-md inline-block hover:bg-green-700"
                                            >
                                                View Details →
                                            </a>
                                        </div>
                                    </Popup>
                                </Marker>
                            )
                        ))}
                    </MapContainer>
                </div>

                {/* Listing cards below map */}
                {listings.length > 0 && (
                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Nearby Listings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {listings.slice(0, 6).map(listing => (
                                <Link key={listing._id} to={`/listings/${listing._id}`}>
                                    <div className="card hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="font-medium text-gray-800 text-sm mb-1">{listing.title}</div>
                                        <div className="text-xs text-gray-500">📦 {listing.quantity} {listing.unit}</div>
                                        <div className="text-xs text-gray-500">📍 {listing.city}</div>
                                        <div className="mt-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${listing.foodType === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {listing.foodType}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
