# Capstone Team 5: IoT-based Authentication for Automated Classroom Attendance

## Backend Service
The REST backend service is built using Node.js and Express.js with Typescript. 
Use the following script below to install dependencies and start up the server.

Add the `.env` containing S3 access keys and variables to the root of the `server/` directory.
```
.
└── Capstone/
    └── Server/
        └── .env
```

Run the following to boot up the backend service
```bash
cd server
npm install
npm run init-data
npm start
```

Output: 
```
Server is running on port 3000
```