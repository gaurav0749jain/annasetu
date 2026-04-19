const Pickup = require('../models/Pickup');

const getMyPickups = async (req, res) => {
    const filter = {};
    if (req.user.role === 'donor') filter.donor = req.user._id;
    if (req.user.role === 'receiver') filter.receiver = req.user._id;
    if (req.user.role === 'volunteer') filter.volunteer = req.user._id;

    const pickups = await Pickup.find(filter)
        .populate('listing', 'title images foodType quantity unit')
        .populate('donor', 'name phone city')
        .populate('receiver', 'name phone city')
        .populate('volunteer', 'name phone')
        .sort({ createdAt: -1 });

    res.json(pickups);
};

const updatePickupStatus = async (req, res) => {
    const { status } = req.body;
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });

    pickup.status = status;
    pickup.statusHistory.push({ status, updatedBy: req.user._id });
    if (status === 'volunteer-assigned') pickup.volunteer = req.user._id;
    if (status === 'delivered') pickup.deliveredAt = new Date();
    await pickup.save();

    res.json({ message: 'Status updated', pickup });
};

const getAvailablePickups = async (req, res) => {
    const pickups = await Pickup.find({ status: 'confirmed', volunteer: null })
        .populate('listing', 'title pickupAddress city foodType quantity unit')
        .populate('donor', 'name phone')
        .populate('receiver', 'name phone');
    res.json(pickups);
};

module.exports = { getMyPickups, updatePickupStatus, getAvailablePickups };