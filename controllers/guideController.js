// controllers/guideController.js
const Guide = require("../models/guideModel");


exports.getGuideByPageKey = async (req, res) => {
    try {
        const { pageKey } = req.params;
        const guide = await Guide.findOne({ pageKey, isActive: true });
        if (!guide) return res.status(404).json({ message: "No guide found" });
        res.json({ data: guide });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getAllGuides = async (req, res) => {
    try {
        const guides = await Guide.find().sort({ createdAt: -1 });
        res.json({ data: guides });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.upsertGuide = async (req, res) => {
    try {
        const { pageKey, heading, description, videoUrl, videoPublicId } = req.body;

        if (!pageKey || !heading || !videoUrl) {
            return res.status(400).json({ message: "pageKey, heading, videoUrl required hain" });
        }

        const guide = await Guide.findOneAndUpdate(
            { pageKey },
            { heading, description: description || [], videoUrl, videoPublicId, isActive: true },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({ data: guide, message: "Guide saved successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteGuide = async (req, res) => {
    try {
        await Guide.findByIdAndDelete(req.params.id);
        res.json({ message: "Guide deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

