# Authentication System

This document describes the authentication architecture in Vanilla Cookbook, including session management, password requirements, rate limiting, OAuth integration, and known security considerations.

## Architecture Overview

Vanilla Cookbook uses **Lucia v2** with the **Prisma adapter** for session-based authentication. The system provides:

- Session-based authentication with secure cookies
- Password authentication with Argon2id hashing (Lucia default)
- Optional OAuth providers (GitHub, Google)
- Configurable rate limiting for login attempts
- Configurable password strength requirements

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Lucia config | `src/lib/server/lucia.js` | Auth instance with session config |
| Prisma adapter | `@lucia-auth/adapter-prisma` | Database integration |
| Hooks | `src/hooks.server.js` | Session validation on every request |
| Auth helpers | `src/lib/server/authHelpers.js` | Reusable auth utilities for API routes |
| Page auth helpers | `src/lib/server/authPage.js` | Reusable auth utilities for layout/page loads |
| Security utils | `src/lib/utils/security.js` | Password validation |
| Rate limiting | `src/lib/server/rateLimit.js` | Login attempt throttling |

## Session Flow

### Request Lifecycle

```
1. Request arrives
   ↓
2. hooks.server.js handle() runs
   ↓
3. Lucia validates session cookie
   - auth.handleRequest(event) creates auth object
   - auth.validate() checks session validity
   ↓
4. Session/user set on event.locals
   - locals.auth = auth handler
   - locals.session = session object (or null)
   - locals.user = user object (or null)
   ↓
5. Route handler accesses locals.user
   - API routes: use auth helpers
   - Pages: use +page.server.js load functions
   ↓
6. Response returned with session cookie updates
```

### locals Object Structure

After hooks processing, `event.locals` contains:

```javascript
{
  auth: LuciaAuthHandler,      // Use for session operations
  session: {                   // null if not authenticated
    sessionId: string,
    user: UserObject
  },
  user: {                      // null if not authenticated
    userId: string,
    username: string,
    name: string,
    isAdmin: boolean,
    publicProfile: boolean,
    publicRecipes: boolean,
    units: 'metric' | 'us',
    skipSmallUnits: boolean,
    ingMatch: boolean,
    ingOriginal: boolean,
    ingExtra: boolean,
    useCats: boolean,
    ingSymbol: boolean,
    language: string,
    theme: string
  },
  clientIp: string,            // For rate limiting
  limiter: RateLimiter,        // Login rate limit functions
  site: {                      // Site-wide configuration
    dbSeeded: boolean,
    settings: SiteSettings,
    oauth: OAuthConfig,
    ai: AIConfig
  }
}
```

## Database Models

### AuthUser

Primary user model with authentication and preference fields:

```prisma
model AuthUser {
  id             String    @id @unique
  username       String    @unique
  name           String?
  email          String?   @unique
  isAdmin        Boolean   @default(false)
  isRoot         Boolean   @default(false)
  publicProfile  Boolean   @default(false)
  publicRecipes  Boolean   @default(false)
  units          String    @default("metric")
  language       String    @default("en")
  theme          String    @default("light")
  // ... user preferences

  auth_session   AuthSession[]
  key            AuthKey[]
  auth_accounts  AuthAccount[]
  // ... other relations
}
```

### AuthSession

Session storage for authenticated users:

```prisma
model AuthSession {
  id             String   @id @unique
  user_id        String
  active_expires BigInt
  idle_expires   BigInt
  user           AuthUser @relation(...)
}
```

### AuthKey

Password storage (Argon2id hashes):

```prisma
model AuthKey {
  id              String   @id @unique
  hashed_password String?
  user_id         String
  user            AuthUser @relation(...)
}
```

### AuthAccount

OAuth account links:

```prisma
model AuthAccount {
  id               String   @id @default(uuid())
  provider         String
  provider_user_id String
  user_id          String
  user             AuthUser @relation(...)
}
```

## Password Requirements

Password validation is handled by `src/lib/utils/security.js`. Requirements are **configurable via environment variables**.

### Default Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

### Environment Configuration

```bash
# Password Requirements (all have sensible defaults)
PASSWORD_MIN_LENGTH=8           # Minimum password length
PASSWORD_REQUIRE_UPPERCASE=true # Require A-Z
PASSWORD_REQUIRE_LOWERCASE=true # Require a-z
PASSWORD_REQUIRE_DIGIT=true     # Require 0-9
PASSWORD_REQUIRE_SPECIAL=true   # Require !@#$%^&*()_+-=[]{}...
```

### API Functions

```javascript
import {
  validatePassword,
  validatePasswords,
  getPasswordRequirements,
  getPasswordRequirementsDescription
} from '$lib/utils/security.js'

// Validate single password
const { isValid, message } = validatePassword('MyP@ssw0rd')

// Validate password + confirmation
const { isValid, message } = validatePasswords('MyP@ssw0rd', 'MyP@ssw0rd')

// Get current requirements (for dynamic UI)
const reqs = getPasswordRequirements()
// { minLength: 8, requireUppercase: true, ... }

// Get human-readable description
const desc = getPasswordRequirementsDescription()
// "Password must be at least 8 characters, include uppercase, ..."
```

## Rate Limiting

Login attempts are rate-limited to prevent brute force attacks.

### Configuration

```bash
RATE_LIMIT_WINDOW_MS=60000     # Window size (default: 1 minute)
RATE_LIMIT_LOGIN_PER_IP=10     # Max attempts per IP per window
RATE_LIMIT_LOGIN_PER_ID=5      # Max attempts per username per window
```

### Usage

Rate limiting is applied in login routes:

```javascript
const ipCheck = locals.limiter.loginByIp(locals.clientIp)
if (!ipCheck.ok) {
  return fail(429, { message: 'Too many login attempts. Try again later.' })
}

const idCheck = locals.limiter.loginById(username)
if (!idCheck.ok) {
  return fail(429, { message: 'Too many login attempts for this account.' })
}
```

### Limitations

⚠️ **Current implementation uses in-memory storage**:
- Rate limit counters reset when the server restarts
- Not suitable for distributed deployments (multiple instances)
- For production with multiple instances, consider Redis-backed rate limiting

## OAuth Providers

### Supported Providers

- **GitHub**: Full OAuth flow
- **Google**: Full OAuth flow

### Configuration

Set in `.env`:

```bash
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Provider Detection

OAuth availability is exposed via `locals.site.oauth`:

```javascript
{
  githubEnabled: boolean,  // GitHub credentials configured
  googleEnabled: boolean,  // Google credentials configured
  oauthEnabled: boolean    // Both providers available
}
```

## Auth Helper Module

The `$lib/server/authHelpers.js` module provides reusable authentication utilities that reduce boilerplate in API routes.

### Functions

#### requireAuth(locals)

Throws 401 if user is not authenticated. Returns user object.

```javascript
import { requireAuth } from '$lib/server/authHelpers'

export async function GET({ locals }) {
  const user = requireAuth(locals)  // Throws 401 if not logged in
  // user is guaranteed to exist here
}
```

#### requireAdmin(locals)

Throws 401 if not authenticated, 403 if not admin. Returns user object.

```javascript
import { requireAdmin } from '$lib/server/authHelpers'

export async function DELETE({ locals }) {
  const user = requireAdmin(locals)  // Throws 401/403 if not admin
  // user.isAdmin is guaranteed true here
}
```

#### requireOwnership(user, resource, options?)

Throws 403 if user doesn't own the resource. Options: `{ allowAdmin: true }` to permit admin access.

```javascript
import { requireAuth, requireOwnership } from '$lib/server/authHelpers'

export async function PUT({ locals, params }) {
  const user = requireAuth(locals)
  const recipe = await prisma.recipe.findUnique({ where: { uid: params.id } })
  requireOwnership(user, recipe)  // Throws 403 if user.userId !== recipe.userId
}

// With admin override:
requireOwnership(user, recipe, { allowAdmin: true })
```

#### requireAccessOrPublic(locals, resource)

For resources that can be public. Allows access if:
- Resource is public (`is_public` or `publicRecipes`)
- User is authenticated and owns the resource
- User is admin (if `allowAdmin: true`)

```javascript
import { requireAccessOrPublic } from '$lib/server/authHelpers'

export async function GET({ locals, params }) {
  const recipe = await prisma.recipe.findUnique({ ... })
  requireAccessOrPublic(locals, recipe)  // Throws 403 if private + not owner
}
```

#### jsonSuccess(data, status?)

Returns a JSON response with proper headers.

```javascript
import { jsonSuccess } from '$lib/server/authHelpers'

return jsonSuccess({ recipe: updatedRecipe })
return jsonSuccess({ created: newItem }, 201)
```

#### jsonError(status, message)

Returns a JSON error response.

```javascript
import { jsonError } from '$lib/server/authHelpers'

return jsonError(400, 'Invalid input')
return jsonError(404, 'Recipe not found')
```

### Migration Example

**Before** (28 lines):

```javascript
export async function PUT({ locals, params }) {
  const session = await locals.auth.validate()
  const user = session?.user
  if (!session || !user) {
    return new Response('User not authenticated!', {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  const log = await prisma.RecipeLog.findUnique({ where: { id: params.id } })
  if (log.userId !== user.userId) {
    return new Response(JSON.stringify({ error: 'Not owner' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  // ... actual logic
  return new Response(JSON.stringify({ updatedLog }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**After** (8 lines):

```javascript
import { requireAuth, requireOwnership, jsonSuccess } from '$lib/server/authHelpers'

export async function PUT({ locals, params }) {
  const user = requireAuth(locals)
  const log = await prisma.RecipeLog.findUnique({ where: { id: params.id } })
  requireOwnership(user, log)
  // ... actual logic
  return jsonSuccess({ updatedLog })
}
```

## Cookie Configuration

### Development

- `secure: false` (allows HTTP)
- `sameSite: 'lax'`

### Production

- `secure: true` if ORIGIN uses HTTPS
- `secure: false` if ORIGIN uses HTTP (self-hosted HTTP setups)
- `sameSite: 'lax'`

The secure cookie flag is automatically determined by:

```javascript
const isHttpOrigin = env.ORIGIN?.startsWith('http://') ?? false
const useSecureCookies = !dev && !isHttpOrigin
```

## Security Considerations

### Current Protections

✅ **Argon2id password hashing** - Industry-standard, resistant to GPU attacks
✅ **Session-based auth** - Server-side session validation
✅ **Rate limiting** - Prevents brute force (per IP and per username)
✅ **CSRF protection** - SameSite cookies + CORS headers
✅ **Secure cookies in HTTPS** - Automatic when ORIGIN is HTTPS
✅ **Configurable password strength** - Environment-based requirements

### Known Vulnerabilities & Recommendations

#### 1. In-Memory Rate Limiting
**Risk**: Medium
**Issue**: Rate limits reset on server restart; not distributed-ready
**Recommendation**: For production with multiple instances, implement Redis-backed rate limiting

#### 2. No Email Verification
**Risk**: Low-Medium
**Issue**: Users can register with any email without verification
**Recommendation**: Add email verification flow for sensitive deployments

#### 3. No Account Lockout
**Risk**: Medium
**Issue**: No permanent lockout after many failed attempts
**Recommendation**: Implement progressive delays or temporary lockouts

#### 4. HTTP Allowed in Production
**Risk**: Medium
**Issue**: Sessions can be sent over unencrypted connections
**Recommendation**: Use HTTPS in production; document HTTP risks for self-hosters

#### 5. No Two-Factor Authentication
**Risk**: Low (for self-hosted app)
**Issue**: Only password-based authentication
**Recommendation**: Consider TOTP support for security-conscious users

#### 6. No Audit Logging
**Risk**: Low
**Issue**: No logging of auth events (login, logout, failed attempts)
**Recommendation**: Add structured logging for security events

#### 7. Session Lifetime
**Risk**: Low
**Issue**: Sessions may persist longer than ideal
**Recommendation**: Configure appropriate session expiration in Lucia

## Frontend Integration

### Route Groups

- `(private)/` - Routes requiring authentication
- `(public)/` - Routes accessible to all users

Layout files in these groups handle redirects based on auth state.

### Auth State in Pages

Access via `+page.server.js` load function:

```javascript
export async function load({ locals }) {
  const user = locals.user
  if (!user) redirect(302, '/login')
  return { user }
}
```

Or via `+layout.server.js` for group-wide protection.

### Page Auth Helpers

For layout/page `load()` functions, use the helpers in `src/lib/server/authPage.js` to reduce boilerplate:

```javascript
import { requireUser, requireUserMatch, requireAdminUser } from '$lib/server/authPage'

export const load = async ({ locals, params }) => {
  const user = requireUser(locals)        // Redirects to /login if not authenticated
  requireUserMatch(user, params.id)       // Redirects to / if mismatched
  // or: const admin = requireAdminUser(locals)
}
```

### Password Requirements in the UI

The root `+layout.server.js` exposes the active password requirements to the client:

```javascript
passwordRequirements: getPasswordRequirements(env),
passwordRequirementsDescription: getPasswordRequirementsDescription(env)
```

Frontend forms pass these requirements into `validatePassword()` / `validatePasswords()` so client-side messaging matches the server policy. Use `buildPasswordEnv()` from `src/lib/utils/security.js` to convert `passwordRequirements` into the expected env-shape.

## Frontend Auth Plan (Upcoming)

Short-term plan to finish the frontend auth refactor and documentation. This keeps UI simple while enforcing the same security rules as the backend.

1. Password requirements on the client (done)
   - Frontend now consumes server-configured PASSWORD_* values via root `+layout.server.js`.
   - Password validation messaging updated on:
     - `src/routes/+page.svelte`
     - `src/routes/register/+page.svelte`
     - `src/routes/user/[id]/(private)/options/password/+page.svelte`
     - `src/routes/user/[id]/(private)/options/admin/users/+page.svelte`
   - Client-side validation now mirrors server-side requirements.
2. Route-group auth checks (done)
   - Added shared layout/page auth helpers in `src/lib/server/authPage.js`.
   - Updated private layouts to use helpers.
3. Documentation updates (done)
   - Added "Page Auth Helpers" and "Password Requirements in the UI" sections above.

## Troubleshooting

### "User not authenticated" errors

1. Check ORIGIN matches actual URL (including protocol and port)
2. Verify cookies are being set (browser dev tools)
3. Check for CORS issues if using different domains

### Rate limit issues

1. Check RATE_LIMIT_* environment variables
2. Restart server to reset in-memory counters (temporary fix)
3. Check logs for IP detection issues

### OAuth not working

1. Verify client ID and secret are set correctly
2. Check callback URLs match OAuth app configuration
3. Ensure ORIGIN is correctly configured

### Password validation failing

1. Check PASSWORD_* environment variables
2. Verify password meets all configured requirements
3. Check for special character encoding issues
