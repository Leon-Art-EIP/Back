import express from 'express';
import Conversation from '../../models/conversationModel.mjs';
import Message from '../../models/messageModel.mjs';
import Order from '../../models/orderModel.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const conversations = await Conversation.find();
        res.json( {conversations: conversations} );
    } catch (err) {
        res.status(500).send('Erreur lors de la récupération des conversations');
    }
});

router.post('/messages', async (req, res) => {
    const { convId } = req.body; // Récupérer le convId de la requête

    if (!convId) {
        return res.status(400).json({ error: "L'ID de conversation est requis." });
    }

    try {
        const messages = await Message.find({ conversationId: convId }).sort({ dateTime: 1 }); // Trier par dateTime pour obtenir des messages dans l'ordre chronologique

        res.json({ messages: messages });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

router.post('/order/info', async (req, res) => {
    const { convId } = req.body;

    if (!convId) {
        return res.status(400).json({ error: "L'ID de conversation est requis." });
    }

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

router.post('/order/rating', async (req, res) => {
    const { convId, rating } = req.body;

    if (!convId || rating === undefined || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: "Données manquantes ou invalides." });
    }

    try {
        const order = await Order.findOne({ conversationId: convId });

        if (!order) {
            return res.status(404).json({ success: false, error: "Commande non trouvée pour cette conversation." });
        }

        order.orderRating = rating;
        await order.save();

        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, error: 'Erreur du serveur' });
    }
});

export default router;
