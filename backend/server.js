import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: '*'
  })
);
app.use(express.json());

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

app.post('/chat', async (req, res) => {
  try {
    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }
    );

    const data = await response.json();

    // Forward Gemini errors properly
    if (!response.ok || data.error) {
      return res.status(data?.error?.code || response.status || 500).json({
        error: {
          message: data?.error?.message || 'AI service failed'
        }
      });
    }

    // Success
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: { message: 'Server error. Please try again later.' }
    });
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
