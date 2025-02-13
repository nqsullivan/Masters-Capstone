import express from 'express';
import routes from './src/routes/index.ts';
import AuthService from './src/services/auth.ts';

const app = express();
const port = process.env.PORT || 3000;

AuthService.init();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

