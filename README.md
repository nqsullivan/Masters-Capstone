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

## Release
To perform a release, run the following script to build the project and create a release zip.
```bash
./release.sh
```

This will create a `release/release.zip` file in the root of the project directory. You can test this by cd-ing into the `release/` directory and running the following command. ( To run the docker-compose, you need to have docker installed on your machine. )
```bash
cd release
docker-compose up --build -d
```

This will start up the docker container and run the server on port 3000, the client on port 8080, and the controller on port 5000.