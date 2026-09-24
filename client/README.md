# Maple client — Checkpoint 1

Shared Expo application for web, iOS, and Android. Foundation verification only.

## Run

- `npm install`
- `npm start` (Expo development server)
- `npm run web`
- `npm run typecheck`
- `npm run lint`
- `npm run build:web` (static output in `dist/`)
- `npx expo-doctor`

Routes use the standard template's `src/app/` structure. Only `/` is implemented.
`src/constants/tokens.json` is the single source of design-token values, consumed
by Tailwind and the typed `theme.ts` export. System appearance drives NativeWind's
media-based dark variants; there is no manual theme switch.

The Organizer and Sponsor buttons intentionally have no action or navigation.
The JPG under `assets/images/` is an unchanged reference copy, not a production
icon. Final icons, splash branding, package identifiers, native/EAS setup and
all backend/product features are deferred. No deployment is configured.
