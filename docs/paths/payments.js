/**
 * @openapi
 * /api/v1/payments/paymentWithCOD:
 *   post:
 *     tags: [Payments]
 *     summary: Thanh toán COD (appointment hold hoặc shop cart)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [totalPrice, service]
 *             properties:
 *               reservationId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               totalPrice:
 *                 type: number
 *                 minimum: 0
 *               service:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ObjectId'
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: Đặt lịch / đơn COD thành công
 */

/**
 * @openapi
 * /api/v1/payments/paymentWithMoMo:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo thanh toán MoMo (cần reservationId)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, totalPrice, service]
 *             properties:
 *               reservationId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               totalPrice: { type: number, minimum: 0 }
 *               service:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ObjectId'
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: URL / payload redirect MoMo
 */

/**
 * @openapi
 * /api/v1/payments/paymentWithZaloPay:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo thanh toán ZaloPay
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, totalPrice, service]
 *             properties:
 *               reservationId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               totalPrice: { type: number, minimum: 0 }
 *               service:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ObjectId'
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: URL / payload ZaloPay
 */

/**
 * @openapi
 * /api/v1/payments/paymentWithVnPay:
 *   post:
 *     tags: [Payments]
 *     summary: Tạo thanh toán VNPay
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservationId, totalPrice, service]
 *             properties:
 *               reservationId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               totalPrice: { type: number, minimum: 0 }
 *               service:
 *                 oneOf:
 *                   - $ref: '#/components/schemas/ObjectId'
 *                   - type: array
 *                     items:
 *                       $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: URL redirect VNPay
 */

/**
 * @openapi
 * /api/v1/payments/callbackwithMoMo:
 *   post:
 *     tags: [Payments]
 *     summary: Callback IPN MoMo (gateway gọi)
 *     responses:
 *       200:
 *         description: Acknowledged
 */

/**
 * @openapi
 * /api/v1/payments/callbackwithZaloPay:
 *   post:
 *     tags: [Payments]
 *     summary: Callback IPN ZaloPay
 *     responses:
 *       200:
 *         description: Acknowledged
 */

/**
 * @openapi
 * /api/v1/payments/callbackwithVNPay:
 *   post:
 *     tags: [Payments]
 *     summary: Callback / return VNPay
 *     responses:
 *       200:
 *         description: Acknowledged
 */
