import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'school_user',
  password: 'Aryan@0027',
  database: 'schoolDB',
};

export const getConnection = async () => {
  return await mysql.createConnection(dbConfig);
};
