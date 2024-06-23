import express from 'express';
import { v4 as uuid } from 'uuid';
import db from '../../config/db.mjs';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import { User } from '../../models/userModel.mjs';

const router = express.Router();

router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const chatsSnapshot = await db.collection('Conversations')
            .where('UserOneId', '==', userId)
            .where('UserTwoId', '==', userId)
            .get();

        const chats = chatsSnapshot.docs.map(doc => new Conversation({ ...doc.data(), _id: doc.id }).toJSON());

        res.json({ chats });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/create', async (req, res) => {
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
        console.error(err.message);
        res.status(500).json({ error: 'Erreur du serveur' });
    }
});

router.get('/single/:convId', async (req, res) => {
    const convId = req.params.convId;
    try {
        const chatDoc = await db.collection('Conversations').doc(convId).get();

        if (!chatDoc.exists) {
            return res.status(404).json({ error: "Conversation non trouvée" });
        }

        const chat = new Conversation({ ...chatDoc.data(), _id: chatDoc.id }).toJSON();
        res.json({ chat });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

router.get('/messages/:chatId', async (req, res) => {
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
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

router.post('/messages/new', async (req, res) => {
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
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
});

export default router;
