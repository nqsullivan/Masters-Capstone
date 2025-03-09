import express from 'express';
import cors from 'cors';
import routes from './src/routes/index.js';
import AuthService from './src/services/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

AuthService.init();

app.use(
  cors({
    origin: 'http://localhost:4200',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`S3 Bucket Name: ${process.env.BUCKET_NAME}`);
});
