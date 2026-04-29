import mongoose from 'mongoose';

const officeLogSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        entry: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
    },
    { timestamps: true }
);

export const OfficeLog = mongoose.model('OfficeLog', officeLogSchema);
