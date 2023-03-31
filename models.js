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

//Original data backup
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

// Property
const Property = sequelize.define("Properties", {
  address: DataTypes.STRING,
  city: DataTypes.STRING,
  state: DataTypes.STRING,
  zip: DataTypes.STRING,
  remarks: DataTypes.STRING,
});

// Owner
const PropertyOwner = sequelize.define("PropertyOwner", {
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  ownerOrder: DataTypes.INTEGER,
});

Property.hasMany(PropertyOwner);
PropertyOwner.belongsTo(Property);

module.exports = { Owner, User, Property, PropertyOwner };
