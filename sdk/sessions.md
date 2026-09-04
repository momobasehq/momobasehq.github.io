# Sessions and tokens

Both SDK clients authenticate lazily, refresh expiring tokens, and retry one request after an HTTP `401`.

## Automatic refresh

Before a request, the client:

1. Authenticates when no token exists.
2. Refreshes when the cached token has reached its skew-adjusted expiry.
3. Sends the request with the access token.
4. On `401`, refreshes and retries that request once.

Concurrent requests share one refresh operation. The application client falls back to client-credential authentication when it has no valid refresh token. The administration client falls back to password authentication only when email and password are configured.

The token refresh margin is applied when a token is cached. `expiresAt` is therefore the time at which the SDK will refresh, not necessarily the token's signed expiry time.

## Inspect and clear a session

```ts
const token = admin.getToken();

if (token) {
	console.log(token.expiresAt);
}

admin.clearToken();
```

`getToken()` returns a copy of the current token snapshot. `clearToken()` removes it and calls `onTokenChange(undefined)` when a callback is configured.

`clearToken()` changes only local SDK state. For an administrator logout, call `await admin.logout()` first so Momobase revokes the server session, then call `admin.clearToken()`.

## Restore an administrator session

Pass tokens to the constructor:

```ts
const admin = new MomobaseAdminClient({
	baseUrl: "https://payments.example.com",
	accessToken: restored.accessToken,
	refreshToken: restored.refreshToken,
	onTokenChange: saveTokenSnapshot,
});
```

Or install them later:

```ts
admin.setAccessToken(accessToken, refreshToken, expiresInSeconds);
```

When `expiresInSeconds` is omitted, the SDK treats the access token as expired and tries to refresh it before the next request.

Use `setCredentials(email, password)` after a different administrator signs in. It replaces the credentials and clears the previous session.

::: warning Protect browser sessions
`onTokenChange` does not choose storage for you. Prefer secure, server-managed cookies where your architecture permits them. If you persist tokens in browser storage, account for script access, logout, expiry, and cross-tab synchronization.
:::

Store the token pair together. Restoring without `expiresInSeconds` deliberately forces a refresh on the next request, which is the safest choice when the original expiry is unavailable.

## Adjust the refresh window

Set `tokenSkewSeconds` only when clock skew or network latency requires a larger refresh margin:

```ts
const admin = new MomobaseAdminClient({
	baseUrl: "https://payments.example.com",
	email,
	password,
	tokenSkewSeconds: 60,
});
```

The default is 30 seconds.
