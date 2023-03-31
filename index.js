require("dotenv").config();
const { Owner, User, Property, PropertyOwner } = require("./models");

const jwt = require("jsonwebtoken");
const bycrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;
const { where, Op } = require("sequelize");
const sequelize = require("./sequelize");

app.use(express.json());
app.use(cors());

app.get("/", async (req, res) => {
  res.json({ message: "API in online" });
});

app.post("/getUserFromToken", async (req, res) => {
  const { token } = req.body;
  let user = null;

  if (token) {
    try {
      const jwtResult = jwt.verify(token, process.env.JWT_SECRET);
      user = await User.findByPk(jwtResult.id);
    } catch (error) {
      console.error(error);
    }
  }

  return res.json({
    success: user ? true : false,
    user: user
      ? { id: user.id, name: user.name, username: user.username }
      : null,
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username: username } });

  if (user) {
    const isValid = await bycrypt.compare(password, user.password);
    if (isValid) {
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
      return res.json({
        success: true,
        id: user.id,
        username: user.username,
        name: user.name,
        token: token,
      });
    } else {
      return res.json({ success: false, message: "Invalid password" });
    }
  } else {
    return res.json({ success: false, message: "Invalid username" });
  }
});

app.post("/signup", async (req, res) => {
  const { username, password, name } = req.body;
  const hasUser = await User.findOne({ where: { username: username } });
  const saltRounds = 10;

  if (!hasUser) {
    await User.create({
      username: username,
      password: await bycrypt.hash(password, saltRounds),
      name: name,
    });
    return res.json({ result: true, message: "Successfully registered!" });
  } else {
    return res.json({ result: false, message: "Existing username!" });
  }
});

app.get("/getDatabaseSummary", validateToken, async (req, res) => {
  const totalOwners = await PropertyOwner.count();
  const totalProperties = await Property.count();

  return res.json({
    totalOwners: totalOwners,
    totalProperties: totalProperties,
  });
});

app.get("/getOwnersPerStreet/:street", validateToken, async (req, res) => {
  const street = req.params.street;
  const totalOwnersPerStreet = await Property.count({
    where: { address: { [Op.iLike]: `%${street}%` } },
  });
  return res.json({ totalOwnersPerStreet: totalOwnersPerStreet });
});

app.post("/addNewPropertyOwner", async (req, res) => {
  const data = req.body;
  const owners = data.owners;
  const { address, city, state, zip, remarks } = data.property;
  let cnt = 0;

  try {
    const newProperty = await Property.create({
      address,
      city,
      state,
      zip,
      remarks,
    });

    for (const owner of owners) {
      cnt++;
      await PropertyOwner.create({
        firstName: owner.firstName,
        lastName: owner.lastName,
        phone: owner.phone,
        email: owner.email,
        ownerOrder: cnt,
        PropertyId: newProperty.id,
      });
    }
    return res.json({ success: true, message: "New property owner added!" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
});

app.put("/updatePropertyOwner/:id", validateToken, async (req, res) => {
  const propertyId = parseInt(req.params.id);
  const data = req.body;

  try {
    const property = await Property.findByPk(propertyId);

    property.update(data.property);

    for (const owner of data.owners) {
      const pId = parseInt(owner.id);

      // Add new owner if id not exist
      if (!pId) {
        await PropertyOwner.create({
          firstName: owner.firstName,
          lastName: owner.lastName,
          phone: owner.phone,
          email: owner.email,
          ownerOrder: data.owners.length,
          PropertyId: property.id,
        });
      } else {
        await PropertyOwner.update(
          {
            firstName: owner.firstName,
            lastName: owner.lastName,
            phone: owner.phone,
            email: owner.email,
          },
          {
            where: {
              id: pId,
            },
          }
        );
      }
    }

    return res.json({
      success: true,
      message: "Successfully updated!",
    });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
});

app.delete("/deletePropertyOwner/:id", validateToken, async (req, res) => {
  const id = req.params.id;

  try {
    await PropertyOwner.destroy({ where: { id: id } });
    return res.json({ message: "Successfully deleted" });
  } catch (error) {
    console.error(error);
    return res.json({ success: false, message: error.message });
  }
});

app.delete(
  "/deleteAPropertyRecords/:propertyId",
  validateToken,
  async (req, res) => {
    const propertyId = req.params.propertyId;

    try {
      const property = await Property.findByPk(propertyId, {
        include: PropertyOwner,
      });
      property.destroy();

      return res.json({ message: "Successfully deleted" });
    } catch (error) {
      return res.json({ message: error.message });
    }
  }
);

app.get("/getPropertyById/:id", validateToken, async (req, res) => {
  const propertyId = req.params.id;
  const property = await Property.findOne({
    where: { id: propertyId },
    include: PropertyOwner,
  });

  return res.json({ property: property });
});

app.get("/search", validateToken, async (req, res) => {
  if (!req.query.limit && !req.query.page) {
    return res.json({ success: false, message: "Lacking query parameters" });
  }

  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const offset = page * limit;
  const q = req.query.q;
  const sel = req.query.sel;
  let where1 = {};
  let where2 = {};

  if (sel === "name") {
    where1 = {
      [Op.or]: [
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
        { phone: { [Op.iLike]: `%${q}%` } },
        { email: { [Op.iLike]: `%${q}%` } },
      ],
    };
    where2 = {};
  } else if (sel === "address") {
    where2 = {
      [Op.or]: [
        { address: { [Op.iLike]: `%${q}%` } },
        { city: { [Op.iLike]: `%${q}%` } },
        { state: { [Op.iLike]: `%${q}%` } },
        { zip: { [Op.iLike]: `%${q}%` } },
      ],
    };
    where1 = {};
  }

  const properties = await Property.findAndCountAll({
    limit,
    offset,
    where: where2,
    include: [
      {
        model: PropertyOwner,
        attributes: ["id", "firstName", "lastName", "phone", "email"],
        where: where1,
      },
    ],
  });

  //return res.json({ success: false, message: "Invalid request" });

  return res.json(properties);
});

app.get("/getPropertyOwners", validateToken, async (req, res) => {
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const ownerOrder = 1;
  const offset = page * limit;
  const street = req.query.street;
  const state = req.query.state;
  const city = req.query.city;
  const search = req.query.search;

  if (limit && page >= 0) {
    let where = {
      address: {
        [Op.iLike]: `%${street}%`,
      },
      state: { [Op.iLike]: state },
      city: { [Op.iLike]: city },
    };

    !street ? delete where.address : null;
    !state ? delete where.state : null;
    !city ? delete where.city : null;
    //!search ? delete where[0] : null;

    const properties = await Property.findAll({
      limit,
      offset,
      where,
      include: [{ model: PropertyOwner }],
    });

    const ttlProperties = await Property.count({ where: where });

    return res.json({ count: ttlProperties, properties: properties });
  } else {
    return res.json({ success: false, message: "Invalid request" });
  }
});

app.get("/getOwnersData", validateToken, async (req, res) => {
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);
  const offset = page * limit;
  const streetName = req.query.street;
  const state = req.query.state;
  const city = req.query.city;
  const search = req.query.search;

  if (limit && page >= 0) {
    let where = {
      [Op.or]: {
        addressNumber: { [Op.iLike]: `%${search}%` },
        owner1Code: { [Op.iLike]: `%${search}%` },
        owner2Code: { [Op.iLike]: `%${search}%` },
        firstNameOwner1: { [Op.iLike]: `%${search}%` },
        lastName: { [Op.iLike]: `%${search}%` },
        owner1Email: { [Op.iLike]: `%${search}%` },
        firstNameOwner2: { [Op.iLike]: `%${search}%` },
        owner2Email: { [Op.iLike]: `%${search}%` },
      },
      streetName: {
        [Op.iLike]: `%${streetName}%`,
      },
      state: {
        [Op.iLike]: state,
      },
      city: {
        [Op.iLike]: city,
      },
    };

    !streetName ? delete where.streetName : null;
    !state ? delete where.state : null;
    !city ? delete where.city : null;
    !search ? delete where[0] : null;

    const owners = await Owner.findAndCountAll({
      where: where,
      limit: limit,
      offset: offset,
    });

    return res.json({ owners: owners });
  } else {
    return res.json({ message: "Invalid request" });
  }
});

app.put("/updateUser/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const { username, password, name } = req.body;
  const hasUser = await User.findOne({
    where: {
      username: username,
      [Op.not]: [{ id: id }],
    },
  });

  if (!hasUser) {
    await User.update(
      {
        name: name,
        username: username,
        password: await bycrypt.hash(password, 10),
      },
      {
        where: {
          id: id,
        },
      }
    );

    return res.json({ success: true, message: "Successfully updated!" });
  } else {
    return res.json({ success: false, message: "Existing username" });
  }
});

// middleware (token authentication)
async function validateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let user = null;
  if (!authHeader) {
    //Unauthorized response
    return res.status(401).json({
      success: false,
      message: "Access token is missing",
      token: authHeader,
    });
  }

  const [, token] = authHeader.split(" "); // ['Bearer', 'token....']

  try {
    const jwtResult = jwt.verify(token, process.env.JWT_SECRET);
    user = await User.findByPk(jwtResult.id);
  } catch (error) {
    console.error(error);
  }

  if (user) {
    next();
  } else {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

const startApp = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });

    app.listen(port, () =>
      console.log(`Server running. Listening on port ${port}`)
    );
  } catch (error) {
    console.log("Unable to connect to the database", error);
  }
};

startApp();
