const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "faceattend",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? (msg) => console.log("[SQL]", msg) : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { underscored: true, timestamps: true },
  }
);

module.exports = sequelize;
