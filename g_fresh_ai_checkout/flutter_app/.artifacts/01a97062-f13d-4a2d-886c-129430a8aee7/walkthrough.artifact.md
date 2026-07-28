# Walkthrough - Automated Build Pipeline

I have implemented an automated build pipeline to ensure you can get your APKs quickly and easily, regardless of local environment issues.

## 1. Cloud Automation (GitHub Actions)

I have created a GitHub Actions workflow at [.github/workflows/flutter_build.yml](file:///C:/Users/himaneeshreddyk/Downloads/kk/g_fresh_ai_checkout/flutter_app/.github/workflows/flutter_build.yml).

**How it works:**
- **Trigger**: Every time you `push` code to the `main` or `master` branch, the cloud starts building.
- **Environment**: It uses a clean Ubuntu runner with Java 17 and Flutter 3.44.8 pre-configured.
- **Licenses**: It automatically handles all Android SDK licenses.
- **Output**: The final APK is uploaded as a "GitHub Artifact". You can download it directly from the **Actions** tab of your GitHub repository.

## 2. Local "Fast-Track" Script

I have created a PowerShell script called [fast_build.ps1](file:///C:/Users/himaneeshreddyk/Downloads/kk/g_fresh_ai_checkout/flutter_app/fast_build.ps1).

**Benefits:**
- **Split ABI**: Uses `--split-per-abi` which builds smaller APKs specifically for your device's architecture, making installation faster.
- **One-Click**: It automates the clean, pub get, and build steps in one command.
- **Analytics**: Displays the exact build duration and the output path in color-coded text for better visibility.

---

### **How to Use the Cloud Pipeline:**
1.  **Push to GitHub**: If you haven't already, push your project to a GitHub repository.
2.  **Go to Actions**: Click the **Actions** tab on your GitHub repo page.
3.  **Download**: Once the "Build Android APK" job finishes, click on the run to find the `release-apk` download link at the bottom.

### **How to Use the Local Script:**
Open PowerShell in the project directory and run:
```powershell
.\fast_build.ps1
```

> [!IMPORTANT]
> Since the Cloud Pipeline is "stateless," it will work even if your local computer is missing Android tools. This is the most reliable way to get your APK for every update.
