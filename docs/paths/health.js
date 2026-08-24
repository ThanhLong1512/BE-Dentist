/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check (Mongo, Redis, Elasticsearch)
 *     description: |
 *       MongoDB và Redis là critical. Elasticsearch mang tính thông tin (search có thể degraded).
 *     responses:
 *       200:
 *         description: Các dependency healthy / degraded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 checks:
 *                   type: object
 */

/**
 * @openapi
 * /:
 *   get:
 *     tags: [Health]
 *     summary: Root deploy probe
 *     responses:
 *       200:
 *         description: Deployment Successful
 */
