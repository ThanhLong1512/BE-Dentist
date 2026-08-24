/**
 * @openapi
 * /api/v1/services:
 *   get:
 *     tags: [Services]
 *     summary: Danh sách dịch vụ (public)
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Services]
 *     summary: Tạo dịch vụ (admin, multipart + photo)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [nameService, Unit, priceService, summary]
 *             properties:
 *               nameService: { type: string }
 *               Unit: { type: string }
 *               priceService: { type: number }
 *               summary: { type: string }
 *               description: { type: string }
 *               priceDiscount: { type: number }
 *               durationMinutes: { type: integer, minimum: 15 }
 *               bufferMinutes: { type: integer, minimum: 0 }
 *               photo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/services/duplicate/{id}:
 *   post:
 *     tags: [Services]
 *     summary: Nhân bản dịch vụ (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       201:
 *         description: Duplicated
 */

/**
 * @openapi
 * /api/v1/services/{id}:
 *   get:
 *     tags: [Services]
 *     summary: Chi tiết dịch vụ (public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Services]
 *     summary: Cập nhật dịch vụ (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Services]
 *     summary: Xóa dịch vụ (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       204:
 *         description: Deleted
 */
