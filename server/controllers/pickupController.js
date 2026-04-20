const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const getMyPickups = async (req, res) => {
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
};

const updatePickupStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const pickup = await Pickup.findById(req.params.id)
            .populate('listing', 'title quantity mealsCount')
            .populate('donor', 'name email')
            .populate('receiver', 'name email')
            .populate('volunteer', 'name email');

        if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

        pickup.status = status;
        pickup.statusHistory.push({ status, updatedBy: req.user._id });
        if (status === 'volunteer-assigned') pickup.volunteer = req.user._id;
        if (status === 'delivered') pickup.deliveredAt = new Date();
        await pickup.save();

        const listingTitle = pickup.listing?.title || 'Food Listing';
        const meals = pickup.listing?.mealsCount || pickup.listing?.quantity || 0;

        // Send email notifications based on status
        if (status === 'confirmed') {
            if (pickup.receiver?.email) {
                const tmpl = emailTemplates.pickupConfirmed(
                    pickup.receiver.name, listingTitle, pickup.donor?.name
                );
                await sendEmail({ to: pickup.receiver.email, ...tmpl });
            }
        }

        if (status === 'volunteer-assigned') {
            const volunteerUser = await User.findById(req.user._id);
            const volunteerName = volunteerUser?.name || 'A volunteer';

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

        if (status === 'delivered') {
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
    const pickups = await Pickup.find({ status: 'confirmed', volunteer: null })
        .populate('listing', 'title pickupAddress city foodType quantity unit')
        .populate('donor', 'name phone')
        .populate('receiver', 'name phone');
    res.json(pickups);
};

module.exports = { getMyPickups, updatePickupStatus, getAvailablePickups };