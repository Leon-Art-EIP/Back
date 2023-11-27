import express from 'express';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import Order from '../../models/orderModel.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/conversations:
 *   get:
 *     summary: Récupère toutes les conversations
 *     description: Récupère la liste complète des conversations.
 *     tags: [Conversation]
 *     responses:
 *       200:
 *         description: Liste des conversations récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Conversation'
 *       500:
 *         description: Erreur du serveur.
 */
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId
    try {
        const chats = await Conversation.find({ $or: [{  sender_one_id: userId }, {  sender_two_id: userId }] });
        res.json({ chats: chats });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /api/conversations/messages:
 *   get:
 *     summary: Récupère les messages d'une conversation spécifique
 *     description: Renvoie les messages liés à un ID de conversation spécifique.
 *     tags: [Conversation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               convId:
 *                 type: number
 *                 description: L'ID de la conversation.
 *     responses:
 *       200:
 *         description: Liste des messages récupérés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       400:
 *         description: Données manquantes ou invalides.
 *       500:
 *         description: Erreur du serveur.
 */
router.get('/messages/:chatId', async (req, res) => {
    const chatId = req.params.chatId; // Récupérer le convId de la requête

    try {
        const messages = await Message.find({ conversationId: chatId }).sort({ dateTime: 1 }); // Trier par dateTime pour obtenir des messages dans l'ordre chronologique

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
 *     summary: Crée un nouveau message dans une conversation
 *     description: Ajoute un nouveau message à une conversation spécifique.
 *     tags: [Conversation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               convId:
 *                 type: number
 *               sender:
 *                 type: number
 *               contentType:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message créé avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Données manquantes ou invalides.
 *       500:
 *         description: Erreur du serveur.
 */
router.post('/messages/new', async (req, res) => {
    const { convId, userId, contentType, content} = req.body;

    if (convId === undefined || userId === undefined || contentType === undefined || !content) {
        return res.status(400).json({ error: "Données manquantes ou invalides." });
    }

    try {
        const message = new Message({
            conversationId: convId,
            sender_id: userId,
            contentType: contentType,
            content: content,
            dateTime: new Date().toISOString()
        });

        await message.save();

        const conversation = await Conversation.findOne({ _id: convId });
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
 *     summary: Récupère les informations de commande d'une conversation spécifique
 *     description: Renvoie les informations de commande liées à un ID de conversation spécifique.
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               convId:
 *                 type: number
 *                 description: L'ID de la conversation.
 *     responses:
 *       200:
 *         description: Informations de commande récupérées avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Informations de commande non trouvées.
 *       500:
 *         description: Erreur du serveur.
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
 *     summary: Met à jour la note d'une commande pour une conversation spécifique
 *     description: Met à jour la note attribuée à une commande d'une conversation donnée.
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               convId:
 *                 type: number
 *               rating:
 *                 type: number
 *     responses:
 *       200:
 *         description: Note mise à jour avec succès.
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
 *         description: Données manquantes ou invalides.
 *       404:
 *         description: Commande non trouvée.
 *       500:
 *         description: Erreur du serveur.
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
