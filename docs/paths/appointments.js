/**
 * @openapi
 * /api/v1/appointments/hold:
 *   post:
 *     tags: [Appointments]
 *     summary: Giữ chỗ slot lịch hẹn (Redis TTL)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shift, Date]
 *             properties:
 *               shift:
 *                 $ref: '#/components/schemas/ObjectId'
 *               Date:
 *                 type: string
 *                 description: Ngày hẹn (ISO date hoặc chuỗi ngày)
 *                 example: "2026-08-25"
 *               serviceId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               slotStart:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "09:00"
 *               slotEnd:
 *                 type: string
 *                 pattern: '^\\d{2}:\\d{2}$'
 *                 example: "09:30"
 *               account:
 *                 $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: Reservation đã tạo / hold thành công
 *       400:
 *         description: Slot không khả dụng hoặc validation lỗi
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/appointments/reservations/{reservationId}/cancel:
 *   delete:
 *     tags: [Appointments]
 *     summary: Hủy reservation / bỏ hold
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       200:
 *         description: Đã hủy
 *       404:
 *         description: Không tìm thấy reservation
 */

/**
 * @openapi
 * /api/v1/appointments/getMyAppointment:
 *   get:
 *     tags: [Appointments]
 *     summary: Lịch hẹn của user hiện tại
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch hẹn
 */

/**
 * @openapi
 * /api/v1/appointments/getByPeriod/{period}:
 *   get:
 *     tags: [Appointments]
 *     summary: Lịch hẹn theo khoảng ngày (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: ["7", "30", "90"]
 *     responses:
 *       200:
 *         description: Danh sách theo period
 */

/**
 * @openapi
 * /api/v1/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: Danh sách lịch hẹn
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Appointments]
 *     summary: Tạo lịch hẹn (admin/user)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [shift, Date]
 *             properties:
 *               shift:
 *                 $ref: '#/components/schemas/ObjectId'
 *               Date:
 *                 type: string
 *               account:
 *                 $ref: '#/components/schemas/ObjectId'
 *               serviceId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               slotStart: { type: string, example: "09:00" }
 *               slotEnd: { type: string, example: "09:30" }
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/appointments/{id}/status:
 *   patch:
 *     tags: [Appointments]
 *     summary: Cập nhật trạng thái lịch (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - scheduled
 *                   - checked_in
 *                   - in_progress
 *                   - completed
 *                   - cancelled
 *                   - rescheduled
 *     responses:
 *       200:
 *         description: Updated
 */

/**
 * @openapi
 * /api/v1/appointments/{id}/reschedule:
 *   patch:
 *     tags: [Appointments]
 *     summary: Đổi lịch hẹn (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Date: { type: string }
 *               shift:
 *                 $ref: '#/components/schemas/ObjectId'
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Rescheduled
 */

/**
 * @openapi
 * /api/v1/appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Chi tiết lịch hẹn
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
 *     tags: [Appointments]
 *     summary: Cập nhật lịch hẹn
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
 *     tags: [Appointments]
 *     summary: Xóa lịch hẹn
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
