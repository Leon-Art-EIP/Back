import express from 'express';
import { 
    createOrder, 
    getLatestBuyOrders,
    getLatestSellOrders,
    getBuyOrderById,
    getSellOrderById,
    cancelOrder, 
    confirmDeliveryAndRateOrder,
    updateOrderToShipping
} from '../controllers/order/orderController.mjs';
import { authenticate } from "../middleware/authenticate.mjs";

const router = express.Router();

/**
 * @swagger
 * /api/order/create:
 *   post:
 *     summary: Create a new order
 *     description: >
 *       Allows a buyer to create a new order for an art publication. 
 *       Initiates a Stripe Checkout session and returns a URL for the checkout page.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Required data for creating a new order
 *       required: true
 *       content:
 *         application/json:
 *           example: {
 *             artPublicationId: "123456789"
 *           }
 *     responses:
 *       201:
 *         description: >
 *           Order created successfully. Returns a URL to the Stripe Checkout session.
 *           The response body contains a message and a URL.
 *       400:
 *         description: Bad request, art publication not available for sale or already sold.
 *       500:
 *         description: Server error.
 */
router.post('/create', authenticate, createOrder);

/**
 * @swagger
 * /api/order/confirm-shipping:
 *   post:
 *     summary: Confirm order shipment
 *     description: Allows the seller to confirm the shipment of an order. Only the seller of the order can perform this action.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order to confirm as shipped.
 *     responses:
 *       200:
 *         description: Order state updated to shipping successfully.
 *       404:
 *         description: Order not found.
 *       403:
 *         description: Unauthorized, only the seller can confirm the shipment.
 *       400:
 *         description: Bad request, order must be in paid state to be marked as shipping.
 *       500:
 *         description: Server error.
 */
router.post('/confirm-shipping', authenticate, updateOrderToShipping);

/**
 * @swagger
 * /api/order/latest-buy-orders:
 *   get:
 *     summary: Get latest buy orders
 *     description: Retrieve the latest buy orders for the logged-in user.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit of buy orders to retrieve.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *     responses:
 *       200:
 *         description: Latest buy orders retrieved successfully. Orders are populated with art publication details.
 *       500:
 *         description: Server error.
 */
router.get('/latest-buy-orders', authenticate, getLatestBuyOrders);

/**
 * @swagger
 * /api/order/latest-sell-orders:
 *   get:
 *     summary: Get latest sell orders
 *     description: Retrieve the latest sell orders for the logged-in user.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit of sell orders to retrieve.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *     responses:
 *       200:
 *         description: Latest sell orders retrieved successfully. Orders are populated with art publication details.
 *       500:
 *         description: Server error.
 */
router.get('/latest-sell-orders', authenticate, getLatestSellOrders);

/**
 * @swagger
 * /api/order/buy/{id}:
 *   get:
 *     summary: Get buy order by ID
 *     description: Retrieve detailed information of a specific buy order for the logged-in user.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the buy order.
 *     responses:
 *       200:
 *         description: Buy order details retrieved successfully. Order is populated with art publication and seller details.
 *       404:
 *         description: Buy order not found.
 *       500:
 *         description: Server error.
 */
router.get('/buy/:id', authenticate, getBuyOrderById);

/**
 * @swagger
 * /api/order/sell/{id}:
 *   get:
 *     summary: Get sell order by ID
 *     description: Retrieve detailed information of a specific sell order for the logged-in user.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the sell order.
 *     responses:
 *       200:
 *         description: Sell order details retrieved successfully. Order is populated with art publication and buyer details.
 *       404:
 *         description: Sell order not found.
 *       500:
 *         description: Server error.
 */
router.get('/sell/:id', authenticate, getSellOrderById);

/**
 * @swagger
 * /api/order/cancel/{id}:
 *   post:
 *     summary: Cancel an order
 *     description: >
 *       Allows the seller to cancel an order. If the order is already paid,
 *       this will initiate a refund process through Stripe and mark the order as refunded.
 *       Additionally, if the art publication is not sold to another buyer, it will be set as unsold.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to be cancelled.
 *     responses:
 *       200:
 *         description: >
 *           Order cancelled successfully. If already paid, the order is refunded
 *           and the art publication status is updated if necessary.
 *       404:
 *         description: Order not found.
 *       403:
 *         description: Unauthorized, only the seller associated with the order can cancel.
 *       500:
 *         description: Server error.
 */
router.post('/cancel/:id', authenticate, cancelOrder);


/**
 * @swagger
 * /api/order/confirm-delivery-rate:
 *   post:
 *     summary: Confirm delivery and rate an order
 *     description: Allows a buyer to confirm delivery and rate the order.
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - rating
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order.
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating for the order (1-5).
 *     responses:
 *       200:
 *         description: Order completed and rated successfully.
 *       404:
 *         description: Order not found.
 *       403:
 *         description: Unauthorized, only the buyer can confirm delivery and rate.
 *       500:
 *         description: Server error.
 */
router.post('/confirm-delivery-rate', authenticate, confirmDeliveryAndRateOrder);

export default router;
