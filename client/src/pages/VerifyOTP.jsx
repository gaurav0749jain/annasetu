import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/axios';
import Navbar from '../components/Navbar';

export default function VerifyOTP() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!state?.userId) {
            navigate('/register');
            return;
        }
        setLoading(true);
        try {
            const res = await API.post('/auth/verify-otp', {
                userId: state.userId,
                otp,
            });
            login(res.data.user, res.data.accessToken, res.data.refreshToken);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-md mx-auto px-4 py-16">
                <div className="card text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        We sent a 6-digit OTP to <strong>{state?.email}</strong>. Check your inbox!
                    </p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-4">
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => { setOtp(e.target.value); setError(''); }}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            className="input-field text-center text-2xl tracking-widest font-mono"
                            required
                        />
                        <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full py-3">
                            {loading ? 'Verifying...' : 'Verify OTP ✓'}
                        </button>
                    </form>

                    <p className="text-xs text-gray-400 mt-4">
                        Didn't receive it? Check your spam folder or{' '}
                        <button className="text-primary-600 hover:underline">resend OTP</button>
                    </p>
                </div>
            </div>
        </div>
    );
}