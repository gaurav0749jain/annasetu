const express = require('express');
const router = express.Router();
const {
    createListing,
    getListings,
    getNearbyListings,
    getListingById,
    claimListing,
    getMyListings,
    deleteListing,
} = require('../controllers/listingController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/multer');

router.get('/', getListings);
router.get('/nearby', getNearbyListings);
router.get('/my', protect, getMyListings);
router.get('/:id', getListingById);
router.post('/', protect, authorizeRoles('donor', 'admin'), upload.array('images', 5), createListing);
router.put('/:id/claim', protect, authorizeRoles('receiver'), claimListing);
router.delete('/:id', protect, deleteListing);

module.exports = router;