# Receiptly

Receiptly is a mobile application for scanning and managing receipts. Point your phone camera at any receipt and Receiptly will automatically extract the vendor, date, and total using Google Cloud Vision OCR, store the data in the cloud, and optionally export it to a Google Sheet — giving you a living record of your spending without any manual data entry.

---

## Features

- **Receipt Scanning** — Capture receipt images directly from the device camera or photo library.
- **Automatic OCR** — Google Cloud Vision API extracts vendor name, transaction date, and total amount from each image.
- **Cloud Storage** — Receipt images and parsed data are persisted via Supabase.
- **Dashboard Analytics** — At-a-glance stats including total spent, receipt count, average per receipt, top vendor, and a monthly spending breakdown.
- **Transaction History** — Browse, filter, and view the full details of every scanned receipt.
- **Google Sheets Export** — Automatically append receipt rows to a configured Google Sheet every time a new receipt is saved.
- **User Authentication** — Secure sign-up and login powered by Supabase Auth.
- **Onboarding Flow** — Guided welcome experience for first-time users.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile frontend | React Native 0.81 · Expo 54 · TypeScript |
| Navigation | React Navigation 7 (Native Stack + Bottom Tabs) |
| Backend API | Java 17 · Spring Boot 3.2 · Maven |
| Database | PostgreSQL via Supabase (JPA / Hibernate) |
| Auth & Storage | Supabase |
| OCR | Google Cloud Vision API |
| Spreadsheet export | Google Sheets API v4 · Google Drive API v3 |

---

## Repository Structure

```
receiptly-app/
├── backend/                  # Spring Boot REST API
│   └── src/main/java/com/receiptly/receiptly_backend/
│       ├── controller/       # HTTP endpoints
│       ├── service/          # OCR, storage, Sheets integrations
│       ├── model/            # JPA entities (Receipt, UserSettings)
│       └── repository/       # Spring Data repositories
├── frontend/                 # Expo / React Native app
│   └── src/
│       ├── screens/          # App screens (Login, Dashboard, Scan, …)
│       ├── components/       # Shared UI components
│       ├── navigation/       # Navigation configuration
│       ├── services/         # API client
│       ├── context/          # Auth context
│       └── theme/            # Colors and shared styles
├── docs/
│   ├── api-spec.md           # REST API documentation
│   └── setup_database.sql    # Supabase schema & RLS policies
└── sampleUploads/            # Example receipt images for testing
```

---

## Prerequisites

- **Node.js** (LTS) and **npm**
- **Java 17** and **Maven 3.8+**
- **Expo CLI** — `npm install -g expo-cli`
- A [Supabase](https://supabase.com) project (database, auth, and storage)
- A [Google Cloud](https://console.cloud.google.com) project with the **Vision API**, **Sheets API**, and **Drive API** enabled, plus a service-account JSON key file

---

## Getting Started

### 1. Database setup

Run the SQL file against your Supabase project:

```bash
psql "$SUPABASE_DB_URL" -f docs/setup_database.sql
```

This creates the `user_settings` table with the required Row-Level Security policies.

### 2. Backend

```bash
cd backend
```

Create an `.env` file (or export these variables in your shell):

```env
DB_URL=jdbc:postgresql://<host>:5432/receiptly
DB_USERNAME=<username>
DB_PASSWORD=<password>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<supabase-anon-key>
SUPABASE_BUCKET=receipts
GOOGLE_CREDENTIALS_JSON=<path-to-service-account.json or inline JSON>
```

Install dependencies and start the server:

```bash
mvn clean install
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Then press:
- **`a`** — open in Android emulator
- **`i`** — open in iOS simulator
- **`w`** — open in a web browser

> **Android emulator note:** The default API base URL uses `http://10.0.2.2:8080/api` for Android emulators (maps to host `localhost`). For iOS simulators it uses `http://localhost:8080/api`. Update `src/services/api.ts` if you need a different host.

---

## Running Tests

### Backend

```bash
cd backend
mvn test
```

---

## Building for Production

### Backend (JAR)

```bash
cd backend
mvn clean package
java -jar target/receiptly-backend-0.0.1-SNAPSHOT.jar
```

### Frontend (Expo EAS)

```bash
cd frontend
eas build --platform android
eas build --platform ios
```

---

## API Reference

See [`docs/api-spec.md`](docs/api-spec.md) for the full endpoint reference.

### Quick reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/receipts/upload` | Upload a receipt image; returns parsed OCR data |
| `GET`  | `/api/receipts` | List all receipts for the authenticated user |
| `GET`  | `/api/receipts/{id}` | Get a single receipt by ID |
| `DELETE` | `/api/receipts/{id}` | Delete a receipt |
| `GET`  | `/api/settings` | Get user settings (Google Sheet ID, auto-export flag) |
| `PUT`  | `/api/settings` | Update user settings |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URL` | ✅ | JDBC connection string for PostgreSQL |
| `DB_USERNAME` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_KEY` | ✅ | Supabase anon/service key |
| `SUPABASE_BUCKET` | ✅ | Supabase storage bucket name for receipt images |
| `GOOGLE_CREDENTIALS_JSON` | ✅ | Path to (or contents of) a Google service-account JSON key |

---

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes and ensure `mvn test` passes.
3. Open a pull request with a clear description of the change.
