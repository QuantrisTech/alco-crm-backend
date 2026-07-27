const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const {
  createWebinar,
  getAllWebinars,
  getWebinarById,
  updateWebinar,
  deleteWebinar,
  getWebinarRegistrations,
  getPublicWebinar,
  registerForWebinar
} = require('../controllers/webinarsController.js');

// ---------- ADMIN ROUTES ----------
router.post('/', protect, authorize('admin', 'super_admin'), createWebinar);
router.get('/', protect, authorize('admin', 'super_admin'), getAllWebinars);
router.get('/:id', protect, authorize('admin', 'super_admin'), getWebinarById);
router.put('/:id', protect, authorize('admin', 'super_admin'), updateWebinar);
router.delete('/:id', protect, authorize('admin', 'super_admin'), deleteWebinar);
router.get('/:id/registrations', protect, authorize('admin', 'super_admin'), getWebinarRegistrations);

// ---------- PUBLIC ROUTES ----------
router.get('/public/:id', getPublicWebinar);
router.post('/public/:id/register', registerForWebinar);

module.exports = router;