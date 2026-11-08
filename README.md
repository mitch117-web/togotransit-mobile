# TogoTransit Mobile

Mobile app for **TogoTransit**, a multi-company bus and parcel platform for Togo. Travellers search trips, book seats, pay and keep their QR-code tickets on the phone; drivers update parcel deliveries; company staff scan and check tickets with the camera.

> **Français :** application mobile de TogoTransit (transport de voyageurs et de colis au Togo) : recherche de trajets, réservation, billets avec QR code, envoi et suivi de colis, contrôle des billets par scan. Projet de mémoire de licence en développement web.

The web platform and the API live in the companion repository: [`togotransit`](https://github.com/mitch117-web/togotransit) (live: <https://togotransit-antg.vercel.app>).

## Features

**Travellers**
- Search trips by route and date, see departures and prices
- Book a seat, pay with Mobile Money (Flooz / T-Money) and get a ticket with a QR code
- Cancel a booking from the ticket screen
- Send a parcel and follow it on a live-tracking screen
- In-app notifications, profile editing, onboarding, password reset by one-time code
- Assistant chatbot (answers questions about trips, fares and parcels)

**Drivers**
- Driver home with the parcels assigned to them and the next status to set
- Delivery confirmation with a signature and a photo as proof

**Company staff**
- Scan a ticket QR code with the camera and see a large, readable result for the check

## Tech stack

- Expo SDK 54, React Native 0.81, React 19, TypeScript
- Expo Router (file-based navigation)
- `expo-camera` (QR scan), `expo-location`, `expo-image-picker`, `react-native-qrcode-svg`, `react-native-signature-canvas`
- Axios API client with token storage in AsyncStorage

## Getting started

```bash
git clone https://github.com/mitch117-web/togotransit-mobile.git
cd togotransit-mobile
npm install
npx expo start
```

Then open the project with **Expo Go** on a phone (scan the QR code shown in the terminal), or press `a` for an Android emulator.

By default the app talks to the production API (`https://togotransit-antg.vercel.app/api`). To use a local backend, create a `.env` file:

```bash
EXPO_PUBLIC_API_URL=http://<your-computer-ip>:3000/api
```

## Building an Android APK

```bash
npx eas build --platform android --profile preview
```

(requires an Expo account and `eas-cli`).

## Project structure

```
app/          screens and navigation (Expo Router): auth, tabs, booking, parcels, tickets
components/   reusable UI, driver home, scan result sheet, chatbot
lib/          API client, authentication, ticket helpers, theme
constants/    colours
assets/       icons, splash screen, brand illustrations
```

## Known limits

- The Mobile Money step is a **simulation**: no real operator is connected in this version.
- SMS messages are simulated on the server side.
- This is an academic project: it has no automated test suite in this repository.

## Author

Michel ANAKPA, web developer based in Lomé, Togo.
