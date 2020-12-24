const Sequelize = require('sequelize');

const sequelize = new Sequelize(
    'nodejs-course-project',
    'root',
    'Password@123',
    {
        dialect: 'mysql',
        host: 'localhost',
    }
);

module.exports = sequelize;
