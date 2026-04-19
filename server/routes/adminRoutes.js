const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    updateUserStatus,
    deleteUser,
    getAllListings,
    getPendingReceivers,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect, authorizeRoles('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/listings', getAllListings);
router.get('/pending-receivers', getPendingReceivers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;