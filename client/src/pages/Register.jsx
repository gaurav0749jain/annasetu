import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

const donorTypes = ['individual', 'restaurant', 'event', 'office', 'college', 'other'];
const roles = [
    { value: 'donor', label: '🤝 Donor', desc: 'I want to donate food' },
    { value: 'receiver', label: '🏠 Receiver (NGO)', desc: 'I want to receive food for my organization' },
    { value: 'volunteer', label: '🚗 Volunteer', desc: 'I want to help with pickups and delivery' },
];

export default function Register() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        name: '', email: '', password: '', confirmPassword: '',
        role: 'donor', donorType: 'individual', phone: '', city: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            const res = await API.post('/auth/register', {
                name: form.name,
                email: form.email,
                password: form.password,
                role: form.role,
                donorType: form.role === 'donor' ? form.donorType : undefined,
                phone: form.phone,
                city: form.city,
            });
            navigate('/verify-otp', { state: { userId: res.data.userId, email: form.email } });
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-lg mx-auto px-4 py-12">
                <div className="card">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-2">🍱</div>
                        <h1 className="text-2xl font-bold text-gray-800">Join AnnaSetu</h1>
                        <p className="text-gray-500 text-sm mt-1">Create your free account</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Role Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
                            <div className="space-y-2">
                                {roles.map((r) => (
                                    <label key={r.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="radio" name="role" value={r.value} checked={form.role === r.value} onChange={handleChange} className="text-primary-600" />
                                        <div>
                                            <div className="font-medium text-sm">{r.label}</div>
                                            <div className="text-xs text-gray-500">{r.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Donor Type */}
                        {form.role === 'donor' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Donor Type</label>
                                <select name="donorType" value={form.donorType} onChange={handleChange} className="input-field">
                                    {donorTypes.map(t => (
                                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input name="name" value={form.name} onChange={handleChange} required placeholder="Your name" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit number" className="input-field" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="your@email.com" className="input-field" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input name="city" value={form.city} onChange={handleChange} required placeholder="e.g. Mumbai, Delhi" className="input-field" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 6 characters" className="input-field" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required placeholder="Repeat password" className="input-field" />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-4">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-medium hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}