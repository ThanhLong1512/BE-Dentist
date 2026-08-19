# API Đăng nhập Google

## Endpoint

```
POST /api/v1/users/loginGoogle
```

## Request Body

Chấp nhận **một trong hai** format (Google One Tap / Sign-In trả về `credential`):

```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```

hoặc

```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

`credential` / `token` là **Google ID Token** (JWT) từ callback của Google Sign-In.

## Cách lấy credential từ Frontend (Google Identity Services)

```javascript
// 1. Load script
<script src="https://accounts.google.com/gsi/client" async defer></script>

// 2. Initialize và xử lý callback
google.accounts.id.initialize({
  client_id: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  callback: handleCredentialResponse
});

function handleCredentialResponse(response) {
  // response.credential chính là ID token
  fetch('/api/v1/users/loginGoogle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Quan trọng: gửi/nhận cookies
    body: JSON.stringify({ credential: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    // data chứa: id, name, email, role, image, accessToken, refreshToken...
  });
}

// 3. Hiển thị nút hoặc One Tap
google.accounts.id.renderButton(document.getElementById("googleBtn"), {
  theme: "outline",
  size: "large"
});
```

## Response thành công (200)

```json
{
  "id": "...",
  "name": "Nguyễn Văn A",
  "email": "user@gmail.com",
  "role": "user",
  "image": "https://lh3.googleusercontent.com/...",
  "require_2FA": false,
  "is_2fa_verified": false,
  "last_login": 1234567890,
  "accessToken": "...",
  "refreshToken": "..."
}
```

Cookies `accessToken` và `refreshToken` cũng được set (httpOnly, secure).

## Lưu ý

1. **CORS**: Đảm bảo `FRONTEND_URL` trong `config.env` khớp với domain FE (vd: `http://localhost:5173`)
2. **credentials: 'include'**: Request từ FE phải gửi `credentials: 'include'` để nhận cookies
3. **GOOGLE_CLIENT_ID**: Phải trùng với Client ID dùng ở FE (Web client từ Google Cloud Console)
