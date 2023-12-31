import express from 'express';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import Order from '../../models/orderModel.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/conversations/{userId}:
 *   get:
 *     summary: Retrieve all conversations for a specific user
 *     tags: [Conversations]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to fetch conversations for
 *     responses:
 *       200:
 *         description: Successfully retrieved conversations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Internal server error
 */

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId
    try {
        const chats = await Conversation.find({
            $or: [
              { UserOneId: userId }, 
              { UserTwoId: userId }
            ]
          });
        res.json({ chats: chats });
    } catch (err) {
        res.status(500).send('Server error');
    }
});


/**
 * @swagger
 * /api/conversations/messages/{chatId}:
 *   get:
 *     summary: Retrieve messages for a specific conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID to fetch messages for
 *     responses:
 *       200:
 *         description: Successfully retrieved messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       500:
 *         description: Internal server error
 */

router.get('/messages/:chatId', async (req, res) => {
    const chatId = req.params.chatId; // Récupérer le convId de la requête

    try {
        const messages = await Message.find({ id: chatId }).sort({ dateTime: 1 }); // Trier par dateTime pour obtenir des messages dans l'ordre chronologique

        const conversation = await Conversation.findOne({ _id: chatId });
        conversation.unreadMessages = false;
        res.json({ messages: messages });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

/**
 * @swagger
 * /api/conversations/messages/new:
 *   post:
 *     summary: Create a new message in a conversation
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - convId
 *               - userId
 *               - contentType
 *               - content
 *             properties:
 *               convId:
 *                 type: string
 *               userId:
 *                 type: string
 *               contentType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully created message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */

router.post('/messages/new', async (req, res) => {
    const { convId, userId, contentType, content} = req.body;

    if (convId === undefined || userId === undefined || contentType === undefined || !content) {
        return res.status(400).json({ error: "Données manquantes ou invalides." });
    }

    try {
        const message = new Message({
            id: convId,
            senderId: userId,
            contentType: contentType,
            content: content,
            dateTime: new Date().toISOString()
        });

        await message.save();

        const conversation = await Conversation.findOne({ _id: convId });
        conversation.unreadMessages = true;
        conversation.lastMessage = content;

        await conversation.save();

        res.json({message: message});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
});

/**
 * @swagger
 * /api/conversations/order/infos:
 *   post:
 *     summary: Retrieve order information for a specific conversation
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - convId
 *             properties:
 *               convId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved order information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order information not found
 *       500:
 *         description: Internal server error
 */

router.post('/order/infos', async (req, res) => {
    const { convId } = req.body;

    // if (!convId) {
    //     return res.status(400).json({ error: "L'ID de conversation est requis." });
    // }

    try {
        const orderInfo = await Order.findOne({ conversationId: convId });

        if (!orderInfo) {
            return res.status(404).json({ error: "Informations de commande non trouvées pour cette conversation." });
        }

        res.json(orderInfo);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

/**
 * @swagger
 * /api/conversations/order/rating:
 *   post:
 *     summary: Update the rating of an order for a specific conversation
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - convId
 *               - rating
 *             properties:
 *               convId:
 *                 type: string
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Successfully updated order rating
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */

router.post('/order/rating', async (req, res) => {
    const { convId, rating } = req.body;

    if (convId === undefined || rating === undefined || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: "Données manquantes ou invalides." });
    }

    try {
        const order = await Order.findOne({ conversationId: convId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Commande non trouvée pour cette conversation." });
        }

        order.orderRating = rating;
        await order.save();

        res.json({ success: true, order: order });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
});

export default router;
