# Civic Seva - Citizen Engagement Platform

[![Flutter](https://img.shields.io/badge/Flutter-v3.22+-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![React](https://img.shields.io/badge/React-v18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Auth/Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Civic Seva** is a comprehensive platform designed to bridge the gap between citizens and municipal authorities. It empowers people to report local issues in real-time and provides authorities with the tools to monitor, analyze, and resolve these problems efficiently.

---

## 🏗️ Project Architecture

The platform consists of two main components:

### 1. [📱 Civic Seva Mobile App](./civic_seva-app/)
A Flutter-based mobile application for citizens.
- **Report Issues**: Easy-to-use interface to submit complaints with location tagging and photo evidence.
- **Heatmap Visualization**: View city-wide problem hotspots to stay informed about your local area.
- **Multilingual Support**: Fully localized in **English** and **Hindi**.
- **User Profiles**: Secure authentication and tracking of submitted reports.

### 2. [💻 Civic Seva Admin Dashboard](./civic-seva-admin/)
A React/Vite dashboard for municipal authorities and administrators.
- **Real-time Monitoring**: Dashboard with live statistics on open, resolved, and critical issues.
- **Hotspot Detection**: Interactive heatmap (powered by Mapbox) to identify high-density problem areas.
- **Automatic Routing**: Intelligent department assignment for faster issue resolution.
- **Queue Management**: Detailed view of all complaints with the ability to update status and priority.

---

## 🛠️ Tech Stack

### Mobile App
- **Language**: Dart
- **Framework**: Flutter
- **State Management**: Provider
- **Backend**: Firebase Authentication, Cloud Firestore, Firebase Storage
- **Maps**: Mapbox Maps SDK for Flutter

### Admin Dashboard
- **Language**: JavaScript (ES6+)
- **Framework**: React.js with Vite
- **Styling**: Vanilla CSS3
- **Backend Integration**: Firebase JavaScript SDK
- **Data Viz**: Custom CSS-based analytics and interactive Mapbox heatmaps

---

## 🚀 Quick Start

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (for the app)
- [Node.js](https://nodejs.org/) (for the admin dashboard)
- A [Firebase Project](https://console.firebase.google.com/) configured with:
  - Authentication (Google Sign-in)
  - Cloud Firestore
  - Firebase Storage

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Kachuaofficial/Civic-Seva.git
   cd Civic-Seva
   ```

2. **Set up the App**:
   Follow the instructions in the [App README](./civic_seva-app/README.md).

3. **Set up the Dashboard**:
   Follow the instructions in the [Admin README](./civic-seva-admin/README.md).

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
