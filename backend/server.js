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

// Custom metric: total clicks (counter)
const clickCounter = new promClient.Counter({
  name: 'clicks_total',
  help: 'Total number of clicks (incremented per POST)',
});
register.registerMetric(clickCounter);

// Custom metric: current click count (gauge)
const clickGauge = new promClient.Gauge({
  name: 'clicks_current',
  help: 'Current click count from MongoDB',
});
register.registerMetric(clickGauge);

// Custom metric: duration of /api/clicks requests (histogram)
const clicksDuration = new promClient.Histogram({
  name: 'clicks_api_duration_seconds',
  help: 'Duration of /api/clicks requests in seconds',
  labelNames: ['method', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});
register.registerMetric(clicksDuration);

// Routes
app.get('/api/clicks', async (req, res) => {
  const end = clicksDuration.startTimer({ method: 'GET' });
  try {
    let clickData = await Click.findOne();
    if (!clickData) {
      clickData = await Click.create({ count: 0});
    }
    res.json({ 
      count: clickData.count,
      lastUpdated: clickData.lastUpdated
    });
    end({ status: 200 });
  } catch (error) {
    end({ status: 500 });
    console.error('Error fetching count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/clicks', async (req, res) => {
  const end = clicksDuration.startTimer({ method: 'POST' });
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
    end({ status: 200 });
  } catch (error) {
    end({ status: 500 });
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
  try {
    // Fetch current click count from DB
    let clickData = await Click.findOne();
    if (clickData) {
      clickGauge.set(clickData.count);
    } else {
      clickGauge.set(0);
    }
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});