import { Sequelize } from 'sequelize';
import path from 'path';

// Use in-memory database for tests, file-based for development/production
const storage = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : process.env.DB_STORAGE || path.join(__dirname, '../../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage,
  logging: false
});

export default sequelize;
