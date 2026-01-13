# TrackDieselUI

TrackDieselUI is a single-page Angular (v19) administrative UI for managing vehicles, parts, and reported issues. The app uses a JWT-based authentication flow, communicates with a backend API via HttpClient, and is bootstrapped using Angular's standalone `bootstrapApplication` + `provideRouter`.

Quick highlights:
- Angular 19, TypeScript
- Standalone application bootstrap (no AppModule)
- Router with hash-based URLs (withHashLocation)
- REST integration via `src/app/restApiService/api.service.ts`
- JWT stored in `localStorage` and decoded via `jwt-decode`

---

## Table of contents
- Prerequisites
- Quick start
- Configuration
- Common commands
- Project structure
- Routing (available routes)
- Services & Models (summary)
- Authentication flow
- Troubleshooting
- Contributing
- License

---

## Prerequisites
- Node.js (recommend >= 18.x)
- npm (comes with Node.js)
- Angular CLI (optional for global use): `npm i -g @angular/cli` (local CLI available via `npx ng`)

The project uses:
- Angular 19 (see package.json)
- TypeScript ~5.7

---

## Quick start (local development)

1. Clone the repo
   ```
   git clone https://github.com/Muratcany001/trackDieselUI.git
   cd trackDieselUI
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure backend API (see Configuration section) — ensure the backend is reachable.

4. Run the dev server:
   ```
   npm start
   # equivalent to: ng serve (development configuration)
   ```

5. Open the app in your browser:
   ```
   http://localhost:4200/
   ```
   The app uses hash-based routing, so routes appear like `http://localhost:4200/#/mainPage`.

---

## Configuration

Backend base URL
- The ApiService currently contains a hard-coded base URL:
  - `src/app/restApiService/api.service.ts` → `private apiUrl = "https://localhost:7029";`
- You should point this to your backend API. Options:
  - Quick (edit): Replace the `apiUrl` constant with your API URL.
  - Recommended (project improvement): Add environment files (e.g., `src/environments/environment.ts`) and refer to `environment.apiUrl`, or use build-time replacements.

API keys / secrets
- There is a placeholder `apiKey.env/apiKey.env`. It's currently empty and not used by the app.
- Best practice:
  - Do NOT commit secrets to the repo.
  - Use environment-specific configuration or secrets management.
  - For local development, you may store a token in localStorage or run a script that sets env files.

Example: change API URL
```ts
// src/app/restApiService/api.service.ts
private apiUrl = "https://api.yourdomain.com"; // update to your backend
```

Authentication and credentials
- Login is done through ApiService.login which stores the received JWT in `localStorage` under key `token`.
- The app sets Authorization headers for protected calls using that token.

---

## Common commands

- Start dev server
  ```
  npm start
  ```
- Build (production)
  ```
  npm run build
  # output: dist/track-diesel-ui
  ```
- Watch build (dev)
  ```
  npm run watch
  ```
- Run unit tests (Karma)
  ```
  npm test
  ```

---

## Project structure (selected files)

Important top-level files:
- src/main.ts — application bootstrap with `bootstrapApplication` and `appConfig`
- src/app/app.config.ts — ApplicationConfig that provides router and HttpClient
- src/app/app.routes.ts — Routes & guards
- src/app/app.component.* — Root (side panel / navigation) and logout form
- src/app/restApiService/api.service.ts — Primary HTTP client for the backend
- src/app/restApiService/auth.service.ts — Decodes JWT to get current user id

Routes and many page components live under `src/app/pages/*`. Tests are alongside components (`*.spec.ts`).

---

## Routing (available routes)

Defined in `src/app/app.routes.ts`. Main routes:
- /login — LoginComponent
- /signupPage — SignupPageComponent
- /registerPage — RegisterPageComponent
- /mainPage — MainPageComponent (protected)
- /addPage — AddPageComponent (protected)
- /updatePage — UpdatePageComponent (protected)
- /deletePage — DeletePageComponent (protected)
- /searchPage — SearchPageComponent (protected)
- /aiPage — AiPageComponent (protected)
- /userPage — UserPageComponent (protected)
- /stock — StockComponent (protected)
- /errorPage — ErrorPageComponent
- /logout — Logout component (performs logout)
- default redirect: '' → '/mainPage'
- 404: '**' → NotFoundComponent

Note: Protected routes use `authGuard`.

---

## Services & models overview

ApiService is the central point for backend communication:
- Base URL: `apiUrl` (see Configuration)
- Authentication endpoints:
  - POST /api/auth/login → login(), stores token in localStorage
  - POST /api/auth/logout → logOut()
- Cars:
  - POST /cars/AddCar (addCar)
  - GET /cars/GetAll (getCars / getCarsAll)
  - PATCH /cars/UpdateCar/:plate (updateCar)
  - DELETE /cars/deleteCar/:plate (deleteCar)
  - GET /cars/GetCarCount (getCarCount)
  - GET /cars/GetCarByPlate/:plate (getCarByPlate)
  - GET /cars/GetModelsWithBrokenParts (GetModelsWithBrokenParts)
  - GET /cars/MostCommonProblems (MostCommonProblems)
  - GET /cars/issues (getAllIssues)
- Errors:
  - POST /errors/AddError (addError)
  - GET /errors/GetErrorByName/:errorName (getError)
- Parts & Stock:
  - POST /parts/AddParts (addPart)
  - GET /parts/GetAllParts (getAllParts)
  - GET /parts/GetPartById/:id (getPartById)
  - GET /parts/GetPartByName/:name (searchPartsByName)
  - PATCH /parts/UpdateStockAsync/:id (updatePart / updateStock)
  - DELETE /parts/DeletePart/:id (deletePart)
  - POST /parts/AddBulkParts (addBulkParts)

Key TypeScript interfaces (found in api.service.ts)
- Car, CarWithoutValues, Issue, Part, Stock, newError, WorstCars, updateIssues
These define the shapes of payloads and responses used by the UI.

Authorization headers
- Many methods call `getAuthHeaders()` which reads `localStorage.getItem('token')` and creates a header:
  `Authorization: Bearer <token>`

---

## Authentication flow

- Login:
  - Call ApiService.login({ name, password }) — backend returns `{ token: string }`
  - ApiService stores token in `localStorage` as `token`.
- Protected requests:
  - ApiService adds `Authorization: Bearer <token>` header for protected endpoints.
- Decoding:
  - AuthService uses `jwt-decode` to extract the user id claim:
    `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier`
- Logout:
  - ApiService.logOut() posts to `/api/auth/logout` then app clears the `token` from localStorage and navigates to `/login`.

Security notes:
- Tokens are stored in localStorage (persist across sessions). Consider storing in memory or secure cookie for higher security.
- Ensure your backend respects token expiry and revocation.

---

## Troubleshooting

1. Cannot reach backend (CORS / network errors)
   - Error: "API sunucusuna bağlanılamıyor" (ApiService.handleError detects status 0).
   - Ensure the backend is running and reachable at the configured `apiUrl`.
   - If backend is on a different origin, enable CORS on the backend.

2. HTTPS / Self-signed certificate on localhost
   - If backend uses HTTPS with a self-signed cert (https://localhost:7029), your browser may block calls. Use a proper certificate, disable strict enforcement in dev (not recommended), or run backend on HTTP for local dev.

3. 401 Unauthorized on protected endpoints
   - Ensure login succeeded and token is present in `localStorage`.
   - Verify the token format and backend accepted it.
   - Check that ApiService.getAuthHeaders() is returning a header.

4. JWT decode fails or claim not found
   - AuthService expects the name identifier in the claim:
     `decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]`
   - Ensure the backend includes the claim or update AuthService to read the correct claim name.

5. Response shapes differ from expected
   - ApiService includes some mapping and assumptions (e.g., errorHistory may be $values-wrapped). If your backend response shape differs, update the mapping logic.

6. Where to change API URL (summary)
   - Edit `src/app/restApiService/api.service.ts`, update `private apiUrl = "...";`
   - Or implement environment files and reference `environment.apiUrl`.

---

## Example: login using curl
If your backend is running and exposes /api/auth/login:
```
curl -X POST "https://localhost:7029/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"id":0,"name":"admin","email":"admin@example.com","password":"password"}'
```
Response expected:
```json
{
  "token": "eyJ...your.jwt.token..."
}
```
Copy that token into your browser console to test authenticated API calls:
```js
localStorage.setItem('token', 'eyJ...your.jwt.token...')
```

---

## Tests

Unit tests are configured with Karma and Jasmine. Run:
```
npm test
```
Spec files are co-located (`*.spec.ts`) next to components/services.

---

## Contributing

- Thank you for contributing! A few suggestions:
  - Create feature branches off main.
  - Add tests for new logic (Karma/Jasmine).
  - Consider moving API base URL to environment files for easier multi-environment builds.
  - Avoid committing secrets; use `.env` (not committed) or CI secrets.

Suggested improvements:
- Add proper environment files (`src/environments/environment.ts`) and wire them into the build.
- Add an AppModule alternative or document standalone component approach for contributors unfamiliar with Angular standalone APIs.
- Add a README section for backend API contract or import OpenAPI/Swagger if available.

---

## License

This repository does not include a LICENSE file. If you plan to publish, add a LICENSE (for example, MIT) to make reuse terms explicit.

---

If you want, I can:
- Add an example `src/environments/environment.ts` and show how to switch the ApiService to use it.
- Provide a quick script to set `localStorage` tokens for testing.
- Draft a sample `.env.sample` or gitignore rules for secrets.
