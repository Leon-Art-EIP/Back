import express from 'express';
import {
    getUserChats,
    createConversation,
    getSingleConversation,
    getConversationMessages,
    addNewMessage,
    deleteConversation
} from '../controllers/chat/chatController.mjs';

const router = express.Router();

router.get('/:userId', getUserChats);
router.put('/create', createConversation);
router.get('/single/:convId', getSingleConversation);
router.get('/messages/:chatId', getConversationMessages);
router.post('/messages/new', addNewMessage);
router.delete('/delete/:chatId', deleteConversation);

export default router;
