const QRCode = require('qrcode');
const crypto = require('crypto');

const generateQRToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const generateQRCodeImage = async (data) => {
    try {
        const qrDataURL = await QRCode.toDataURL(JSON.stringify(data), {
            width: 300,
            margin: 2,
            color: {
                dark: '#166534',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'H',
        });
        return qrDataURL;
    } catch (err) {
        throw new Error('QR generation failed: ' + err.message);
    }
};

module.exports = { generateQRToken, generateQRCodeImage };