import express from 'express';
import cors from 'cors';
import expensesRouter from './routes/expenses';
import categoriesRouter from './routes/categories';
import insightsRouter from './routes/insights';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/insights', insightsRouter);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
