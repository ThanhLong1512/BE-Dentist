/**
 * @openapi
 * /api/v1/search/patients:
 *   get:
 *     tags: [Search]
 *     summary: Fuzzy search bệnh nhân (Elasticsearch)
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Từ khóa tìm kiếm
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Kết quả search
 */

/**
 * @openapi
 * /api/v1/search/services:
 *   get:
 *     tags: [Search]
 *     summary: Fuzzy search dịch vụ
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Kết quả search
 */

/**
 * @openapi
 * /api/v1/search/appointments:
 *   get:
 *     tags: [Search]
 *     summary: Fuzzy search lịch hẹn
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Kết quả search
 */
