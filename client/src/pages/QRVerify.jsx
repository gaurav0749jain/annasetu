import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/axios';
import Navbar from '../components/Navbar';
import jsQR from 'jsqr';

export default function QRVerify() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [manualToken, setManualToken] = useState('');
    const [manualType, setManualType] = useState('PICKUP');
    const [cameraError, setCameraError] = useState('');
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setScanning(true);
                scanQR();
            }
        } catch (err) {
            setCameraError('Camera not available. Use manual token entry below.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
        }
        setScanning(false);
    };

    const scanQR = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        const scan = () => {
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                if (code) {
                    stopCamera();
                    try {
                        const data = JSON.parse(code.data);
                        verifyToken(data.token, data.type);
                    } catch {
                        setError('Invalid QR code format');
                    }
                    return;
                }
            }
            animFrameRef.current = requestAnimationFrame(scan);
        };
        scan();
    };

    useEffect(() => {
        return () => stopCamera();
    }, []);

    const verifyToken = async (token, type) => {
        setLoading(true);
        setError('');
        try {
            const res = await API.post('/qr/verify', { token, type });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleManualVerify = (e) => {
        e.preventDefault();
        if (!manualToken.trim()) return;
        verifyToken(manualToken.trim(), manualType);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="max-w-lg mx-auto px-4 py-8">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">📱</div>
                    <h1 className="text-2xl font-bold text-gray-800">QR Verification</h1>
                    <p className="text-gray-500 text-sm mt-1">Scan QR code to verify pickup or delivery</p>
                </div>

                {/* Result */}
                {result && (
                    <div className={`card mb-6 text-center ${result.success ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                        <div className="text-5xl mb-3">{result.success ? '✅' : '❌'}</div>
                        <h2 className="text-xl font-bold mb-2" style={{ color: result.success ? '#166534' : '#991b1b' }}>
                            {result.message}
                        </h2>

                        {result.success && result.pickup && (
                            <div className="text-left bg-white rounded-xl p-4 mt-4 space-y-2 text-sm">
                                {result.pickup.listing?.images?.[0] && (
                                    <img src={result.pickup.listing.images[0]} alt="food" className="w-full h-32 object-cover rounded-lg mb-3" />
                                )}
                                <div className="font-semibold text-gray-800 text-base">{result.pickup.listing?.title}</div>
                                <div className="text-gray-600">📦 {result.pickup.listing?.quantity} {result.pickup.listing?.unit}</div>

                                {result.type === 'PICKUP' && (
                                    <>
                                        <div className="text-gray-600">🤝 Donor: <strong>{result.pickup.donor?.name}</strong></div>
                                        <div className="text-gray-600">📍 {result.pickup.listing?.pickupAddress}</div>
                                        <div className="text-green-700 font-medium">✅ Pickup verified at {new Date(result.pickup.scannedAt).toLocaleTimeString()}</div>
                                        <div className="bg-blue-50 rounded-lg p-3 mt-2 text-xs text-blue-700">
                                            Status updated to <strong>In Transit</strong>. Donor and receiver have been notified.
                                        </div>
                                    </>
                                )}

                                {result.type === 'DELIVERY' && (
                                    <>
                                        <div className="text-gray-600">🏠 Receiver: <strong>{result.pickup.receiver?.name}</strong></div>
                                        <div className="text-green-700 font-medium">🎉 {result.pickup.mealsDelivered} meals delivered!</div>
                                        <div className="text-green-600 font-medium">🌱 CO₂ saved: {(result.pickup.mealsDelivered * 0.5 * 2.5).toFixed(1)} kg</div>
                                        <div className="bg-green-50 rounded-lg p-3 mt-2 text-xs text-green-700">
                                            Delivery confirmed! Donor has been notified and impact recorded.
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 mt-4 justify-center">
                            <button onClick={() => { setResult(null); setError(''); setManualToken(''); }} className="btn-secondary text-sm px-6">
                                Scan Another
                            </button>
                            <button onClick={() => navigate('/dashboard')} className="btn-primary text-sm px-6">
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                )}

                {!result && (
                    <>
                        {/* Camera Scanner */}
                        <div className="card mb-4">
                            <h2 className="font-semibold text-gray-800 mb-3 text-center">📷 Camera Scanner</h2>

                            {cameraError ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 text-center">
                                    {cameraError}
                                </div>
                            ) : (
                                <>
                                    <div className="relative bg-black rounded-xl overflow-hidden mb-3" style={{ height: '240px' }}>
                                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                                        <canvas ref={canvasRef} className="hidden" />
                                        {scanning && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="border-2 border-primary-400 w-48 h-48 rounded-xl opacity-70">
                                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                                                </div>
                                                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary-500 opacity-70 animate-pulse"></div>
                                            </div>
                                        )}
                                        {!scanning && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white text-center">
                                                <div>
                                                    <div className="text-4xl mb-2">📷</div>
                                                    <div className="text-sm">Camera not started</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!scanning ? (
                                        <button onClick={startCamera} className="btn-primary w-full py-3">
                                            📷 Start Camera Scanner
                                        </button>
                                    ) : (
                                        <button onClick={stopCamera} className="btn-danger w-full py-2">
                                            Stop Camera
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Manual Entry */}
                        <div className="card">
                            <h2 className="font-semibold text-gray-800 mb-3">⌨️ Manual Token Entry</h2>
                            <p className="text-xs text-gray-500 mb-3">If camera doesn't work, enter the token from the QR details manually</p>
                            <form onSubmit={handleManualVerify} className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">QR Type</label>
                                    <select value={manualType} onChange={e => setManualType(e.target.value)} className="input-field">
                                        <option value="PICKUP">Pickup QR (Volunteer scans at donor)</option>
                                        <option value="DELIVERY">Delivery QR (Receiver scans on delivery)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                                    <input
                                        value={manualToken}
                                        onChange={e => setManualToken(e.target.value)}
                                        placeholder="Paste the QR token here..."
                                        className="input-field font-mono text-xs"
                                    />
                                </div>
                                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
                                <button type="submit" disabled={!manualToken.trim() || loading} className="btn-primary w-full py-3">
                                    {loading ? 'Verifying...' : '✓ Verify Token'}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}