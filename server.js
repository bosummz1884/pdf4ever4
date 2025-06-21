const express = require('express');
const path = require('path');
const app = express();

const dist = path.join(__dirname, 'dist');

// Serve static files from dist/
app.use(express.static(dist, { index: false }));

// Fallback for SPA: serve index.html for any route not matched
app.get('*', (req, res) => {
  res.sendFile(path.join(dist, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF4EVER app is running on port ${PORT}`);
});
