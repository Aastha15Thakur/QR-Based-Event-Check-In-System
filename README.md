\# QR-Based Event Check-In System



A full-stack event registration and attendance management system using QR codes.



\## 🚀 Live Demo



Frontend:

https://qr-based-event-check-in-system-mu.vercel.app



Backend API:

https://qr-event-checkin-api-1air.onrender.com



API Documentation:

https://qr-event-checkin-api-1air.onrender.com/docs



Admin Dashboard:

https://qr-based-event-check-in-system-mu.vercel.app/admin



\## 📌 Features



\- Participant registration

\- Automatic QR code generation

\- Unique QR code for every participant

\- QR-based event check-in

\- Duplicate check-in prevention

\- Real-time attendance dashboard

\- Attendance statistics

\- Participant attendance tracking

\- REST API with FastAPI

\- Responsive Next.js frontend



\## 🛠️ Tech Stack



\### Frontend

\- Next.js

\- React

\- TypeScript

\- Tailwind CSS



\### Backend

\- Python

\- FastAPI

\- Uvicorn



\### Database

\- SQLite



\### Deployment

\- Vercel — Frontend

\- Render — Backend

\- GitHub — Source Code



\## 🔄 How It Works



1\. A participant enters their name, email, and phone number.

2\. The backend registers the participant.

3\. A unique QR code is generated.

4\. The participant presents the QR code at the event.

5\. The admin scans the QR code.

6\. The backend validates the QR token.

7\. The participant is marked as attended.

8\. The admin dashboard automatically updates the attendance statistics.



\## 📊 Admin Dashboard



The dashboard provides:



\- Total registered participants

\- Total attended participants

\- Participants who have not attended

\- Attendance percentage

\- Participant details

\- Check-in time

\- QR code access



The dashboard refreshes automatically to reflect attendance changes.



\## 🏗️ Project Structure



```text

QR-Based-Event-Check-In-System/

│

├── backend/

│   ├── main.py

│   ├── database.py

│   ├── models.py

│   ├── requirements.txt

│   └── qr\_system.db

│

├── frontend/

│   ├── app/

│   │   ├── admin/

│   │   ├── page.tsx

│   │   ├── layout.tsx

│   │   └── globals.css

│   ├── public/

│   ├── package.json

│   └── next.config.ts

│

└── README.md

