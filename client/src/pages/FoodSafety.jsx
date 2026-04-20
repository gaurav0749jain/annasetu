import { useState } from 'react';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

export default function FoodSafety() {
    const [form, setForm] = useState({
        foodType: 'veg', category: 'cooked',
        preparedAt: '', storageMethod: 'room temperature',
        weather: 'normal', quantity: '10',
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const res = await API.post('/ai/safety', form);
            setResult(res.data.data);
        } catch (err) {
            setError('Safety check failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const riskColor = (risk) => {
        if (risk === 'low') return 'bg-green-100 text-green-700 border-green-200';
        if (risk === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🛡️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">AI Food Safety Checker</h1>
                    <p className="text-gray-500 text-sm">Check if your food is safe to donate using Gemini AI</p>
                </div>

                <div className="card mb-6">
                    <form onSubmit={handleCheck} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Food Type</label>
                                <select name="foodType" value={form.foodType} onChange={handleChange} className="input-field">
                                    <option value="veg">🟢 Vegetarian</option>
                                    <option value="non-veg">🔴 Non-Vegetarian</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" value={form.category} onChange={handleChange} className="input-field">
                                    {['cooked', 'raw', 'packaged', 'bakery', 'fruits', 'vegetables'].map(c => (
                                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prepared At</label>
                            <input
                                name="preparedAt" type="datetime-local"
                                value={form.preparedAt} onChange={handleChange}
                                required className="input-field"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Storage Method</label>
                                <select name="storageMethod" value={form.storageMethod} onChange={handleChange} className="input-field">
                                    <option value="room temperature">Room Temperature</option>
                                    <option value="refrigerated">Refrigerated</option>
                                    <option value="frozen">Frozen</option>
                                    <option value="hot case">Hot Case</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Weather</label>
                                <select name="weather" value={form.weather} onChange={handleChange} className="input-field">
                                    <option value="normal">Normal (25°C)</option>
                                    <option value="hot">Hot (35°C+)</option>
                                    <option value="very hot">Very Hot (40°C+)</option>
                                    <option value="cold">Cold (below 15°C)</option>
                                    <option value="humid">Humid / Rainy</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (plates/kg)</label>
                            <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="input-field" />
                        </div>

                        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                            {loading ? '🛡️ Checking with AI...' : '🛡️ Check Food Safety'}
                        </button>
                    </form>
                </div>

                {/* Result */}
                {result && (
                    <div className={`card border-2 ${riskColor(result.riskLevel)}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="text-4xl">
                                {result.riskLevel === 'low' ? '✅' : result.riskLevel === 'medium' ? '⚠️' : '❌'}
                            </div>
                            <div>
                                <div className="font-bold text-lg capitalize">{result.riskLevel} Risk</div>
                                <div className="text-sm">{result.recommendation}</div>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-current border-opacity-20">
                                <span className="font-medium">Safe for</span>
                                <span className="font-bold">{result.safeHours} hours ({result.safeUntil})</span>
                            </div>
                            <div className="py-2 border-b border-current border-opacity-20">
                                <div className="font-medium mb-1">Storage advice</div>
                                <div className="opacity-80">{result.storageAdvice}</div>
                            </div>
                            <div className="py-2">
                                <div className="font-medium mb-1">Warning signs to watch for</div>
                                <div className="opacity-80">{result.warningSign}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}