const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedNewPassword, updatedAt: new Date() } }
    );

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Something went wrong' });
  }
});

module.exports = router;
