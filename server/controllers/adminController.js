const User = require('../models/User');
const Listing = require('../models/Listing');
const Pickup = require('../models/Pickup');

const getDashboardStats = async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalReceivers = await User.countDocuments({ role: 'receiver' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ status: 'available' });
    const totalDelivered = await Pickup.countDocuments({ status: 'delivered' });

    const totalMeals = await Listing.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$mealsCount' } } },
    ]);

    const topDonors = await Listing.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: '$donor', totalMeals: { $sum: '$mealsCount' }, count: { $sum: 1 } } },
        { $sort: { totalMeals: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'donor' } },
        { $unwind: '$donor' },
        { $project: { 'donor.name': 1, 'donor.city': 1, 'donor.donorType': 1, totalMeals: 1, count: 1 } },
    ]);

    res.json({
        stats: {
            totalUsers, totalDonors, totalReceivers, totalVolunteers,
            totalListings, activeListings, totalDelivered,
            totalMealsSaved: totalMeals[0]?.total || 0,
            co2Saved: ((totalMeals[0]?.total || 0) * 0.5 * 2.5).toFixed(2),
        },
        topDonors,
    });
};

const getAllUsers = async (req, res) => {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
        .select('-password -otp -refreshToken')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    const total = await User.countDocuments(filter);
    res.json({ users, total, totalPages: Math.ceil(total / limit) });
};

const updateUserStatus = async (req, res) => {
    const { isApproved } = req.body;
    const user = await User.findByIdAndUpdate(
        req.params.id,
        { isApproved },
        { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `User ${isApproved ? 'approved' : 'suspended'}`, user });
};

const deleteUser = async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
};

const getAllListings = async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};
    const listings = await Listing.find(filter)
        .populate('donor', 'name email city')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    const total = await Listing.countDocuments(filter);
    res.json({ listings, total, totalPages: Math.ceil(total / limit) });
};

const getPendingReceivers = async (req, res) => {
    const receivers = await User.find({
        role: 'receiver',
        isApproved: false,
    }).select('-password -otp -refreshToken');
    res.json(receivers);
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllListings,
    getPendingReceivers,
};