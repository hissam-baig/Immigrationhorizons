const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    service: {
      type: String,
      enum: ['EB-2 NIW', 'EB-1A', 'EB-1B', 'EB-1C', 'Not Sure / Need Guidance'],
      default: 'Not Sure / Need Guidance',
    },
    message: { type: String, required: true },
    attachmentUrl: { type: String, default: '' },
    source: { type: String, enum: ['consultation', 'contact'], default: 'consultation' },
    emailSent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Consultation', ConsultationSchema);
