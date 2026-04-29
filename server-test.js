// server-test.js (this works with "type": "module")
import express from 'express';

const app = express();
const port = 5000;

app.get('/', (req, res) => {
  res.send('Server is working!');
});

app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
});