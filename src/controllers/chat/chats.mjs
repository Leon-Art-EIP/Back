import express from 'express';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import { Order } from '../../models/orderModel.mjs';
import { User } from '../../models/userModel.mjs';
import db from '../../config/db.mjs';

const router = express.Router();

/**
 * @swagger
 * /api/conversations/{userId}:
 *   get:
 *     summary: Récupérer toutes les conversations pour un utilisateur spécifique
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
 *         description: Successfully retrieved conversations :)
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
    const userId = req.params.userId;
    try {
        const chats = await Conversation.find({
            $or: [
                { userOneId: userId },
                { userTwoId: userId }
            ]
        });
        res.json({ chats });
    } catch (err) /* istanbul ignore next */ {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



/**
 * @swagger
 * /api/conversations/create:
 *   put:
 *     summary: Créer une nouvelle conversation ou récupérer une conversation existante
 *     tags: [Conversations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - UserOneId
 *               - UserTwoId
 *             properties:
 *               UserOneId:
 *                 type: string
 *               UserTwoId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversation créée avec succès ou conversation existante trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 convId:
 *                   type: string
 *       400:
 *         description: Données manquantes ou invalides.
 *       404:
 *         description: Utilisateur introuvable.
 *       500:
 *         description: Erreur du serveur
 */
router.put('/create', async (req, res) => {
    const { UserOneId, UserTwoId } = req.body;

    console.log('Received UserOneId:', UserOneId);
    console.log('Received UserTwoId:', UserTwoId);

    if (!UserOneId || !UserTwoId) {
        return res.status(400).json({ error: "Données manquantes ou invalides." });
    }

    try {
        // Vérifiez si les UserOneId et UserTwoId ne sont pas undefined
        if (UserOneId === undefined || UserTwoId === undefined) {
            return res.status(400).json({ error: "User IDs cannot be undefined." });
        }

        // Vérifiez si une conversation existe déjà entre les deux utilisateurs spécifiés
        let conversation = await Conversation.findOne({
            UserOneId: UserOneId,
            UserTwoId: UserTwoId
        });

        if (conversation) {
            return res.status(409).json({ message: "Conversation existante trouvée", convId: conversation._id });
        }

        const UserOne = await User.findById(UserOneId);
        const UserTwo = await User.findById(UserTwoId);

        if (!UserOne || !UserTwo) {
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        conversation = new Conversation({
            UserOneId: UserOneId,
            UserTwoId: UserTwoId,
            unreadMessages: false,
            lastMessage: ' ',
            UserOnePicture: UserOne.profilePicture,
            UserTwoPicture: UserTwo.profilePicture,
            UserOneName: UserOne.username,
            UserTwoName: UserTwo.username
        });

        await conversation.save();

        res.status(201).json({ message: "Nouvelle conversation créée", convId: conversation._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Erreur du serveur' });
    }
});
/**
 * @swagger
 * /api/conversations/single/{convId}:
 *   get:
 *     summary: Récupérer une conversation spécifique par son ID
 *     tags: 
 *       - Conversations
 *     parameters:
 *       - in: path
 *         name: convId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la conversation à récupérer
 *     responses:
 *       200:
 *         description: Conversation récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 chat:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID de la conversation
 *                     lastMessage:
 *                       type: string
 *                       description: Dernier message de la conversation
 *                     unreadMessages:
 *                       type: boolean
 *                       description: Indicateur de messages non lus
 *                     UserOneId:
 *                       type: string
 *                       description: ID de l'utilisateur 1
 *                     UserOneName:
 *                       type: string
 *                       description: Nom de l'utilisateur 1
 *                     UserOnePicture:
 *                       type: string
 *                       description: Photo de profil de l'utilisateur 1
 *                     UserTwoId:
 *                       type: string
 *                       description: ID de l'utilisateur 2
 *                     UserTwoName:
 *                       type: string
 *                       description: Nom de l'utilisateur 2
 *                     UserTwoPicture:
 *                       type: string
 *                       description: Photo de profil de l'utilisateur 2
 *       404:
 *         description: Conversation non trouvée
 *       500:
 *         description: Erreur interne du serveur
 */

router.get('/single/:convId', async (req, res) => {
    const convId = req.params.convId
    try {
        const chat = await Conversation.findById(convId);

        if (!chat) {
            return res.status(404).json({ error: "Conversation non trouvée" });
        }

        res.json({ chat: chat });
    } catch (err) /* istanbul ignore next */ {
        res.status(500).send('Server error');
    }
});

/**
 * @swagger
 * /api/conversations/messages/{chatId}:
 *   get:
 *     summary: Retrieve messages for a specific conversation
 *     tags: [Conversations]
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
 *               item:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Reference to the Conversation this message belongs to
 *                   senderId:
 *                     type: string
 *                     description: The ID of the sender
 *                   contentType:
 *                     type: string
 *                     description: The type of content of the message
 *                   content:
 *                     type: string
 *                     description: The content of the message
 *                   dateTime:
 *                     type: string
 *                     description: The date and time when the message was sent
 *                   read:
 *                     type: boolean
 *                     default: false
 *                     description: Flag to indicate if the message has been read
 *       500:
 *         description: Internal server error
 */

router.get('/messages/:chatId', async (req, res) => {
    const chatId = req.params.chatId;
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const messages = await Message.findWithOrder({ id: chatId }, 'dateTime', 'asc', limit, offset);
        await Conversation.updateById(chatId, { unreadMessages: false });
        res.json({ messages });
    } catch (err) /* istanbul ignore next */ {
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});


/**
 * @swagger
 * /api/conversations/messages/new:
 *   post:
 *     summary: Create a new message in a conversation
 *     tags: [Conversations]
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
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Reference to the Conversation this message belongs to
 *                   senderId:
 *                     type: string
 *                     description: The ID of the sender
 *                   contentType:
 *                     type: string
 *                     description: The type of content of the message
 *                   content:
 *                     type: string
 *                     description: The content of the message
 *                   dateTime:
 *                     type: string
 *                     description: The date and time when the message was sent
 *                   read:
 *                     type: boolean
 *                     default: false
 *                     description: Flag to indicate if the message has been read
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */

router.post('/messages/new', async (req, res) => {
    const { convId, userId, contentType, content } = req.body;

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

        const conversationRef = db.collection('Conversations').doc(convId);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversationData = conversationDoc.data();

        await conversationRef.update({
            unreadMessages: true,
            lastMessage: content,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: message });
    } catch (err) /* istanbul ignore next */ {
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
    } catch (err) /* istanbul ignore next */ {
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
    } catch (err) /* istanbul ignore next */ {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
});

export default router;
