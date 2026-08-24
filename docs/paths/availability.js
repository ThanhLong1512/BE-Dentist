/**
 * @openapi
 * /api/v1/availability/slots:
 *   get:
 *     tags: [Availability]
 *     summary: Lấy slot khả dụng theo ngày và dịch vụ
 *     description: |
 *       Tính slot từ ca làm việc, nghỉ giữa ca, duration/buffer dịch vụ,
 *       trừ lịch đã book và hold Redis.
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           example: "2026-08-25"
 *         description: Ngày cần xem slot
 *       - in: query
 *         name: serviceId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *       - in: query
 *         name: employeeId
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Lọc theo bác sĩ / nhân viên (optional)
 *     responses:
 *       200:
 *         description: Danh sách slot (start/end, available)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     slots:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           slotStart: { type: string, example: "09:00" }
 *                           slotEnd: { type: string, example: "09:30" }
 *                           available: { type: boolean }
 *       400:
 *         description: Thiếu date hoặc serviceId
 */
