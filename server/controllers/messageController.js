const Message = require('../models/Message');

const getMessages = async (req, res) => {
    const { roomId } = req.params;
    const messages = await Message.find({ roomId })
        .populate('sender', 'name avatar role')
        .sort({ createdAt: 1 });
    res.json(messages);
};

const sendMessage = async (req, res) => {
    const { roomId, content } = req.body;
    const message = await Message.create({
        roomId, content, sender: req.user._id,
    });
    await message.populate('sender', 'name avatar role');
    res.status(201).json(message);
};

module.exports = { getMessages, sendMessage };