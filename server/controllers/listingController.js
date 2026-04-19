const Listing = require('../models/Listing');
const Pickup = require('../models/Pickup');

const createListing = async (req, res) => {
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

    res.status(201).json(listing);
};

const getListings = async (req, res) => {
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
};

const getNearbyListings = async (req, res) => {
    const { longitude, latitude, radius = 10 } = req.query;
    const listings = await Listing.find({
        status: 'available',
        pickupUntil: { $gte: new Date() },
        location: {
            $near: {
                $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                $maxDistance: radius * 1000,
            },
        },
    }).populate('donor', 'name donorType city avatar');

    res.json(listings);
};

const getListingById = async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate('donor', 'name email phone donorType city avatar')
        .populate('claimedBy', 'name email');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
};

const claimListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.status !== 'available') {
        return res.status(400).json({ message: 'Listing is no longer available' });
    }

    listing.status = 'claimed';
    listing.claimedBy = req.user._id;
    await listing.save();

    await Pickup.create({
        listing: listing._id,
        donor: listing.donor,
        receiver: req.user._id,
        pickupAddress: listing.pickupAddress,
        deliveryAddress: req.body.deliveryAddress || '',
    });

    res.json({ message: 'Listing claimed successfully', listing });
};

const getMyListings = async (req, res) => {
    const listings = await Listing.find({ donor: req.user._id })
        .sort({ createdAt: -1 });
    res.json(listings);
};

const deleteListing = async (req, res) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.donor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
};

module.exports = {
    createListing, getListings, getNearbyListings,
    getListingById, claimListing, getMyListings, deleteListing,
};