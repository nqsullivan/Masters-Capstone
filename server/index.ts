import express from 'express';
import routes from './src/routes/index.ts';
import AuthService from './src/services/auth.ts';
import dotenv from 'dotenv';

const app = express();
const port = process.env.PORT || 3000;

AuthService.init();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(port, () => {
  dotenv.config();
  console.log(`Server is running on port ${port}`);
  // Example on how to grab environment variables:
  console.log(`S3 Bucket Name: ${process.env.BUCKET_NAME}`);
});
