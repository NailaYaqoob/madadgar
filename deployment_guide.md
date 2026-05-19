# 🚀 Madadgar: Google Cloud Deployment Guide

This guide details how to deploy the **Madadgar FastAPI backend** to Google Cloud Platform (GCP) using your Google Cloud Credits. Depending on your needs, you can choose between two deployment strategies:

1. **Option A: Google Compute Engine (VM Instance)** — Best for hosting both the FastAPI backend and the PostgreSQL database together using `docker-compose`.
2. **Option B: Google Cloud Run (Serverless)** — Best for lightweight, auto-scaling API hosting. Highly recommended for hackathon demos (running in mock data mode or connecting to an external cloud database like Supabase/Neon).

---

## 📋 Table of Contents

### [Option A: Google Compute Engine (VM + Docker Compose)](#option-a-google-compute-engine-vm-docker-compose)
1. [Step A1: Create a VM Instance on GCP](#step-a1-create-a-vm-instance-on-gcp)
2. [Step A2: Create a GCP Firewall Rule](#step-a2-create-a-gcp-firewall-rule)
3. [Step A3: Connect to your VM & Install Docker](#step-a3-connect-to-your-vm--install-docker)
4. [Step A4: Clone & Launch the App](#step-a4-clone--launch-the-app)

### [Option B: Google Cloud Run (Serverless Container)](#option-b-google-cloud-run-serverless-container)
1. [Cloud Run Key Considerations](#cloud-run-key-considerations)
2. [Step B1: Enable Cloud Run APIs](#step-b1-enable-cloud-run-apis)
3. [Step B2: Deploy backend with gcloud CLI](#step-b2-deploy-backend-with-gcloud-cli)
4. [Step B3: Deploy backend via GCP Web Console](#step-b3-deploy-backend-via-gcp-web-console)

### [Connecting your Mobile App (Expo)](#-connecting-your-mobile-app-expo)

---

## 🖥️ Option A: Google Compute Engine (VM + Docker Compose)

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

### 🔒 Step A2: Create a GCP Firewall Rule

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

### 🔑 Step A3: Connect to your VM & Install Docker

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

### 🛠️ Step A4: Clone & Launch the App

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

## ⚡ Option B: Google Cloud Run (Serverless Container)

**Google Cloud Run** is a fully-managed serverless platform that automatically scales your containerized application up and down (to zero when there is no traffic). This is highly cost-effective and extremely easy to maintain.

### Cloud Run Key Considerations

1. **Database Connection (Statelessness)**:
   * Cloud Run containers are **ephemeral** (temporary). You cannot run a local PostgreSQL database inside the same container.
   * **For Hackathon/Demo (Quickest & Easiest)**: Run the backend in mock-data mode by setting `USE_MOCK_DATA=true`. No database setup is needed!
   * **For Production**: Set up a **Google Cloud SQL (PostgreSQL)** instance or use a cloud database provider like **Supabase** or **Neon**. Pass the database URL via the `DATABASE_URL` environment variable.
2. **Port Binding**:
   * Cloud Run dynamically assigns a port (usually `8080`) via the `PORT` environment variable. 
   * We have already updated the [Dockerfile](file:///e:/Madadgar/backend/Dockerfile) to dynamically read this environment variable:
     ```dockerfile
     CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
     ```

---

### 🛠️ Step B1: Enable Cloud Run APIs

Before deploying, ensure you have enabled the required APIs in your GCP Console:
1. Search for **Cloud Run API** in the GCP Console search bar and click **Enable**.
2. Search for **Artifact Registry API** and click **Enable** (used to store your Docker container image).

---

### 💻 Step B2: Deploy backend with gcloud CLI

This is the fastest method. It builds your container in the cloud using **Cloud Build** and deploys it to **Cloud Run** in a single command.

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) on your local development machine.
2. Open your terminal in the `backend/` directory:
   ```bash
   cd backend
   ```
3. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```
4. Set your active GCP Project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
5. Deploy the backend:
   ```bash
   gcloud run deploy madadgar-backend \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="USE_MOCK_DATA=true,OPENAI_API_KEY=your_openai_api_key_here,GOOGLE_MAPS_API_KEY=your_maps_key_here"
   ```
   *Note: If you have set up a Cloud SQL database, replace `USE_MOCK_DATA=true` with your database environment variables.*
6. Once completed, the CLI will output a secure **Service URL** (e.g., `https://madadgar-backend-xyz-uc.a.run.app`).

---

### 🖥️ Step B3: Deploy backend via GCP Web Console

If you prefer using the browser, follow these steps:

1. **Create an Artifact Registry Repository**:
   * Search for **Artifact Registry** in the GCP Console.
   * Click **Create Repository**. Name it `madadgar-repo`, select format **Docker**, and choose your region (e.g. `us-central1`).
2. **Build & Push your Container**:
   You can build and push the container to your new registry using standard docker commands or Cloud Build:
   ```bash
   gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/madadgar-repo/backend:latest ./backend
   ```
3. **Deploy on Cloud Run**:
   * Navigate to **Cloud Run** in the GCP Console.
   * Click **Create Service**.
   * Select **Deploy one revision from an existing container image**. Click **Test/Select** and choose the image you just pushed.
   * **Service Name**: `madadgar-backend`
   * **Region**: `us-central1`
   * **CPU Allocation**: Select *CPU is only allocated during request processing* (this scales to zero and costs $0 when idle).
   * **Autoscaling**: Min instances: `0`, Max instances: `5` (to protect your budget/credits).
   * **Ingress Control**: Select *Allow all traffic*.
   * **Authentication**: Select *Allow unauthenticated invocations* (makes the API public for your mobile app).
   * Expand **Container(s), Volumes, Cloud SQL, Connections, Environment Variables**:
     * Under **Variables**, click **Add Variable**:
       * `USE_MOCK_DATA` = `true`
       * `OPENAI_API_KEY` = `your_openai_api_key`
       * `GOOGLE_MAPS_API_KEY` = `your_maps_api_key`
   * Click **Create** at the bottom.
   * Wait ~1-2 minutes. The console will display your secure **Cloud Run URL**!

---

## 📱 Connecting your Mobile App (Expo)

Now that your backend is running 24/7 on Google Cloud (either on a VM or Cloud Run), you just need to point your mobile app to it.

1. In your local development machine, open **[config.js](file:///e:/Madadgar/mobile/src/config.js)**.
2. Replace the `API_BASE_URL` with your GCP endpoint:

   * **If using Option A (GCP VM)**:
     ```javascript
     export const API_BASE_URL = 'http://<YOUR_VM_EXTERNAL_IP>:8000/api/v1';
     ```
   * **If using Option B (Google Cloud Run)**:
     ```javascript
     export const API_BASE_URL = 'https://<YOUR_CLOUD_RUN_URL>/api/v1';
     ```

3. Run your Expo app locally (`npx expo start`) or build it. It will now seamlessly talk to your live Google Cloud-hosted backend from anywhere!
