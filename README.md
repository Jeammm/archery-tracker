# Archery Tracker  
This project is an Archery Tracking System designed to automate scoring and posture tracking using camera feeds. It features a web-based interface for users to join and view training sessions, review statistics, and monitor posture using pose estimation.

## Project Structure
The repository is organized into the following main components:

- **backend**: A Flask-based API handling video processing, session management, and communication with Redis and other services like Celery for task management.
- **frontend**: A React-based web application that interacts with the backend, manages user sessions, and displays tracking data and statistics.
- **nginx**: Configuration files for Nginx to serve the frontend and reverse proxy the backend.

### Backend
The backend is built using Flask and includes multiple services:

- **Celery**: For asynchronous task processing, such as video processing and uploading.
- **Redis**: Used as a broker and backend for Celery tasks.
- **Pose Estimation**: A module for analyzing video frames to detect and evaluate archery posture.

#### Key Files:

- `Dockerfile`: Docker setup for the backend service.
- `requirements.txt`: Python dependencies.
- `config.py`: Configuration file for environment settings.
- `Controllers:` API endpoints for handling authentication, session management, and video processing.
- `Core Module`: Core logic for analyzing and scoring posture based on video data.

### Frontend
The frontend is a React application that connects with the backend to provide an interactive user interface for managing and viewing training sessions, scores, and statistics.

#### Key Files:

- `src/pages`: Contains the main pages like training session initiation, stats, and  account management.
- `src/services`: Manages API calls, Firestore integration, and WebSocket communication.
- `src/types`: Type definitions for TypeScript components and services.
- `src/utils`: Utility functions for camera management, canvas drawing, and score formatting.

### Nginx
The Nginx configuration is used to serve the frontend and proxy requests to the backend, ensuring secure communication between services.

## Setup and Installation
### Prerequisites
- Docker and Docker Compose installed.
- Redis and Celery set up as services.
- Python (for backend development) and Node.js (for frontend development).

### Running the Application
1. Clone the repository:
```bash
git clone https://github.com/yourusername/archery-tracker.git
```

2. Build and run the services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: `http://localhost`
- Backend API: `http://localhost/api`

## Development Environment Setup
To set up the development environment, follow these steps:

### 1. Clone the Repository
Clone the project repository to your local machine.

### 2. Create Environment Variables
Copy the `.env.example` file to `.env` and fill in the required values.
```bash
cp .env.example .env
```
Make sure to configure all the necessary variables for both frontend and backend, such as `VITE_BACKEND_URL`, `MONGODB_URI`, `BYTEARK_TOKEN`, and others. Refer to the `.env.example` file for details.

### 3. Generate Self-Signed Certificates
For development, you need to create self-signed certificates. Place the generated certificate files (`selfsigned.crt` and `selfsigned.key`) in the `/certs` folder located in the root of the project.

#### To generate a self-signed certificate:
Run the following command in your terminal:
```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/selfsigned.key -out certs/selfsigned.crt
```
You will be prompted to enter details such as country, state, locality, etc. You can either fill these in or leave them blank for development purposes.

This will create the following files:

- `/certs/selfsigned.crt`
- `/certs/selfsigned.key`

#### 4. Start the Development Environment
You can now start the development environment using Docker Compose. This will spin up both the frontend and backend services along with any other dependencies.
```bash
docker-compose up
```

#### 5. Access the Application
Once the services are up, you can access the frontend at:
```
https://localhost
```
If you encounter a browser warning about the certificate being self-signed, you can safely ignore it for development purposes. Alternatively, add an exception in your browser settings.

## Features
- **Pose Estimation**: Track archery posture and score shots using video analysis.
- **Session Management**: Users can initiate and join training sessions, with real-time feedback.
- **Stat Tracking**: View past sessions, analyze scores, and track progress.


## Environment Variables

To run this project, you need to set up environment variables for both the frontend and backend. You can use the `.env.example` file as a template. 

1. **Create a `.env` file** in the root of your project.
2. **Copy the content** from `.env.example` and fill in the appropriate values:
   - Replace placeholders like `your-firebase-api-key`, `your-cloudinary-api-secret`, etc., with your actual keys and values.
   - Ensure you have the correct values for services like MongoDB, Firebase, ByteArk, and SendGrid.

Make sure to **keep this file secure** and **never commit it to version control**.