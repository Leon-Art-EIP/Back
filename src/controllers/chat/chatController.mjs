import { v4 as uuid } from 'uuid';
import db from '../../config/db.mjs';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import logger from '../../admin/logger.mjs';

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
export const getUserChats = async (req, res) => {
    const userId = req.params.userId;
    try {
        const chatsSnapshot = await db.collection('Conversations')
            .where('UserOneId', '==', userId)
            .where('UserTwoId', '==', userId)
            .get();

        const chats = chatsSnapshot.docs.map(doc => new Conversation({ ...doc.data(), _id: doc.id }).toJSON());

        res.json({ chats });
    } catch (err) {
        logger.error('Error getting user chats', { error: err.message, stack: err.stack});
        res.status(500).send('Server error');
    }
};

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
export const createConversation = async (req, res) => {
    const { UserOneId, UserTwoId } = req.body;

    if (!UserOneId || !UserTwoId) {
        return res.status(400).json({ error: "Données manquantes ou invalides." });
    }

    try {
        const conversationQuery = db.collection('Conversations')
            .where('UserOneId', '==', UserOneId)
            .where('UserTwoId', '==', UserTwoId)
            .limit(1);
        const conversationSnapshot = await conversationQuery.get();

        if (!conversationSnapshot.empty) {
            const conversationDoc = conversationSnapshot.docs[0];
            return res.status(409).json({ message: "Conversation existante trouvée", convId: conversationDoc.id });
        }

        const UserOne = await db.collection('Users').doc(UserOneId).get();
        const UserTwo = await db.collection('Users').doc(UserTwoId).get();

        if (!UserOne.exists || !UserTwo.exists) {
            return res.status(404).json({ error: "Utilisateur introuvable." });
        }

        const newConversationData = {
            UserOneId,
            UserTwoId,
            unreadMessages: false,
            lastMessage: ' ',
            UserOnePicture: UserOne.data().profilePicture,
            UserTwoPicture: UserTwo.data().profilePicture,
            UserOneName: UserOne.data().username,
            UserTwoName: UserTwo.data().username,
            _id: uuid()
        };

        const conversationRef = db.collection('Conversations').doc(newConversationData._id);
        await conversationRef.set(newConversationData);

        res.status(201).json({ message: "Nouvelle conversation créée", convId: newConversationData._id });
    } catch (err) {
        logger.error('Error creating conversation', { error: err.message, stack: err.stack});
        res.status(500).json({ error: 'Erreur du serveur' });
    }
};

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
export const getSingleConversation = async (req, res) => {
    const convId = req.params.convId;
    try {
        const chatDoc = await db.collection('Conversations').doc(convId).get();

        if (!chatDoc.exists) {
            return res.status(404).json({ error: "Conversation non trouvée" });
        }

        const chat = new Conversation({ ...chatDoc.data(), _id: chatDoc.id }).toJSON();
        res.json({ chat });
    } catch (err) {
        logger.error('Error getting single conversation', { error: err.message, stack: err.stack});
        res.status(500).send('Server error');
    }
};

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
export const getConversationMessages = async (req, res) => {
    const chatId = req.params.chatId;
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        const messagesSnapshot = await db.collection('Messages')
            .where('id', '==', chatId)
            .orderBy('dateTime', 'asc')
            .offset(offset)
            .limit(limit)
            .get();

        const messages = messagesSnapshot.docs.map(doc => new Message({ ...doc.data(), _id: doc.id }).toJSON());

        await db.collection('Conversations').doc(chatId).update({ unreadMessages: false });

        res.json({ messages });
    } catch (err) {
        logger.error('Error getting conversation messages', { error: err.message, stack: err.stack});
        res.status(500).send('Erreur du serveur');
    }
};

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
export const addNewMessage = async (req, res) => {
    const { convId, userId, contentType, content } = req.body;

    if (!convId || !userId || !contentType || !content) {
        return res.status(400).json({ error: "Données manquantes ou invalides." });
    }

    try {
        const messageData = {
            id: convId,
            senderId: userId,
            contentType,
            content,
            dateTime: new Date().toISOString(),
            read: false
        };

        const messageRef = db.collection('Messages').doc();
        await messageRef.set(messageData);

        const conversationRef = db.collection('Conversations').doc(convId);
        const conversationDoc = await conversationRef.get();

        if (!conversationDoc.exists) {
            return res.status(404).json({ error: 'Conversation non trouvée' });
        }

        await conversationRef.update({
            unreadMessages: true,
            lastMessage: content,
            updatedAt: new Date().toISOString()
        });

        res.json({ message: messageData });
    } catch (err) {
        logger.error('Error adding new message', { error: err.message, stack: err.stack});
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
};
