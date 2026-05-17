# 🚀 Madadgar: Google Cloud VM Deployment Guide

This guide will walk you through deploying your **Madadgar FastAPI backend** and **PostgreSQL database** to Google Cloud Platform (GCP) using your Google Cloud Credits. 

We will use a **Google Compute Engine (GCE) VM Instance** running Ubuntu, which allows you to run your existing `docker-compose.yml` file out of the box with **zero code modifications**.

---

## 📋 Table of Contents
1. [Step 1: Create a VM Instance on GCP](#step-1-create-a-vm-instance-on-gcp)
2. [Step 2: Create a GCP Firewall Rule (Crucial)](#step-2-create-a-gcp-firewall-rule-crucial)
3. [Step 3: Connect to your VM & Install Docker](#step-3-connect-to-your-vm--install-docker)
4. [Step 4: Clone & Launch the App](#step-4-clone--launch-the-app)
5. [Step 5: Connect your Mobile App (Expo)](#step-5-connect-your-mobile-app-expo)

---

## 🖥️ Step 1: Create a VM Instance on GCP

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (where your credits are active).
3. Navigate to **Compute Engine** $\rightarrow$ **VM Instances** and click **Create Instance**.
4. Set the following options:
   * **Name**: `madadgar-backend`
   * **Region & Zone**: Choose the closest region to you (e.g. `us-central1` or `asia-south1`).
   * **Machine Type**: `e2-medium` (2 vCPU, 4 GB memory) — plenty of power for this application and fits nicely within free tiers/credits.
   * **Boot Disk**: Click **Change** and choose:
     * **Operating System**: `Ubuntu`
     * **Version**: `Ubuntu 22.04 LTS`
     * **Size**: `20 GB` (Standard persistent disk)
   * **Firewall**: Check **Allow HTTP traffic** and **Allow HTTPS traffic**.
5. Click **Create** and wait 1 minute for your VM to launch.
6. Note down your VM's **External IP** address (e.g., `35.244.12.34`).

---

## 🔒 Step 2: Create a GCP Firewall Rule (Crucial)

By default, GCP blocks all incoming traffic to custom ports. Since your backend runs on port **8000**, you must open this port so your Expo mobile app can connect to it.

1. In the GCP Console, search for **VPC network** in the top search bar and click on it.
2. Select **Firewall** in the left sidebar.
3. Click **Create Firewall Rule** at the top.
4. Set the following settings:
   * **Name**: `allow-madadgar-api`
   * **Targets**: Select **All instances in the network**.
   * **Source IP ranges**: Set to `0.0.0.0/0` (Allows connection from any mobile phone).
   * **Protocols and ports**: Check **Specified protocols and ports** $\rightarrow$ check **TCP** $\rightarrow$ enter `8000`.
5. Click **Create**.

---

## 🔑 Step 3: Connect to your VM & Install Docker

1. Back in the **VM Instances** screen, click the **SSH** button next to your `madadgar-backend` instance to open a terminal in your browser.
2. Update your package manager:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```
3. Install Docker:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```
4. Install Docker-Compose:
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
5. Test that both are installed:
   ```bash
   docker --version
   docker-compose --version
   ```

---

## 🛠️ Step 4: Clone & Launch the App

Now inside your VM SSH terminal:

1. Clone your GitHub repository:
   ```bash
   git clone https://github.com/NailaYaqoob/madadgar.git
   cd madadgar
   ```
2. Create your `.env` file for your AI variables:
   ```bash
   nano .env
   ```
3. Paste in your keys and settings:
   ```env
   OPENAI_API_KEY=your_actual_openai_key
   GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```
   *(Press `Ctrl + O` to save, `Enter` to confirm, and `Ctrl + X` to exit).*
4. Start your backend services in the background:
   ```bash
   sudo docker-compose up --build -d
   ```
5. Verify that your containers are active:
   ```bash
   sudo docker-compose ps
   ```
6. You can test if the API is publicly live by opening `http://<YOUR_VM_EXTERNAL_IP>:8000/docs` in your web browser. You should see the FastAPI Swagger UI!

---

## 📱 Step 5: Connect your Mobile App (Expo)

Now that your backend is running 24/7 on Google Cloud, you just need to point your mobile app to it.

1. In your local development machine, open **[config.js](file:///e:/Madadgar/mobile/src/config.js)**.
2. Replace your local IP address with your new **GCP VM External IP** address:
   ```javascript
   export const API_BASE_URL = 'http://<YOUR_VM_EXTERNAL_IP>:8000/api/v1';
   ```
3. Run your Expo app locally (`npx expo start`) or build your APK (`eas build`). It will now communicate with your live cloud backend and database from anywhere in the world!
