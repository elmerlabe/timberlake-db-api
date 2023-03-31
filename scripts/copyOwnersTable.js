const { Owner, PropertyOwner, Property } = require("../models");
const sequelize = require("../sequelize");

const copyOwnersTable = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const owners = await Owner.findAll();
    const properties = [];
    const owner1 = [];
    const owner2 = [];
    let cnt = 0;

    for (const owner of owners) {
      cnt++;
      properties.push({
        address:
          owner.addressNumber === "Vacant"
            ? owner.dir + " " + owner.streetName.toLowerCase()
            : owner.addressNumber +
              " " +
              owner.dir +
              " " +
              owner.streetName.toLowerCase(),
        city: owner.city.toLowerCase(),
        state: owner.state.toLowerCase(),
        zip: owner.zip.toLowerCase(),
        remarks: owner.addressNumber === "Vacant" ? "Vacant" : "",
      });

      //Owner 1
      owner1.push({
        firstName: owner.firstNameOwner1.toLowerCase(),
        lastName: owner.lastName.toLowerCase(),
        phone: owner.owner1Telephone,
        email: owner.owner1Email.toLowerCase(),
        ownerOrder: 1,
        PropertyId: cnt,
      });

      // Owner2
      const owner2Name = owner.firstNameOwner2.toLowerCase();
      const owner2Email = owner.owner2Email.toLowerCase();
      const owner2Phone = owner.owner2Telephone;

      if (owner2Name.length >= 1 || owner2Email.length >= 1) {
        owner2.push({
          firstName: owner2Name,
          lastName: "",
          phone: owner2Phone,
          email: owner2Email,
          ownerOrder: 2,
          PropertyId: cnt,
        });
      }
    }

    await Property.bulkCreate(properties);
    await PropertyOwner.bulkCreate(owner1);
    await PropertyOwner.bulkCreate(owner2);

    console.log("Data successfully copied!");
  } catch (error) {
    console.error(error);
  }
};

copyOwnersTable();
