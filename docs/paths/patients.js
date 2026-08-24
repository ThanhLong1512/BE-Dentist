/**
 * @openapi
 * /api/v1/patients:
 *   get:
 *     tags: [Patients]
 *     summary: Danh sách bệnh nhân
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Patients]
 *     summary: Tạo bệnh nhân
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, gender, yearOfBirth, phoneNumber, address]
 *             properties:
 *               name: { type: string }
 *               gender: { type: boolean, description: "true = nam, false = nữ (theo schema hiện tại)" }
 *               yearOfBirth: { type: integer, example: 1990 }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *               account:
 *                 $ref: '#/components/schemas/ObjectId'
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @openapi
 * /api/v1/patients/duplicate/{id}:
 *   post:
 *     tags: [Patients]
 *     summary: Nhân bản bệnh nhân
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
 * /api/v1/patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Chi tiết bệnh nhân
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
 *     tags: [Patients]
 *     summary: Cập nhật bệnh nhân
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               gender: { type: boolean }
 *               yearOfBirth: { type: integer }
 *               phoneNumber: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Patients]
 *     summary: Xóa bệnh nhân
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
