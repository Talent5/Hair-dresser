# CurlMap - Hair Stylist Booking Platform

![CurlMap Logo](https://via.placeholder.com/150)

CurlMap is a comprehensive booking platform that connects clients with talented hair stylists. This project includes a mobile application for clients and stylists, a powerful backend server, and an admin dashboard for managing the platform.

## ✨ Features

### 📱 Mobile App (`CurlMap-main`)

*   **Client Features:**
    *   Browse stylist profiles and portfolios.
    *   Search for stylists by location, services, and availability.
    *   Book appointments with real-time availability.
    *   Secure in-app payments.
    *   Real-time chat with stylists.
    *   Leave reviews and ratings.
*   **Stylist Features:**
    *   Create and manage a professional profile.
    *   Set availability and manage services.
    *   Accept and manage bookings.
    *   Track earnings and payments.
    *   Real-time chat with clients.

### ⚙️ Backend (`Backend`)

*   RESTful API for the mobile app and admin dashboard.
*   User authentication and authorization with JWT.
*   Real-time chat with Socket.io.
*   Database management with Mongoose.
*   Secure payment processing.

### 🖥️ Admin Dashboard (`Admin_Dashboard`)

*   Manage users, stylists, and bookings.
*   View platform analytics and reports.
*   Content management for the platform.
*   User-friendly interface built with React.

## 🚀 Tech Stack

*   **Mobile App:** React Native, Expo, Redux, Socket.io Client
*   **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, JWT
*   **Admin Dashboard:** React, Vite, Tailwind CSS, Chart.js
*   **Deployment:** (Please specify your deployment platforms, e.g., Vercel, Heroku, AWS)

## 📂 Project Structure

The project is organized into three main directories:

*   `CurlMap-main/`: The React Native mobile application for clients and stylists.
*   `Backend/`: The Node.js backend server that powers the platform.
*   `Admin_Dashboard/`: The React-based admin dashboard for platform management.

## 🏁 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm installed.
*   MongoDB installed and running.
*   Expo Go app on your mobile device (for running the mobile app).

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your_username/hair-dresser.git
    cd hair-dresser
    ```

2.  **Backend Setup:**
    ```sh
    cd Backend
    npm install
    cp .env.example .env 
    # Add your MongoDB connection string and other environment variables to .env
    npm run dev
    ```

3.  **Admin Dashboard Setup:**
    ```sh
    cd ../Admin_Dashboard
    npm install
    npm run dev
    ```

4.  **Mobile App Setup:**
    ```sh
    cd ../CurlMap-main
    npm install
    npm start
    ```
    Scan the QR code with the Expo Go app on your phone.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your_username/hair-dresser/issues).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
