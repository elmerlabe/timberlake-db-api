require("dotenv").config();
const { Owner, HomeOwner, Resident } = require("../models");
const sequelize = require("../sequelize");

const dumpOwner = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    const owners = await Owner.findAll();
    let homeOwners = [];
    let residents = [];
    let cnt = 0;

    for (const owner of owners) {
      //Owner table data to HomeOwner table
      cnt++;
      homeOwners.push({
        id: cnt,
        firstName: owner.firstNameOwner1.toLowerCase(),
        lastName: owner.lastName.toLowerCase(),
        address: owner.addressNumber.includes("Vacant")
          ? ""
          : owner.addressNumber +
            " " +
            owner.dir +
            " " +
            owner.streetName.toLowerCase(),
        city: owner.city.toLowerCase(),
        state: owner.state.toLowerCase(),
        zip: owner.zip.toLowerCase(),
        code: owner.owner1Code,
        mobilePhone: owner.owner1Telephone,
        email: owner.owner1Email.toLowerCase(),
        remarks: owner.addressNumber.includes("Vacant") ? "Vacant" : "",
      });

      // Owner2 data to Resident table
      const owner2Name = owner.firstNameOwner2.toLowerCase();
      const owner2Email = owner.owner2Email.toLowerCase();
      const owner2Mobile = owner.owner2Telephone;
      const owner2Code = owner.owner2Code;

      if (
        owner2Name.length >= 1 ||
        owner2Email.length >= 1 ||
        owner2Mobile.length >= 1
      ) {
        residents.push({
          HomeOwnerId: cnt,
          firstName: owner2Name,
          lastName: "",
          code: owner2Code,
          email: owner2Email,
          mobilePhone: owner2Mobile,
          remarks: "",
        });
      }
    }

    await HomeOwner.bulkCreate(homeOwners);
    await Resident.bulkCreate(residents);
    //console.log(homeOwners);

    console.log("Data successfully dumped!");
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  dumpOwner();
})();
