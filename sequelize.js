const { Sequelize } = require("sequelize");

const dialectOptions = {};

if (process.env.NODE_ENV === "production") {
  dialectOptions.ssl = {
    rejectUnauthorized: process.env.NODE_ENV !== "production",
  };
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  dialectOptions,
});

module.exports = sequelize;
