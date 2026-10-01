# Card Studio API contract

Edit `backend-config.js` when the API is ready. Set `enabled: true`; use an empty `apiBase` for same-origin deployment.

The `styles` object controls the style cards shown on the upload page. Add another key with `category` (`scene` or `portrait`), `label`, `description`, `skill`, and `prompt`; the selected category, style key, and skill id are sent to the API automatically. Keep the full skill instructions on the backend when they are private or licensed. `fontFaces` can point to a licensed WOFF2 or OTF file for Huiwen Mincho if the device does not have it installed.

## Generate one postcard

`POST {generatePath}` as `multipart/form-data`:

`image` (original file), `category` (`scene` or `portrait`), `mode` (`postcard`), `composition` (`single-postcard`), `style`, `skill`, `prompt`, `reserveTextArea` (`bottom`), `textLayers` (`date,caption`), `orientation` (`portrait` or `landscape`), `ratio` (`2:3` or `3:2`), `width` (`1200` portrait or `1800` landscape), `height` (`1800` portrait or `1200` landscape), `dpi` (`300`), `physicalSize` (`4x6in` portrait or `6x4in` landscape), `count` (`1`), and `requestId` (idempotency key). The postcard orientation follows the original photo. The API should normalize the generated result to the requested pixel dimensions before returning it.

Return either `{ "candidates": [{ "id": "...", "url": "https://...", "width": 1200, "height": 1800 }] }` or `{ "jobId": "..." }`. Each returned image should already be the complete requested 6-inch postcard composition at the requested pixel dimensions; the customer editor only adds date, caption, and optional stickers. For an async job, `GET {generatePath}/{jobId}` should return the same `candidates` array when ready, or `{ "status": "processing" }` while running.

## Create an order

`POST {orderPath}` as `multipart/form-data` with the final `image` JPG, `category`, `mode` (`postcard`), `composition` (`single-postcard`), `layout`, `style`, `skill`, `orientation`, `width`, `height`, and `requestId` (idempotency key).

Return `{ "id": "...", "orderNo": "DALI-...", "paymentRemark": "DALI-...", "paymentQrUrl": "https://...", "paymentStatus": "unpaid", "printStatus": "pending", "created": "..." }`. Treat the submitted `requestId` as an idempotency key and return the same order for retries.

## Payment and printing

Merchant authentication is session-based in the starter backend: call `POST /api/admin/login` with `{ "password": "..." }` and keep the returned HttpOnly cookie. The browser must send that cookie for merchant queue and merchant status changes.

- `GET {orderPath}` returns an array or `{ "orders": [] }` for the merchant queue.
- `GET {orderPath}/{id}` returns one order for the customer status refresh.
- `PATCH {orderPath}/{id}/payment` accepts `{ "status": "customer_reported" }` from the customer or `{ "status": "paid" }` after the merchant verifies the WeChat transaction.
- `PATCH {orderPath}/{id}/print` accepts `{ "status": "printed" }` after the merchant downloads and prints the JPG.

The customer button only reports that they paid. Automatic payment confirmation must come from the backend's WeChat merchant callback or a merchant-side reconciliation process; the browser cannot safely infer an account transaction.

Protect the merchant `GET /api/orders` and the two merchant PATCH routes with real authentication. The static page's store icon is only a navigation entry; hiding it or adding a client-side PIN does not protect order data.

Netlify can host this folder as a static site. Put the API behind HTTPS on the same origin through Netlify Functions/another backend, or set an HTTPS `apiBase` and configure CORS. Keep AI and payment credentials on the API server.
