# 上线步骤

## 1. 前端 Netlify

将项目根目录发布到 Netlify，发布目录是项目根目录（包含 `index.html`）。得到前端地址后，再修改 `backend-config.js` 的 `apiBase`。

## 2. 后端 Railway

在 Railway 从 GitHub 导入项目，Root Directory 设为 `server`。使用：

```text
Build Command: npm ci
Start Command: npm start
```

添加持久化 Volume，挂载到 `/app/data`。在 Variables 中填写：

```env
PORT=8787
PUBLIC_BASE_URL=https://后端域名
ALLOWED_ORIGINS=https://前端域名
STORAGE_DIR=/app/data
MOCK_MODE=false
AI_BASE_URL=https://api.xn--lbr707ayot.com
AI_GENERATE_PATH=/v1/images/edits
AI_API_KEY=只在Railway后台填写
AI_MODEL=[企业级]gpt-image-2
AI_IMAGE_FIELD=image
MERCHANT_PASSWORD=上线时在Railway设置新密码
SESSION_SECRET=另一个随机长字符串
SESSION_TTL_SECONDS=28800
GENERATION_SESSION_COOLDOWN_SECONDS=30
GENERATION_IP_WINDOW_SECONDS=600
GENERATION_IP_MAX_REQUESTS=30
```

不要把 `server/.env` 上传到 GitHub，也不要把 API Key 写进前端文件。

## 3. 回填前端地址

得到 Railway 后端域名后，将 `backend-config.js` 中的：

```js
apiBase: 'http://127.0.0.1:8787'
```

改为：

```js
apiBase: 'https://你的后端域名'
```

重新发布 Netlify。然后把新的 Netlify 域名填回 Railway 的 `ALLOWED_ORIGINS`。

## 4. 上线检查

打开 `https://后端域名/health`，确认返回 `ok: true`。再用手机测试生成、完成、订单号、商家登录、确认付款和下载。
