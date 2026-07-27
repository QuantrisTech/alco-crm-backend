// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middlewares/authMiddleware');
// const { authorize } = require('../middlewares/roleMiddleware');
// const Webinar = require('../models/WebinarModel');
// const Registration = require('../models/Registration');

// // ---------- ADMIN ROUTES ----------

// // Create webinar with custom fields
// router.post('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   try {
//     const webinar = await Webinar.create({ ...req.body, createdBy: req.user._id });
//     res.status(201).json(webinar);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // List all webinars (admin)
// router.get('/', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   const webinars = await Webinar.find().sort({ date: -1 });
//   res.json(webinars);
// });

// // Get single webinar (admin, includes fields for editing)
// router.get('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   const webinar = await Webinar.findById(req.params.id);
//   if (!webinar) return res.status(404).json({ message: 'Not found' });
//   res.json(webinar);
// });

// // Update webinar / fields
// router.put('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   const webinar = await Webinar.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   if (!webinar) return res.status(404).json({ message: 'Not found' });
//   res.json(webinar);
// });

// // Delete webinar
// router.delete('/:id', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   await Webinar.findByIdAndDelete(req.params.id);
//   res.json({ message: 'Deleted' });
// });

// // List registrations for a webinar
// router.get('/:id/registrations', protect, authorize('admin', 'super_admin'), async (req, res) => {
//   const registrations = await Registration.find({ webinar: req.params.id }).sort({ createdAt: -1 });
//   res.json(registrations);
// });

// // ---------- PUBLIC ROUTES ----------

// // Get published webinar form (public, no auth)
// router.get('/public/:id', async (req, res) => {
//   const webinar = await Webinar.findOne({ _id: req.params.id, status: 'published' })
//     .select('title description date fields');
//   if (!webinar) return res.status(404).json({ message: 'Webinar not found or not published' });
//   res.json(webinar);
// });

// // Submit registration (public, no auth)
// router.post('/public/:id/register', async (req, res) => {
//   try {
//     const webinar = await Webinar.findOne({ _id: req.params.id, status: 'published' });
//     if (!webinar) return res.status(404).json({ message: 'Webinar not found or not published' });

//     const registration = await Registration.create({
//       webinar: webinar._id,
//       responses: req.body.responses,
//       ip: req.ip
//     });
//     res.status(201).json({ message: 'Registered successfully', registration });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// module.exports = router;
const Webinar = require('../models/WebinarModel');
const Registration = require('../models/RegistrationModel');

// ---------- ADMIN ----------

exports.createWebinar = async (req, res) => {
  try {
    const webinar = await Webinar.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(webinar);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getAllWebinars = async (req, res) => {
  const webinars = await Webinar.find().sort({ date: -1 });
  res.json(webinars);
};

exports.getWebinarById = async (req, res) => {
  const webinar = await Webinar.findById(req.params.id);
  if (!webinar) return res.status(404).json({ message: 'Not found' });
  res.json(webinar);
};

exports.updateWebinar = async (req, res) => {
  const webinar = await Webinar.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!webinar) return res.status(404).json({ message: 'Not found' });
  res.json(webinar);
};

exports.deleteWebinar = async (req, res) => {
  await Webinar.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
};

exports.getWebinarRegistrations = async (req, res) => {
  const registrations = await Registration.find({ webinar: req.params.id }).sort({ createdAt: -1 });
  res.json(registrations);
};

// ---------- PUBLIC ----------

exports.getPublicWebinar = async (req, res) => {
  const webinar = await Webinar.findOne({ _id: req.params.id, status: 'published' })
    .select('title description date fields');
  if (!webinar) return res.status(404).json({ message: 'Webinar not found or not published' });
  res.json(webinar);
};

exports.registerForWebinar = async (req, res) => {
  try {
    const webinar = await Webinar.findOne({ _id: req.params.id, status: 'published' });
    if (!webinar) return res.status(404).json({ message: 'Webinar not found or not published' });

    const registration = await Registration.create({
      webinar: webinar._id,
      responses: req.body.responses,
      ip: req.ip
    });
    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};