import express from 'express';
import { 
    createOrder, 
    getLatestBuyOrders,
    getLatestSellOrders,
    getBuyOrderById,
    getSellOrderById,
    cancelOrder,
    updateOrderToShipping
} from '../controllers/order/orderController.mjs';
import { confirmDeliveryAndRateOrder, getUserRatings, getUserAverageRating } from '../controllers/order/ratingsController.mjs';
import { authenticate } from "../middleware/authenticate.mjs";

const router = express.Router();

/**
 * @swagger
 * /api/order/create:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order for a specific art publication. This endpoint allows buyers to place an order for an art publication, initiating the payment process through Stripe Checkout.
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
 *               - artPublicationId
 *             properties:
 *               artPublicationId:
 *                 type: string
 *                 description: The ID of the art publication to order.
 *     responses:
 *       201:
 *         description: Order created successfully. Returns the order details along with a Stripe Checkout session URL for payment.
 *         content:
 *           application/json:
 *             example:
 *               msg: Order created and Stripe Checkout session initiated
 *               order:
 *                 _id: 12345
 *                 artPublicationId: 67890
 *                 buyerId: 54321
 *                 sellerId: 98765
 *                 orderPrice: 50.00
 *                 paymentStatus: "pending"
 *                 stripeSessionId: "stripe_session_id_123"
 *               url: "https://stripe.com/checkout/stripe_session_id_123"
 *       400:
 *         description: Bad request. The art publication is not available for sale or has already been sold.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Art publication not available for sale or already sold"
 *       404:
 *         description: Art publication not found.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Art publication not found"
 *       500:
 *         description: Server error. An internal server error occurred.
 *         content:
 *           application/json:
 *             example:
 *               msg: "Server Error"
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
 *               - comment
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order.
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating for the order (1-5).
 *               comment:
 *                 type: string
 *                 description: Comment for the rating.
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
/**
 * @swagger
 * /api/order/user/{id}/ratings:
 *   get:
 *     summary: Get user ratings
 *     description: Retrieve ratings for a specific user with pagination.
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Limit of ratings to retrieve.
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *     responses:
 *       200:
 *         description: List of ratings retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   orderId:
 *                     type: string
 *                   rating:
 *                     type: number
 *                   comment:
 *                     type: string
 *                   completedAt:
 *                     type: string
 *                     format: date-time
 *                   buyerUsername:
 *                     type: string
 *                   buyerProfilePicture:
 *                     type: string
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get('/user/:id/ratings', authenticate, getUserRatings);

/**
 * @swagger
 * /api/order/user/{id}/average-rating:
 *   get:
 *     summary: Get user average rating
 *     description: Retrieve the average rating for a specific user.
 *     tags: [Rating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user.
 *     responses:
 *       200:
 *         description: Average rating retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                   description: Average rating of the user.
 *       404:
 *         description: User not found.
 *       500:
 *         description: Server error.
 */
router.get('/user/:id/average-rating', authenticate, getUserAverageRating);

export default router;
