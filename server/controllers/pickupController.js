const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { sendNotificationToUser, notifyPickupUpdate } = require('../utils/socketHandler');

const getMyPickups = async (req, res) => {
    try {
        const filter = {};
        if (req.user.role === 'donor') filter.donor = req.user._id;
        if (req.user.role === 'receiver') filter.receiver = req.user._id;
        if (req.user.role === 'volunteer') filter.volunteer = req.user._id;

        const pickups = await Pickup.find(filter)
            .populate('listing', 'title images foodType quantity unit pickupAddress')
            .populate('donor', 'name phone city email')
            .populate('receiver', 'name phone city email')
            .populate('volunteer', 'name phone email')
            .sort({ createdAt: -1 });

        res.json(pickups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updatePickupStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const pickup = await Pickup.findById(req.params.id)
            .populate('listing', 'title quantity mealsCount')
            .populate('donor', 'name email _id')
            .populate('receiver', 'name email _id')
            .populate('volunteer', 'name email _id');

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        // ── QR ENFORCEMENT ──────────────────────────────────────────
        // Volunteer cannot mark "in-transit" without scanning Pickup QR
        if (status === 'in-transit' && req.user.role === 'volunteer') {
            if (!pickup.pickupQRScanned) {
                return res.status(403).json({
                    message: 'You must scan the Pickup QR code first before marking as In Transit.',
                    requiresQR: true,
                    qrType: 'PICKUP',
                });
            }
        }

        // Volunteer/Receiver cannot mark "delivered" without scanning Delivery QR
        if (status === 'delivered') {
            if (!pickup.deliveryQRScanned) {
                return res.status(403).json({
                    message: 'The receiver must scan the Delivery QR code first to confirm delivery.',
                    requiresQR: true,
                    qrType: 'DELIVERY',
                });
            }
        }
        // ────────────────────────────────────────────────────────────

        pickup.status = status;
        pickup.statusHistory.push({ status, updatedBy: req.user._id });
        if (status === 'volunteer-assigned') pickup.volunteer = req.user._id;
        if (status === 'delivered') pickup.deliveredAt = new Date();
        await pickup.save();

        const listingTitle = pickup.listing?.title || 'Food Listing';
        const meals = pickup.listing?.mealsCount || pickup.listing?.quantity || 0;
        const donorId = pickup.donor?._id;
        const receiverId = pickup.receiver?._id;
        const volunteerId = pickup.volunteer?._id;

        notifyPickupUpdate(
            [donorId, receiverId, volunteerId].filter(Boolean),
            { pickupId: pickup._id, status, updatedAt: new Date() }
        );

        if (status === 'confirmed') {
            if (receiverId) {
                await sendNotificationToUser(receiverId, {
                    title: '✅ Claim confirmed!',
                    message: `${pickup.donor?.name} confirmed your claim for "${listingTitle}". A volunteer will be assigned soon.`,
                    type: 'confirmed',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (pickup.receiver?.email) {
                const tmpl = emailTemplates.pickupConfirmed(
                    pickup.receiver.name, listingTitle, pickup.donor?.name
                );
                await sendEmail({ to: pickup.receiver.email, ...tmpl });
            }
        }

        if (status === 'cancelled') {
            if (receiverId) {
                await sendNotificationToUser(receiverId, {
                    title: '❌ Claim rejected',
                    message: `Your claim for "${listingTitle}" was rejected by the donor.`,
                    type: 'system',
                    relatedListing: pickup.listing?._id,
                });
            }
        }

        if (status === 'volunteer-assigned') {
            const volunteerUser = await User.findById(req.user._id);
            const volunteerName = volunteerUser?.name || 'A volunteer';

            if (donorId) {
                await sendNotificationToUser(donorId, {
                    title: '🚗 Volunteer assigned!',
                    message: `${volunteerName} will pick up "${listingTitle}" from you.`,
                    type: 'confirmed',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (receiverId) {
                await sendNotificationToUser(receiverId, {
                    title: '🚗 Volunteer on the way!',
                    message: `${volunteerName} is picking up "${listingTitle}" for you.`,
                    type: 'confirmed',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (pickup.donor?.email) {
                const tmpl = emailTemplates.volunteerAssigned(
                    pickup.donor.name, listingTitle, volunteerName
                );
                await sendEmail({ to: pickup.donor.email, ...tmpl });
            }
            if (pickup.receiver?.email) {
                const tmpl = emailTemplates.volunteerAssigned(
                    pickup.receiver.name, listingTitle, volunteerName
                );
                await sendEmail({ to: pickup.receiver.email, ...tmpl });
            }
        }

        if (status === 'in-transit') {
            if (donorId) {
                await sendNotificationToUser(donorId, {
                    title: '🏃 Food is in transit!',
                    message: `"${listingTitle}" has been picked up and is on its way.`,
                    type: 'in-transit',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (receiverId) {
                await sendNotificationToUser(receiverId, {
                    title: '🏃 Food is on the way!',
                    message: `"${listingTitle}" has been picked up and will arrive soon!`,
                    type: 'in-transit',
                    relatedListing: pickup.listing?._id,
                });
            }
        }

        if (status === 'delivered') {
            if (donorId) {
                await sendNotificationToUser(donorId, {
                    title: '🎉 Food delivered!',
                    message: `"${listingTitle}" was delivered! You saved ${meals} meals. Check your impact report.`,
                    type: 'delivered',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (receiverId) {
                await sendNotificationToUser(receiverId, {
                    title: '🎉 Food received!',
                    message: `"${listingTitle}" has been delivered successfully!`,
                    type: 'delivered',
                    relatedListing: pickup.listing?._id,
                });
            }
            if (pickup.donor?.email) {
                const tmpl = emailTemplates.foodDelivered(
                    pickup.donor.name, pickup.receiver?.name, listingTitle, meals
                );
                await sendEmail({ to: pickup.donor.email, ...tmpl });
            }
        }

        res.json({ message: 'Status updated', pickup });
    } catch (err) {
        console.error('Pickup status error:', err);
        res.status(500).json({ message: err.message });
    }
};

const getAvailablePickups = async (req, res) => {
    try {
        const pickups = await Pickup.find({ status: 'confirmed', volunteer: null })
            .populate('listing', 'title pickupAddress city foodType quantity unit')
            .populate('donor', 'name phone')
            .populate('receiver', 'name phone');
        res.json(pickups);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMyPickups, updatePickupStatus, getAvailablePickups };