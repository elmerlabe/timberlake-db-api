require("dotenv").config();
const { Owner, User } = require("./models");

const jwt = require("jsonwebtoken");
const bycrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;
const { Sequelize, where, Op } = require("sequelize");
const sequelize = new Sequelize(process.env.DATABASE_URL);

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
  const totalOwners = await Owner.count();
  const totalVacant = await Owner.findAndCountAll({
    where: { addressNumber: { [Op.iLike]: "vacant" } },
  });
  const totalReserved = await Owner.findAndCountAll({
    where: {
      [Op.or]: {
        owner1Code: { [Op.iLike]: `%rsvd%` },
        owner2Code: { [Op.iLike]: `%rsvd%` },
      },
    },
  });

  return res.json({
    totalOwners: totalOwners,
    totalVacant: totalVacant.count,
    totalReserved: totalReserved.count,
  });
});

app.get("/getOwnersPerStreet/:street", validateToken, async (req, res) => {
  const street = req.params.street;
  const { count } = await Owner.findAndCountAll({
    where: { streetName: { [Op.iLike]: `%${street}%` } },
  });
  return res.json({ totalOwnersPerStreet: count });
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

app.get("/getOwnersDataById/:id", validateToken, async (req, res) => {
  const id = req.params.id;

  const owner = await Owner.findAll({
    where: {
      id: id,
    },
  });
  return res.json(owner);
});

app.delete("/deleteOwnerById/:id", validateToken, async (req, res) => {
  const id = req.params.id;

  try {
    Owner.destroy({
      where: {
        id: id,
      },
    });
    return res.json({ message: "Records has been deleted.", success: true });
  } catch (e) {
    return res.json({ message: e, success: false });
  }
});

app.post("/addNewOwner", validateToken, async (req, res) => {
  const owner = req.body.data;

  try {
    await Owner.bulkCreate([owner]);
    return res.json({ message: "Successfully added!", success: true });
  } catch (error) {
    console.log(error);
    return res.json({ message: error });
  }
});

app.put("/updateOwner/:id", validateToken, async (req, res) => {
  const id = req.params.id;
  const data = req.body.data;

  try {
    await Owner.update(data, {
      where: {
        id: id,
      },
    });
    return res.json({ result: true, message: "Successfully updated!" });
  } catch (e) {
    return res.json({ message: e });
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
    await Owner.sync({ alter: true });
    await User.sync({ alter: true });

    app.listen(port, () =>
      console.log(`Server running. Listening on port ${port}`)
    );
  } catch (error) {
    console.log("Unable to connect to the database", error);
  }
};

startApp();
