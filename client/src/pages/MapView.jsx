import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

// Fix for default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com',
    iconUrl: 'https://unpkg.com',
    shadowUrl: 'https://unpkg.com',
});

// Custom Icons for Veg and Non-Veg
const vegIcon = new L.Icon({
    iconUrl: 'https://githubusercontent.com',
    shadowUrl: 'https://unpkg.com',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

const nonVegIcon = new L.Icon({
    iconUrl: 'https://githubusercontent.com',
    shadowUrl: 'https://unpkg.com',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

function RecenterMap({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 12);
        }
    }, [center, map]);
    return null;
}

export default function MapView() {
    const [listings, setListings] = useState([]);
    const [allListings, setAllListings] = useState([]);
    const [userLocation, setUserLocation] = useState([20.5937, 78.9629]);
    const [locationFound, setLocationFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [radius, setRadius] = useState(50);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation([pos.coords.latitude, pos.coords.longitude]);
                    setLocationFound(true);
                },
                () => setLocationFound(false),
                { timeout: 8000 }
            );
        }
    }, []);

    useEffect(() => {
        fetchListings();
    }, [userLocation, radius]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            const [nearbyRes, allRes] = await Promise.all([
                API.get(`/listings/nearby?latitude=${userLocation[0]}&longitude=${userLocation[1]}&radius=${radius}`),
                API.get('/listings?limit=50'),
            ]);

            const nearby = nearbyRes.data || [];
            const all = allRes.data?.listings || [];

            const withCoords = nearby.filter(l =>
                l.location?.coordinates &&
                l.location.coordinates[0] !== 0 &&
                l.location.coordinates[1] !== 0
            );

            setListings(withCoords);
            setAllListings(all);
        } catch (err) {
            console.error("Fetch error:", err);
            try {
                const res = await API.get('/listings?limit=50');
                setAllListings(res.data?.listings || []);
            } catch (e) {
                console.error("Fallback fetch error:", e);
            }
        } finally {
            setLoading(false);
        }
    };

    const timeLeft = (until) => {
        const diff = new Date(until) - new Date();
        if (diff < 0) return 'Expired';
        const hours = Math.floor(diff / 3600000);
        if (hours > 0) return `${hours}h left`;
        return `${Math.floor(diff / 60000)}m left`;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Food Map 🗺️</h1>
                        <p className="text-gray-500 text-sm">
                            {locationFound
                                ? `📍 Showing listings within ${radius}km of you`
                                : '📍 Location not available — showing all listings'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-600 font-medium">Radius:</label>
                        <select
                            value={radius}
                            onChange={e => setRadius(Number(e.target.value))}
                            className="border border-gray-300 rounded-md p-1 w-28 text-sm outline-none"
                        >
                            <option value={5}>5 km</option>
                            <option value={10}>10 km</option>
                            <option value={25}>25 km</option>
                            <option value={50}>50 km</option>
                            <option value={100}>100 km</option>
                        </select>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-4 mb-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">🟢 = Veg</span>
                    <span className="flex items-center gap-1">🔴 = Non-veg</span>
                </div>

                {/* Map */}
                <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '450px' }}>
                    <MapContainer center={userLocation} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                        />
                        <RecenterMap center={userLocation} />

                        {listings.map((listing) => (
                            <Marker
                                key={listing._id}
                                position={[
                                    listing.location.coordinates[1], // Latitude
                                    listing.location.coordinates[0], // Longitude
                                ]}
                                icon={listing.foodType === 'veg' ? vegIcon : nonVegIcon}
                            >
                                <Popup maxWidth={220}>
                                    <div style={{ minWidth: '180px' }}>
                                        {listing.images?.[0] && (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px' }}
                                            />
                                        )}
                                        <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{listing.title}</div>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                                            {listing.foodType === 'veg' ? '🟢' : '🔴'} {listing.foodType} · {listing.category}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                                            📦 {listing.quantity} {listing.unit}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '2px' }}>
                                            📍 {listing.city}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#f97316', marginBottom: '8px' }}>
                                            ⏰ {timeLeft(listing.pickupUntil)}
                                        </div>

                                        <Link
                                            to={`/listings/${listing._id}`}
                                            style={{
                                                display: 'block',
                                                background: '#16a34a',
                                                color: 'white',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                textDecoration: 'none',
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                fontWeight: 500
                                            }}
                                        >
                                            View & Claim →
                                        </Link>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </div>
    );
}
