const Listing = require('../models/Listing');
const Pickup = require('../models/Pickup');
const User = require('../models/User');
const { sendNotificationToUser, broadcastNewListing } = require('../utils/socketHandler');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

const createListing = async (req, res) => {
    try {
        const {
            title, description, foodType, category, listingType,
            eventDetails, quantity, unit, pickupAddress, city,
            pickupFrom, pickupUntil, safetyWindow, tags,
            longitude, latitude, mealsCount,
        } = req.body;

        const images = req.files ? req.files.map(f => f.path) : [];

        const listing = await Listing.create({
            donor: req.user._id,
            title, description, foodType,
            category: category || 'cooked',
            listingType: listingType || 'regular',
            eventDetails: listingType === 'event' ? eventDetails : undefined,
            quantity, unit: unit || 'plates',
            images, pickupAddress, city,
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude) || 0, parseFloat(latitude) || 0],
            },
            pickupFrom, pickupUntil, safetyWindow,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            mealsCount: mealsCount || quantity,
        });

        // Notify all receivers about new listing
        const receivers = await User.find({ role: 'receiver', isApproved: true });
        for (const receiver of receivers) {
            await sendNotificationToUser(receiver._id, {
                title: '🍱 New Food Available!',
                message: `${req.user.name} listed "${title}" in ${city} — ${quantity} ${unit || 'plates'}`,
                type: 'new-listing',
                relatedListing: listing._id,
            });
        }

        // Broadcast to all connected users
        broadcastNewListing({
            listingId: listing._id,
            title: listing.title,
            city: listing.city,
            foodType: listing.foodType,
            quantity: listing.quantity,
            donorName: req.user.name,
        });

        res.status(201).json(listing);
    } catch (err) {
        console.error('Create listing error:', err);
        res.status(500).json({ message: err.message });
    }
};

const getListings = async (req, res) => {
    try {
        const { city, foodType, category, status, page = 1, limit = 10 } = req.query;
        const filter = {};
        if (city) filter.city = { $regex: city, $options: 'i' };
        if (foodType) filter.foodType = foodType;
        if (category) filter.category = category;
        filter.status = status || 'available';
        filter.pickupUntil = { $gte: new Date() };

        const listings = await Listing.find(filter)
            .populate('donor', 'name donorType city avatar')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Listing.countDocuments(filter);

        res.json({
            listings,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getNearbyListings = async (req, res) => {
    try {
        const { longitude, latitude, radius = 10 } = req.query;
        const listings = await Listing.find({
            status: 'available',
            pickupUntil: { $gte: new Date() },
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: radius * 1000,
                },
            },
        }).populate('donor', 'name donorType city avatar');
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const getListingById = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('donor', 'name email phone donorType city avatar')
            .populate('claimedBy', 'name email');
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const claimListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('donor', 'name email');
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.status !== 'available') {
            return res.status(400).json({ message: 'Listing is no longer available' });
        }

        listing.status = 'claimed';
        listing.claimedBy = req.user._id;
        await listing.save();

        const pickup = await Pickup.create({
            listing: listing._id,
            donor: listing.donor._id,
            receiver: req.user._id,
            pickupAddress: listing.pickupAddress || '',
            deliveryAddress: req.body?.deliveryAddress || '',
        });

        // Notify donor in real-time
        await sendNotificationToUser(listing.donor._id, {
            title: '🤝 Your food was claimed!',
            message: `${req.user.name} claimed "${listing.title}". Please confirm or reject from your dashboard.`,
            type: 'claim',
            relatedListing: listing._id,
        });

        // Send email to donor
        if (listing.donor?.email) {
            const tmpl = emailTemplates.pickupClaimed(
                listing.donor.name,
                listing.title,
                req.user.name
            );
            await sendEmail({ to: listing.donor.email, ...tmpl });
        }

        res.json({ message: 'Listing claimed successfully', listing, pickup });
    } catch (error) {
        console.error('Claim error:', error);
        res.status(500).json({ message: error.message || 'Failed to claim listing' });
    }
};

const getMyListings = async (req, res) => {
    try {
        const listings = await Listing.find({ donor: req.user._id })
            .sort({ createdAt: -1 });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const deleteListing = async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.donor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await listing.deleteOne();
        res.json({ message: 'Listing deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createListing, getListings, getNearbyListings,
    getListingById, claimListing, getMyListings, deleteListing,
};