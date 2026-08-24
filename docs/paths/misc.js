/**
 * Secondary routes — endpoint list ngắn (body tối thiểu).
 */

/**
 * @openapi
 * /api/v1/shifts:
 *   get:
 *     tags: [Shifts]
 *     summary: Danh sách ca làm việc
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Shifts]
 *     summary: Tạo ca (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/shifts/{dayOfWeek}:
 *   get:
 *     tags: [Shifts]
 *     summary: Ca theo ngày trong tuần
 *     parameters:
 *       - in: path
 *         name: dayOfWeek
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/shifts/{id}:
 *   get:
 *     tags: [Shifts]
 *     summary: Chi tiết / cập nhật / xóa ca
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
 *         description: OK
 *   patch:
 *     tags: [Shifts]
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
 *     tags: [Shifts]
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

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Danh sách đơn hàng
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Orders]
 *     summary: Tạo đơn
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/orders/getOrderByUser:
 *   get:
 *     tags: [Orders]
 *     summary: Đơn theo user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/orders/getRevenueByPeriod/{period}:
 *   get:
 *     tags: [Orders]
 *     summary: Doanh thu theo period
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Chi tiết / cập nhật / xóa đơn
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
 *         description: OK
 *   patch:
 *     tags: [Orders]
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
 *     tags: [Orders]
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

/**
 * @openapi
 * /api/v1/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Danh sách đánh giá
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Reviews]
 *     summary: Tạo đánh giá
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: Danh sách tài khoản
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/employees:
 *   get:
 *     tags: [Employees]
 *     summary: Danh sách nhân viên
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/conservations:
 *   get:
 *     tags: [Chat]
 *     summary: Danh sách hội thoại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Chat]
 *     summary: Tạo hội thoại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/conservations/getConservationByMembers:
 *   get:
 *     tags: [Chat]
 *     summary: Lấy hội thoại theo members
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @openapi
 * /api/v1/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Danh sách / tạo tin nhắn
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Chat]
 *     summary: Gửi tin nhắn
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/messages/{conservationID}:
 *   get:
 *     tags: [Chat]
 *     summary: Tin nhắn theo hội thoại
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conservationID
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: OK
 */
