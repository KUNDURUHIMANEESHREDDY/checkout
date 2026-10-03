# G Fresh AI Checkout

A supermarket self-checkout prototype: photograph a product label, OCR the text, fuzzy-match it against a product
catalog, add to cart, generate a PDF receipt.

> ⚠️ **This is an AI-assisted prototype, not a product.** It has 11 commits, all from a single day, and the majority
> of the repository is documentation rather than working code. Several parts do not run. Read
> [What actually works](#what-actually-works) and [Known blockers](#known-blockers) before using anything here.

---

## What this actually is

The core loop is: **camera → OCR → fuzzy string match → cart → PDF receipt**.

The product catalog is **5 hardcoded items** (Maggi, Coke, Amul Milk, Lays, Nescafe), duplicated across five
locations, and matching thresholds differ between implementations. This is a demo of the pipeline, not a
production catalog.

There are **four** implementations in this repository, not three, and they are at very different levels of
completion:

| Path | What it is | State |
|---|---|---|
| `g_fresh_ai_checkout/flutter_app/` | Full Flutter app — real on-device ML Kit OCR, local matching, PDF receipts | **Most complete.** The only working OCR in the repo. |
| `react_native_app/` | Expo SDK 50 + TypeScript port | **Newest by intent, does not currently boot** |
| `g_fresh_ai_checkout/lib/main_dynamic.dart` | Orphaned Dart file outside any Flutter project | **Dead** — broken imports, will not compile |
| `android/` | **Contains no code** — only AI agent scratch notes for a different, nonexistent project | Stale |

Three FastAPI backends also exist, all attempting port `8000`:

| File | Purpose | Runnable? |
|---|---|---|
| `cloud_backend.py` | Main backend: products, vision detect, checkout, invoice, WhatsApp resend | **Mostly** — degrades to mock mode without credentials |
| `cloud_backend_dynamic.py` | Google Vision + Gemini LLM variant | No — needs `fitz`, not in `requirements.txt` |
| `vision_ai_server.py` | YOLOv11 + PaddleOCR | No — needs `cv2`, `ultralytics`, `paddleocr`, none listed |

---

## What actually works

Honest inventory, so you know what you can rely on:

- **`flutter_app/lib/utils/ai_extractor.dart`** — the strongest piece of logic in the repo. Uses ML Kit per-line
  `boundingBox.height` to infer brand vs. product name from relative font size, not just string matching. Better
  than its TypeScript and Python siblings.
- **`flutter_app/lib/providers/scan_provider.dart`** — a complete state machine (`ScanIdle` / `ScanSuccess` /
  `ScanNeedsReview`) with a `0.60` auto-add confidence threshold. This is the one place the app logic looks finished.
- **`cloud_backend.py`** — coherent and degrades gracefully to mock mode when Firebase credentials are absent.
- **`aiExtractor.ts`, `receiptService.ts`, `productService.ts`, `useCamera.ts`** — legitimate, readable, non-stub
  TypeScript.

---

## Running the Flutter app

The Flutter app is the only implementation with working OCR.

```bash
cd g_fresh_ai_checkout/flutter_app
flutter pub get
flutter run
```

Requirements: Flutter stable, Dart `>=3.0.0 <4.0.0`, Java 17, Android SDK 36.

> The Flutter build is currently blocked by the missing asset directories and a `google-services.json` package
> mismatch — see [Known blockers](#known-blockers).

---

## Running the backend

```bash
pip install -r requirements.txt

export FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json   # optional; mock mode if absent
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/vision-creds.json   # OCR
export TWILIO_ACCOUNT_SID=...                                       # optional; WhatsApp disabled if absent
export TWILIO_AUTH_TOKEN=...

python cloud_backend.py     # http://localhost:8000
```

Endpoints: `GET /health`, `GET /api/products`, `POST /api/vision/detect`, `POST /api/checkout`,
`GET /api/invoice/{id}`, `POST /api/invoice/{id}/resend`.

OCR uses Google Cloud Vision with a Tesseract fallback.

---

## Known blockers

**React Native app — does not boot:**

1. `expo-image-manipulator` is imported by `useOCR.ts` and `ScanScreen.tsx` but **is not in `package.json`** —
   module-not-found on the first screen.
2. `react-native-mlkit` is `require()`d at `useOCR.ts:164` but not installed — every capture throws. The mock OCR
   lives in `useOCR.production.ts` / `useOCR.fast.ts`, neither of which is imported.
3. `expo-camera` is pinned `~13.10.0` (the SDK 49 set) while the app targets Expo SDK 50, which needs `~14.1.3`.
   The code uses the 13.x `<Camera ref ratio pictureSize>` API; SDK 50 replaced it with `CameraView`.
4. `app.json` references four icon/splash files under `./assets/`, but **`react_native_app/assets/` does not exist**.
5. `jest-expo` is the configured Jest preset but is **not in `devDependencies`** — the test suite cannot start.
6. `useCamera.ts` imports `CameraRecordingOptions`, which neither 13.x nor 14.x exports.
7. `ScanScreen.tsx:62-84` reads `capturedImage` from the closure captured before `await takePicture()` resolves, so
   it is `null` on first press.

**Flutter app:**

8. `pubspec.yaml` declares `assets/images/` and `assets/models/`, but only `assets/data/` exists — Flutter hard-errors
   on a missing asset directory.
9. `android/app/google-services.json` registers `package_name: "com.kk"`, but `build.gradle` sets
   `applicationId "com.gfresh.ai_checkout"` — the plugin fails with *"No matching client found"*.
10. `android/local.properties` is **committed with absolute paths from the original author's machine** (`C:\Users\himaneeshreddyk\...`), breaking every other machine and CI runner.
11. `key.properties` is absent but `build.gradle` wires a release `signingConfig` from it, so
    `flutter build apk --release` — exactly what CI runs — has no valid signing config.
12. `test/widget_test.dart` is the untouched `flutter create` template referencing a non-existent `MyApp`; it will
    not compile.

**Backends:**

13. `cloud_backend.py` applies **18% tax twice** on the PDF receipt — `/api/checkout` computes tax, then
    `generate_pdf_receipt` re-applies `tax_rate=0.18` internally.
14. `send_whatsapp_with_pdf` passes `file://{temp_pdf_path}` to Twilio, which requires a public HTTPS URL — this call
    can never succeed.
15. `cloud_backend_dynamic.py` returns `"whatsapp_sent_to"` for a send that is still a `# TODO`.
16. CORS is `allow_origins=["*"]` with `allow_credentials=True` — self-contradictory and insecure.

---

## Security issues found

**A live Firebase API key is committed** at
`g_fresh_ai_checkout/flutter_app/android/app/google-services.json`:

```json
{ "project_id": "kk-6fcd0", "current_key": "AIzaSyBGCvprUk9xhmPgYKIwDqf46UF5H8FJRKU" }
```

Firebase client keys are lower-sensitivity than server credentials, but this is a real, live key for project
`kk-6fcd0` and should be rotated and removed from version control.

No private keys, `.env` files, or `serviceAccountKey.json` are committed — Twilio and Firebase Admin values are
correctly read from environment variables.

---

## About the reports in this repo

`ADVANCED_EVALUATION_REPORT.md`, `TECHNICAL_ANALYSIS.md`, `COMPLETE_BINDING_SUMMARY.md`, and
`REACT_NATIVE_SUMMARY.txt` are **self-assessments, not benchmarks**. They award the React Native app 9.8/10 and
"APPROVED FOR PRODUCTION" by the same agent that wrote the code they review. The benchmark figures in them
(app size, cold start, memory, "1000 products → ~1s") are estimates with no methodology, no device, and no raw data.

They are also internally contradictory: `ADVANCED_EVALUATION_REPORT.md` claims "No `any` types used" while three
exist, and rates security 5/5 in the same document that lists a Medium-severity "Mock OCR in production".

`REACT_NATIVE_MIGRATION.md` is the most honest of the set — it does state that the OCR is mocked.

**Treat their scores as marketing, not evidence.**

---

## Tests and CI

`.github/workflows/flutter_build.yml` is the only workflow. It builds the **Flutter** APK and uploads it as an
artifact. There is **no CI for the React Native app, no lint step, and no Python test step.**

- **React Native:** 5 spec files, 65 `it()` blocks — but they cannot run (`jest-expo` missing). Several are
  tautologies that recompute the expected value instead of calling the app, and `jest.setup.js` globally silences
  `console.error` and `console.warn`.
- **Flutter:** one test file, the broken `flutter create` template.
- **Python:** zero tests.

---

## Repository hygiene

- Root `.gitignore` is literally wrapped in markdown code fences and omits `node_modules/`, `.expo/`, `.dart_tool/`.
- `babel.config.js` and `metro.config.js` sit at the repo root but no root `package.json` exists and neither preset
  is installed — dead files.
- `g_fresh_ai_checkout/README.md` claims "MIT License — See LICENSE file", but **no LICENSE file exists**.
- Committed build artifacts: `android/build/reports/`, two `.artifacts/` directories of agent scratch output.
- The React Native app has **no lockfile**.

---

## License

No `LICENSE` file is present. `g_fresh_ai_checkout/README.md` references one that does not exist.
