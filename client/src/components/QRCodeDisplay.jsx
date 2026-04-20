import { useState, useEffect } from 'react';
import API from '../utils/axios';

export default function QRCodeDisplay({ pickupId, userRole }) {
    const [qrData, setQrData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [show, setShow] = useState(false);

    const fetchQR = async () => {
        setLoading(true);
        try {
            const res = await API.get(`/qr/generate/${pickupId}`);
            setQrData(res.data);
        } catch (err) {
            setError('Could not generate QR code');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (show && !qrData) fetchQR();
    }, [show]);

    const handleDownload = (imageData, filename) => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = filename;
        link.click();
    };

    return (
        <div className="mt-3">
            <button
                onClick={() => setShow(!show)}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
                <span>📱</span>
                {show ? 'Hide QR Codes' : 'Show QR Codes'}
            </button>

            {show && (
                <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                    {loading && (
                        <div className="flex justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-600 text-sm text-center py-4">{error}</div>
                    )}

                    {qrData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pickup QR */}
                            <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
                                <div className="font-semibold text-gray-800 mb-1 text-sm">📦 Pickup QR</div>
                                <div className="text-xs text-gray-500 mb-3">
                                    {userRole === 'donor' ? 'Show this to the volunteer when they arrive' : 'Scan this at donor\'s location'}
                                </div>
                                {qrData.pickupQR.scanned ? (
                                    <div className="py-4">
                                        <div className="text-3xl mb-2">✅</div>
                                        <div className="text-green-700 font-medium text-sm">Pickup Verified!</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Scanned at {new Date(qrData.pickupQR.scannedAt).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src={qrData.pickupQR.image}
                                            alt="Pickup QR"
                                            className="w-40 h-40 mx-auto rounded-lg border-4 border-primary-100"
                                        />
                                        <div className="mt-2 text-xs text-gray-400 font-mono break-all px-2">
                                            {qrData.pickupQR.token.substring(0, 20)}...
                                        </div>
                                        <button
                                            onClick={() => handleDownload(qrData.pickupQR.image, 'pickup-qr.png')}
                                            className="mt-2 text-xs text-primary-600 hover:underline"
                                        >
                                            ⬇️ Download QR
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Delivery QR */}
                            <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
                                <div className="font-semibold text-gray-800 mb-1 text-sm">🎉 Delivery QR</div>
                                <div className="text-xs text-gray-500 mb-3">
                                    {userRole === 'receiver' ? 'Scan this when food arrives to confirm delivery' : 'Give this to the receiver for delivery confirmation'}
                                </div>
                                {qrData.deliveryQR.scanned ? (
                                    <div className="py-4">
                                        <div className="text-3xl mb-2">🎉</div>
                                        <div className="text-green-700 font-medium text-sm">Delivery Confirmed!</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Scanned at {new Date(qrData.deliveryQR.scannedAt).toLocaleString()}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <img
                                            src={qrData.deliveryQR.image}
                                            alt="Delivery QR"
                                            className="w-40 h-40 mx-auto rounded-lg border-4 border-green-100"
                                        />
                                        <div className="mt-2 text-xs text-gray-400 font-mono break-all px-2">
                                            {qrData.deliveryQR.token.substring(0, 20)}...
                                        </div>
                                        <button
                                            onClick={() => handleDownload(qrData.deliveryQR.image, 'delivery-qr.png')}
                                            className="mt-2 text-xs text-primary-600 hover:underline"
                                        >
                                            ⬇️ Download QR
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                        <strong>How it works:</strong>
                        <br />1. Volunteer scans <strong>Pickup QR</strong> at donor's location → Status becomes "In Transit"
                        <br />2. Receiver scans <strong>Delivery QR</strong> when food arrives → Status becomes "Delivered"
                        <br />Each QR can only be scanned once for security.
                    </div>
                </div>
            )}
        </div>
    );
}