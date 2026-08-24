/**
 * @openapi
 * /api/v1/users/register:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng ký tài khoản
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, passwordConfirm]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               passwordConfirm: { type: string, format: password }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Validation / email đã tồn tại
 */

/**
 * @openapi
 * /api/v1/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập (email/password)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               otpToken: { type: string, description: "Bắt buộc nếu đã bật 2FA" }
 *     responses:
 *       200:
 *         description: Trả access/refresh token (cookie hoặc body tùy client)
 *       401:
 *         description: Sai thông tin đăng nhập
 */

/**
 * @openapi
 * /api/v1/users/logout:
 *   delete:
 *     tags: [Auth]
 *     summary: Đăng xuất
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Đã logout
 *       401:
 *         description: Chưa đăng nhập
 */

/**
 * @openapi
 * /api/v1/users/refreshToken:
 *   put:
 *     tags: [Auth]
 *     summary: Làm mới access token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token mới
 *       401:
 *         description: Refresh token không hợp lệ
 */

/**
 * @openapi
 * /api/v1/users/get_2fa_qr_code:
 *   get:
 *     tags: [Auth]
 *     summary: Lấy QR code thiết lập 2FA
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR / secret 2FA
 */

/**
 * @openapi
 * /api/v1/users/setUp2FA:
 *   post:
 *     tags: [Auth]
 *     summary: Bật 2FA sau khi quét QR
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otpToken: { type: string }
 *     responses:
 *       200:
 *         description: 2FA đã bật
 */

/**
 * @openapi
 * /api/v1/users/verify2FA:
 *   put:
 *     tags: [Auth]
 *     summary: Xác minh OTP 2FA
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otpToken: { type: string }
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 */

/**
 * @openapi
 * /api/v1/users/loginGoogle:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập Google OAuth
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential: { type: string, description: "Google ID token / credential" }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */

/**
 * @openapi
 * /api/v1/users/loginFacebook:
 *   post:
 *     tags: [Auth]
 *     summary: Đăng nhập Facebook OAuth
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken: { type: string }
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 */

/**
 * @openapi
 * /api/v1/users/send_recovery_email:
 *   post:
 *     tags: [Auth]
 *     summary: Gửi email khôi phục mật khẩu
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Đã gửi email (nếu tài khoản tồn tại)
 */

/**
 * @openapi
 * /api/v1/users/reset_password:
 *   post:
 *     tags: [Auth]
 *     summary: Đặt lại mật khẩu bằng token recovery
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *               passwordConfirm: { type: string }
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 */
