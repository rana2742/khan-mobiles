const ContactMessage = require('../models/ContactMessage');

// POST /api/contact  (public)
exports.create = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }
  await ContactMessage.create({
    name: name.trim(), email: email.trim(), subject: subject?.trim() || null, message: message.trim(),
  });
  res.status(201).json({ success: true, message: 'Message sent.' });
};

// GET /api/contact  (admin only)
exports.list = async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
  res.json({
    success: true,
    messages: messages.map((m) => ({
      id: m._id.toString(), name: m.name, email: m.email, subject: m.subject, message: m.message,
      isRead: !!m.isRead, createdAt: m.createdAt,
    })),
  });
};

// PUT /api/contact/:id/read  (admin only)
exports.markRead = async (req, res) => {
  const result = await ContactMessage.updateOne({ _id: req.params.id }, { isRead: true });
  if (!result.matchedCount) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }
  res.json({ success: true });
};

// DELETE /api/contact/:id  (admin only)
exports.remove = async (req, res) => {
  const result = await ContactMessage.deleteOne({ _id: req.params.id });
  if (!result.deletedCount) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }
  res.json({ success: true, message: 'Message deleted.' });
};
