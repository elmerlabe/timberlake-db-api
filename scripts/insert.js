require("dotenv").config();
const csv = require("csv-parser");
const fs = require("fs");
const results = [];

const { Owner } = require("../models");
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL);

const insert = async () => {
  try {
    await sequelize.authenticate();
    await Owner.sync({ alter: true });

    console.log("Inserting owners record to database...");

    fs.createReadStream("./mockdata/data.csv")
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        const owners = [];

        for (const result of results) {
          owners.push({
            addressNumber: result["ADDRESS NUMBER"],
            dir: result["DIR."],
            streetName: result["STREET NAME"],
            city: result["CITY"],
            state: result["STATE"],
            zip: result["ZIP"],
            firstNameOwner1: result["FIRST NAME OWNER 1"],
            lastName: result["LAST NAME OR DEVELOPER"],
            owner1Code: result["OWNER 1 CODE"],
            owner1Telephone: result["OWNER 1 TELEPHONE"],
            owner1Email: result["OWNER 1 EMAIL"],
            firstNameOwner2: result["FIRST NAME OWNER 2"],
            owner2Code: result["OWNER 2 CODE"],
            owner2Telephone: result["OWNER 2 TELEPHONE"],
            owner2Email: result["OWNER 2 EMAIL"],
            remarks: "",
          });
        }

        //console.log(owners);
        await Owner.bulkCreate(owners);
      });

    console.log("Insert records done!");
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  insert();
})();
