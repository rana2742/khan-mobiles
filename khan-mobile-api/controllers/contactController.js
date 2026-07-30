const { pool } = require('../config/db');

// POST /api/contact  (public)
exports.create = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
  }
  await pool.query(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
    [name.trim(), email.trim(), subject?.trim() || null, message.trim()]
  );
  res.status(201).json({ success: true, message: 'Message sent.' });
};

// GET /api/contact  (admin only)
exports.list = async (req, res) => {
  const [messages] = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 200');
  res.json({
    success: true,
    messages: messages.map((m) => ({
      id: m.id, name: m.name, email: m.email, subject: m.subject, message: m.message,
      isRead: !!m.is_read, createdAt: m.created_at,
    })),
  });
};

// PUT /api/contact/:id/read  (admin only)
exports.markRead = async (req, res) => {
  const [result] = await pool.query('UPDATE contact_messages SET is_read = 1 WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }
  res.json({ success: true });
};

// DELETE /api/contact/:id  (admin only)
exports.remove = async (req, res) => {
  const [result] = await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) {
    return res.status(404).json({ success: false, message: 'Message not found.' });
  }
  res.json({ success: true, message: 'Message deleted.' });
};
