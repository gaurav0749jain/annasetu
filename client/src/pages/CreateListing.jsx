import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

export default function CreateListing() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [images, setImages] = useState([]);
    const [locationStatus, setLocationStatus] = useState('Getting your location...');
    const [form, setForm] = useState({
        title: '', description: '', foodType: 'veg', category: 'cooked',
        listingType: 'regular', quantity: '', unit: 'plates',
        pickupAddress: '', city: '', pickupFrom: '', pickupUntil: '',
        tags: '', eventType: '', guestCount: '',
        latitude: '', longitude: '',
    });

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setForm(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude.toString(),
                        longitude: pos.coords.longitude.toString(),
                    }));
                    setLocationStatus('✅ Location captured automatically');
                },
                (err) => {
                    setLocationStatus('📍 Location not available — enter manually below');
                    console.log('Geolocation denied:', err.message);
                },
                { timeout: 10000 }
            );
        } else {
            setLocationStatus('📍 Geolocation not supported — enter manually below');
        }
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleAIAutofill = async () => {
        if (!form.title) { setError('Enter food name first'); return; }
        setAiLoading(true);
        try {
            const res = await API.post('/ai/autofill', {
                foodName: form.title,
                quantity: form.quantity || 10,
                unit: form.unit,
                donorType: 'individual',
                listingType: form.listingType,
                eventType: form.eventType,
            });
            const data = res.data.data;
            setForm(prev => ({
                ...prev,
                title: data.title || prev.title,
                description: data.description || prev.description,
                category: data.category || prev.category,
                tags: data.tags?.join(', ') || prev.tags,
            }));
            setSuccess('✨ AI filled in the details!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('AI autofill failed. Fill manually.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleImageAnalyze = async () => {
        if (!images[0]) { setError('Upload an image first'); return; }
        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', images[0]);
            const res = await API.post('/ai/analyze-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const data = res.data.data;
            setForm(prev => ({
                ...prev,
                title: prev.title || data.foodName,
                description: prev.description || data.description,
                category: data.category || prev.category,
                foodType: data.foodType || prev.foodType,
                tags: data.tags?.join(', ') || prev.tags,
                quantity: prev.quantity || data.estimatedServings?.toString(),
            }));
            setSuccess(`📸 AI detected: ${data.foodName} — ${data.freshnessLevel} freshness (${data.freshnessScore}%)`);
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            setError('Image analysis failed');
        } finally {
            setImageLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.latitude || !form.longitude) {
            setError('Please allow location access or enter coordinates manually');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            Object.keys(form).forEach(key => {
                if (form[key] !== '') formData.append(key, form[key]);
            });
            images.forEach(img => formData.append('images', img));
            if (form.listingType === 'event') {
                formData.append('eventDetails[eventType]', form.eventType);
                formData.append('eventDetails[guestCount]', form.guestCount);
            }
            await API.post('/listings', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create listing');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="card">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Donate Food 🍱</h1>
                    <p className="text-gray-500 text-sm mb-6">Fill in details or let AI do it for you</p>

                    {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4">{success}</div>}

                    {/* Location status */}
                    <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${form.latitude ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}>
                        {locationStatus}
                        {form.latitude && (
                            <span className="ml-2 text-xs opacity-75">({parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)})</span>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Listing Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                            <div className="flex gap-3">
                                {['regular', 'event'].map(t => (
                                    <label key={t} className={`flex-1 p-3 border rounded-lg cursor-pointer text-center text-sm font-medium transition-colors ${form.listingType === t ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'}`}>
                                        <input type="radio" name="listingType" value={t} checked={form.listingType === t} onChange={handleChange} className="hidden" />
                                        {t === 'regular' ? '🍽️ Regular' : '🎉 Event/Party'}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Event Fields */}
                        {form.listingType === 'event' && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50 rounded-lg">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
                                    <input name="eventType" value={form.eventType} onChange={handleChange} placeholder="Wedding, Birthday..." className="input-field text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Guest Count</label>
                                    <input name="guestCount" type="number" value={form.guestCount} onChange={handleChange} placeholder="100" className="input-field text-sm" />
                                </div>
                            </div>
                        )}

                        {/* Food Name + AI */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Food Name</label>
                            <div className="flex gap-2">
                                <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Dal Makhani, Biryani..." className="input-field flex-1" />
                                <button type="button" onClick={handleAIAutofill} disabled={aiLoading} className="btn-secondary text-sm px-3 whitespace-nowrap">
                                    {aiLoading ? '...' : '✨ AI Fill'}
                                </button>
                            </div>
                        </div>

                        {/* Image Upload + AI Analyze */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Food Photos</label>
                            <div className="flex gap-2">
                                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="input-field flex-1 text-sm" />
                                <button type="button" onClick={handleImageAnalyze} disabled={imageLoading || !images.length} className="btn-secondary text-sm px-3 whitespace-nowrap">
                                    {imageLoading ? '...' : '📸 Analyze'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Upload a photo and click Analyze — AI will fill in food details automatically</p>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Describe the food — taste, portions, any allergens..." className="input-field resize-none" />
                        </div>

                        {/* Food Type + Category */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                                <select name="foodType" value={form.foodType} onChange={handleChange} className="input-field">
                                    <option value="veg">🟢 Veg</option>
                                    <option value="non-veg">🔴 Non-Veg</option>
                                    <option value="both">🟡 Both</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" value={form.category} onChange={handleChange} className="input-field">
                                    {['cooked', 'raw', 'packaged', 'bakery', 'fruits', 'vegetables', 'other'].map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Quantity + Unit */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input name="quantity" type="number" value={form.quantity} onChange={handleChange} required placeholder="e.g. 50" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                <select name="unit" value={form.unit} onChange={handleChange} className="input-field">
                                    {['plates', 'kg', 'litres', 'packets', 'boxes', 'items'].map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                            <input name="pickupAddress" value={form.pickupAddress} onChange={handleChange} required placeholder="Full address for pickup" className="input-field" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input name="city" value={form.city} onChange={handleChange} required placeholder="e.g. Mumbai, Delhi, Muzaffarnagar" className="input-field" />
                        </div>

                        {/* Manual coordinates if location denied */}
                        {!form.latitude && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Latitude (manual)</label>
                                    <input name="latitude" value={form.latitude} onChange={handleChange} placeholder="e.g. 28.6139" className="input-field text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Longitude (manual)</label>
                                    <input name="longitude" value={form.longitude} onChange={handleChange} placeholder="e.g. 77.2090" className="input-field text-sm" />
                                </div>
                                <p className="col-span-2 text-xs text-yellow-700">💡 Search your city on Google Maps → right click → copy coordinates</p>
                            </div>
                        )}

                        {/* Pickup Times */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup From</label>
                                <input name="pickupFrom" type="datetime-local" value={form.pickupFrom} onChange={handleChange} required className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Until</label>
                                <input name="pickupUntil" type="datetime-local" value={form.pickupUntil} onChange={handleChange} required className="input-field" />
                            </div>
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                            <input name="tags" value={form.tags} onChange={handleChange} placeholder="homemade, fresh, no-spice..." className="input-field" />
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                            {loading ? 'Creating listing...' : '🍱 Post Food Donation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}