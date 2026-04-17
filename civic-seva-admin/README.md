# Civic Seva - Admin Dashboard 💻

The administrative control center for the Civic Seva platform. Built with React and Vite, this dashboard provides city officials with real-time insights and issue management capabilities.

---

## ✨ Features

- **📊 Management Dashboard**: Live summary of open reports, resolved cases, and critical issues.
- **🗺️ Hotspot Monitor**: Interactive heatmap visualization using Mapbox to identify high-density problem areas.
- **🗂️ Complaint Queue**: Systematic view of all citizen reports with detailed modal views for every issue.
- **🤝 Department Routing**: Automatic categorization and progress tracking for different municipal departments (Roads, Sanitation, Electricity, etc.).
- **🔒 Secure Login**: Google Authentication integrated via Firebase for authorized personnel access.

---

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Backend SDK**: [Firebase JS SDK](https://firebase.google.com/docs/web/setup) (Auth, Firestore)
- **Maps**: [Mapbox GL JS](https://www.mapbox.com/mapbox-gl-js) for heatmaps
- **Routing**: [React Router](https://reactrouter.com/)
- **Styling**: Modern Vanilla CSS3 with flex/grid layouts

---

## 🏗️ Folder Structure

```text
src/
├── components/    # Reusable UI components (Heatmap, Modal, Card)
├── hooks/         # Custom React hooks (useReports)
├── lib/           # Configuration files (Firebase, Mapbox)
├── assets/        # Project logos and background images
├── App.jsx        # Root application logic and routing
└── main.jsx       # Entry point
```

---

## 🚀 Getting Started

### Prerequisites
1. Install [Node.js](https://nodejs.org/) (v18+ recommended).
2. Set up a **Firebase Web App** and enable:
   - Google Sign-in
   - Cloud Firestore (with appropriate Security Rules)
3. Obtain a **Mapbox Public Access Token**.

### Installation

1. **Clone the repo** (if not already done):
   ```bash
   git clone https://github.com/Kachuaofficial/Civic-Seva.git
   cd Civic-Seva/civic-seva-admin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 📄 License
This project is licensed under the MIT License.
