const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

const Owner = sequelize.define("Owner", {
  addressNumber: DataTypes.STRING,
  dir: DataTypes.STRING,
  streetName: DataTypes.STRING,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  zip: DataTypes.STRING,
  firstNameOwner1: DataTypes.STRING,
  lastName: DataTypes.STRING,
  owner1Code: DataTypes.STRING,
  owner1Telephone: DataTypes.STRING,
  owner1Email: DataTypes.STRING,
  firstNameOwner2: DataTypes.STRING,
  owner2Code: DataTypes.STRING,
  owner2Telephone: DataTypes.STRING,
  owner2Email: DataTypes.STRING,
  remarks: DataTypes.STRING,
});

module.exports = { Owner, User };
