require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const promClient = require('prom-client');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Click Counter Schema
const clickSchema = new mongoose.Schema({
  count: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now }
});

const Click = mongoose.model('Click', clickSchema);

// Create a Registry and default metrics
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

// Custom metric: total clicks
const clickCounter = new promClient.Counter({
  name: 'clicks_total',
  help: 'Total number of clicks',
});
register.registerMetric(clickCounter);

// Routes
app.get('/api/clicks', async (req, res) => {
  try {
    let clickData = await Click.findOne();
    if (!clickData) {
      clickData = await Click.create({ count: 0});
    }
    res.json({ 
      count: clickData.count,
      lastUpdated: clickData.lastUpdated
    });
  } catch (error) {
    console.error('Error fetching count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clicks', async (req, res) => {
  try {
    let clickData = await Click.findOne();
    if (!clickData) {
      clickData = await Click.create({ count: 0 });
    }
    clickData.count += 1;
    clickData.lastUpdated = new Date();
    await clickData.save();
    clickCounter.inc(); // Increment Prometheus counter
    res.json({ 
      count: clickData.count,
      lastUpdated: clickData.lastUpdated
    });
  } catch (error) {
    console.error('Error updating count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Expose /metrics endpoint
app.get('/api/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});