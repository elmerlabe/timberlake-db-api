const { Owner, PropertyOwner, SubOwner } = require("../models");
const sequelize = require("../sequelize");

const copyOwnersTable = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const owners = await Owner.findAll();
    const propertyOwners = [];
    const subOwners = [];
    let cnt = 0;

    for (const owner of owners) {
      cnt++;
      propertyOwners.push({
        firstName: owner.firstNameOwner1.toLowerCase(),
        lastName: owner.lastName.toLowerCase(),
        phone: owner.owner1Telephone,
        email: owner.owner1Email.toLowerCase(),
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

      // Sub Owner
      const owner2Name = owner.firstNameOwner2.toLowerCase();
      const owner2Email = owner.owner2Email.toLowerCase();
      const owner2Phone = owner.owner2Telephone;

      if (owner2Name.length >= 1 || owner2Email.length >= 1) {
        subOwners.push({
          firstName: owner2Name,
          lastName: "",
          phone: owner2Phone,
          email: owner2Email,
          ownerOrder: 1,
          PropertyOwnerId: cnt,
        });
      }
    }

    await PropertyOwner.bulkCreate(propertyOwners);
    await SubOwner.bulkCreate(subOwners);

    console.log("Data successfully copied!");
  } catch (error) {
    console.error(error);
  }
};

copyOwnersTable();
