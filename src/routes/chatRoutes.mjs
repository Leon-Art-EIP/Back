import express from 'express';
import {
    getUserChats,
    createConversation,
    getSingleConversation,
    getConversationMessages,
    addNewMessage
} from '../controllers/chat/chatController.mjs';

const router = express.Router();

router.get('/:userId', getUserChats);
router.put('/create', createConversation);
router.get('/single/:convId', getSingleConversation);
router.get('/messages/:chatId', getConversationMessages);
router.post('/messages/new', addNewMessage);

export default router;
