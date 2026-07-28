# Implementation Plan - G Fresh AI Checkout Enhancements

This plan outlines the steps to add a Login Page, implement a working Camera, and integrate the WhatsApp Invoice MCP Server.

## User Review Required

> [!IMPORTANT]
> The implementation of the "Working Camera" requires `expo-camera`. Please ensure you have it installed by running `npx expo install expo-camera` if the automated sync fails.

## Proposed Changes

### 1. Project Dependencies
#### [MODIFY] [package.json](file:///C:/Users/himaneeshreddyk/Downloads/kk/package.json)
- Add `expo-camera` to dependencies.

### 2. State Management
#### [MODIFY] [ScanContext.js](file:///C:/Users/himaneeshreddyk/Downloads/kk/src/context/ScanContext.js)
- Update `activeStep` to default to `LOGIN`.
- Add a `login` function to capture the customer's phone number and transition to `SCANNING`.
- Update `sendWhatsAppInvoice` to call the local MCP server endpoint.

### 3. UI Components
#### [NEW] [LoginScreen.jsx](file:///C:/Users/himaneeshreddyk/Downloads/kk/src/components/LoginScreen.jsx)
- Create a high-tech login screen to capture the mobile number.

#### [MODIFY] [CameraStream.jsx](file:///C:/Users/himaneeshreddyk/Downloads/kk/src/components/CameraStream.jsx)
- Replace simulated background with `CameraView` from `expo-camera`.
- Handle camera permissions.

#### [MODIFY] [App.jsx](file:///C:/Users/himaneeshreddyk/Downloads/kk/App.jsx)
- Add `LoginScreen` to the step-based rendering logic.

### 4. MCP Server
#### [MODIFY] [mcp_whatsapp_server.py](file:///C:/Users/himaneeshreddyk/Downloads/kk/mcp_whatsapp_server.py)
- Ensure the server is robust and can be easily called by the mobile app.

## Verification Plan

### Automated Tests
- Build the app using `./gradlew assembleDebug` to ensure no syntax errors.

### Manual Verification
1. Launch the app: Should see the **Login Screen**.
2. Enter mobile number: Should transition to **Scanning Screen**.
3. Scanner: Verify the camera is active.
4. Complete checkout: Verify the WhatsApp invoice dispatch calls the MCP server.
