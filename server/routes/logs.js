import express from 'express';
import { OfficeLog } from '../models/OfficeLog.js';

const router = express.Router();

// Get all logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await OfficeLog.find();
        const data = {};
        logs.forEach(log => {
            data[log.date] = log.entry;
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single log by date
router.get('/logs/:date', async (req, res) => {
    try {
        const log = await OfficeLog.findOne({ date: req.params.date });
        res.json(log || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create or update a log (upsert)
router.post('/logs/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const { entry } = req.body;

        const log = await OfficeLog.findOneAndUpdate(
            { date },
            { date, entry },
            { upsert: true, new: true }
        );

        res.json(log);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a log
router.delete('/logs/:date', async (req, res) => {
    try {
        await OfficeLog.deleteOne({ date: req.params.date });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
