const Pickup = require('../models/Pickup');
const { generateQRToken, generateQRCodeImage } = require('../utils/qrGenerator');
const { sendNotificationToUser } = require('../utils/socketHandler');

// Generate QR codes for a pickup (called when volunteer is assigned)
const generatePickupQR = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .populate('listing', 'title pickupAddress city')
            .populate('donor', 'name')
            .populate('receiver', 'name');

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        // Only generate if not already generated
        if (!pickup.pickupQRToken) {
            pickup.pickupQRToken = generateQRToken();
        }
        if (!pickup.deliveryQRToken) {
            pickup.deliveryQRToken = generateQRToken();
        }
        await pickup.save();

        // Generate QR code images
        const pickupQRData = {
            type: 'PICKUP',
            pickupId: pickup._id.toString(),
            token: pickup.pickupQRToken,
            listingTitle: pickup.listing?.title,
            donorName: pickup.donor?.name,
            address: pickup.listing?.pickupAddress,
        };

        const deliveryQRData = {
            type: 'DELIVERY',
            pickupId: pickup._id.toString(),
            token: pickup.deliveryQRToken,
            listingTitle: pickup.listing?.title,
            receiverName: pickup.receiver?.name,
        };

        const pickupQRImage = await generateQRCodeImage(pickupQRData);
        const deliveryQRImage = await generateQRCodeImage(deliveryQRData);

        res.json({
            pickupQR: {
                image: pickupQRImage,
                token: pickup.pickupQRToken,
                scanned: pickup.pickupQRScanned,
                scannedAt: pickup.pickupQRScannedAt,
            },
            deliveryQR: {
                image: deliveryQRImage,
                token: pickup.deliveryQRToken,
                scanned: pickup.deliveryQRScanned,
                scannedAt: pickup.deliveryQRScannedAt,
            },
        });
    } catch (err) {
        console.error('Generate QR error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Verify QR scan — called when volunteer/receiver scans QR
const verifyQR = async (req, res) => {
    try {
        const { token, type } = req.body;

        if (!token || !type) {
            return res.status(400).json({ message: 'Token and type are required' });
        }

        let pickup;

        if (type === 'PICKUP') {
            pickup = await Pickup.findOne({ pickupQRToken: token })
                .populate('listing', 'title pickupAddress city foodType quantity unit images')
                .populate('donor', 'name phone city')
                .populate('receiver', 'name phone')
                .populate('volunteer', 'name phone');

            if (!pickup) {
                return res.status(404).json({ success: false, message: 'Invalid QR code' });
            }

            if (pickup.pickupQRScanned) {
                return res.status(400).json({
                    success: false,
                    message: 'This QR code has already been scanned',
                    scannedAt: pickup.pickupQRScannedAt,
                });
            }

            // Mark as scanned
            pickup.pickupQRScanned = true;
            pickup.pickupQRScannedAt = new Date();
            pickup.pickupQRScannedBy = req.user._id;
            pickup.status = 'in-transit';
            pickup.statusHistory.push({ status: 'in-transit', updatedBy: req.user._id });
            await pickup.save();

            // Notify donor and receiver
            await sendNotificationToUser(pickup.donor._id, {
                title: '📱 QR Scanned — Pickup Verified!',
                message: `Volunteer verified pickup of "${pickup.listing?.title}". Food is now in transit!`,
                type: 'in-transit',
                relatedListing: pickup.listing?._id,
            });

            await sendNotificationToUser(pickup.receiver._id, {
                title: '🏃 Food is on the way!',
                message: `Volunteer has picked up "${pickup.listing?.title}" and is heading to you.`,
                type: 'in-transit',
                relatedListing: pickup.listing?._id,
            });

            return res.json({
                success: true,
                message: 'Pickup verified successfully!',
                type: 'PICKUP',
                pickup: {
                    id: pickup._id,
                    listing: pickup.listing,
                    donor: pickup.donor,
                    receiver: pickup.receiver,
                    status: pickup.status,
                    scannedAt: pickup.pickupQRScannedAt,
                },
            });
        }

        if (type === 'DELIVERY') {
            pickup = await Pickup.findOne({ deliveryQRToken: token })
                .populate('listing', 'title quantity mealsCount unit images')
                .populate('donor', 'name phone email')
                .populate('receiver', 'name phone')
                .populate('volunteer', 'name phone');

            if (!pickup) {
                return res.status(404).json({ success: false, message: 'Invalid QR code' });
            }

            if (pickup.deliveryQRScanned) {
                return res.status(400).json({
                    success: false,
                    message: 'This QR code has already been scanned',
                    scannedAt: pickup.deliveryQRScannedAt,
                });
            }

            // Mark delivery complete
            pickup.deliveryQRScanned = true;
            pickup.deliveryQRScannedAt = new Date();
            pickup.deliveryQRScannedBy = req.user._id;
            pickup.status = 'delivered';
            pickup.deliveredAt = new Date();
            pickup.statusHistory.push({ status: 'delivered', updatedBy: req.user._id });
            await pickup.save();

            const meals = pickup.listing?.mealsCount || pickup.listing?.quantity || 0;

            // Notify donor
            await sendNotificationToUser(pickup.donor._id, {
                title: '🎉 Delivery Confirmed via QR!',
                message: `"${pickup.listing?.title}" was delivered and verified! You saved ${meals} meals. 🍱`,
                type: 'delivered',
                relatedListing: pickup.listing?._id,
            });

            return res.json({
                success: true,
                message: 'Delivery confirmed successfully!',
                type: 'DELIVERY',
                pickup: {
                    id: pickup._id,
                    listing: pickup.listing,
                    donor: pickup.donor,
                    receiver: pickup.receiver,
                    mealsDelivered: meals,
                    status: pickup.status,
                    scannedAt: pickup.deliveryQRScannedAt,
                },
            });
        }

        res.status(400).json({ message: 'Invalid QR type' });
    } catch (err) {
        console.error('Verify QR error:', err);
        res.status(500).json({ message: err.message });
    }
};

// Get QR status for a pickup
const getQRStatus = async (req, res) => {
    try {
        const pickup = await Pickup.findById(req.params.id)
            .select('pickupQRScanned deliveryQRScanned pickupQRScannedAt deliveryQRScannedAt status');

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        res.json({
            pickupQRScanned: pickup.pickupQRScanned,
            pickupQRScannedAt: pickup.pickupQRScannedAt,
            deliveryQRScanned: pickup.deliveryQRScanned,
            deliveryQRScannedAt: pickup.deliveryQRScannedAt,
            status: pickup.status,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { generatePickupQR, verifyQR, getQRStatus };