const express = require("express");
const fs = require("fs/promises");
const bodyParser = require("body-parser");
const uniqId = require("uniqid");
const cors = require("cors");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

async function retrieveData(collection) {
  const fileName = `${__dirname}/../data/${collection}.json`;
  let original = await fs.readFile(fileName, { encoding: "utf8" });
  return JSON.parse(original);
}

function saveFile(data, collection) {
  const dataStringified = JSON.stringify(data);
  const fileName = `${__dirname}/../data/${collection}.json`;
  fs.writeFile(fileName, dataStringified, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("File written");
    }
  });
}

app.get("/api/all-files", async (req, res) => {
  const data = {};

  const products = await retrieveData("products");
  const articles = await retrieveData("articles");

  data.products = products;
  data.articles = articles.articles;

  res.send(data);
});

app.get("/api/:collection", async (req, res) => {
  const fileContents = await fs.readFile(
    __dirname + `/../data/${req.params.collection}.json`,
    { encoding: "utf8" }
  );
  res.send(fileContents);
});

app.post("/api/products", async (req, res) => {
  //Add ID and date to new Item
  const newFile = req.body;
  const date = new Date();
  newFile.date = date.toDateString();
  newFile.id = uniqId("pd-");

  // Update Products
  let original = await retrieveData("products");
  original[req.body.category].unshift(newFile);

  //Save File
  saveFile(original, "products");

  res.send({ message: `New product ${newFile.name} created.` });
});

app.patch("/api/products", async (req, res) => {
  // load original file
  let original = await retrieveData("products");

  const catArray = original[req.body.prevCat];
  const index = catArray.findIndex((item) => {
    return item.id === req.body.id;
  });

  if (req.body.category === req.body.prevCat) {
    original[req.body.category][index] = req.body;
  } else {
    original[req.body.category].unshift(req.body);
    original[req.body.prevCat].splice(index, 1);
  }
  saveFile(original, "products");

  res.send({ message: `${req.body.name} has been updated` });
});

app.patch("/api/products/:category/reorder", async (req, res) => {
  const { source, destination } = req.body;
  let original = await retrieveData("products");

  var updatedList = original[req.params.category];
  const [reorderedItem] = updatedList.splice(source, 1);
  updatedList.splice(destination, 0, reorderedItem);

  original[req.params.category] = updatedList;

  saveFile(original, "products");

  res.send({ message: "List has been updated" });
});

app.delete("/api/products/:category/:id", async (req, res) => {
  const { category, id } = req.params;
  let original = await retrieveData("products");

  original[category] = original[category].filter((item) => item.id != id);

  saveFile(original, "products");

  res.send({ message: "Successfully deleted this item" });
});

//Articles ////////////////////////////////////////////////////////////

app.post("/api/articles", async (req, res) => {
  const newFile = req.body;
  const date = new Date();
  newFile.date = date.toDateString();
  newFile.id = uniqId("ar-");

  let original = await retrieveData("articles");

  original.articles.unshift(newFile);

  saveFile(original, "articles");

  res.send({ message: "recieved!" });
});

app.patch("/api/articles", async (req, res) => {
  // load original file
  let original = await retrieveData("articles");

  const index = original.articles.findIndex((item) => {
    return item.id === req.body.id;
  });

  original.articles[index] = req.body;

  saveFile(original, "articles");

  res.send({ message: `${req.body.name} has been updated` });
});

app.patch("/api/articles/reorder", async (req, res) => {
  const { source, destination } = req.body;
  let original = await retrieveData("articles");

  var updatedList = original.articles;
  const [reorderedItem] = updatedList.splice(source, 1);
  updatedList.splice(destination, 0, reorderedItem);

  original.articles = updatedList;

  saveFile(original, "articles");

  res.send({ message: "List has ben updated" });
});

app.delete("/api/articles/:id", async (req, res) => {
  const { id } = req.params;
  let original = await retrieveData("articles");

  original.articles = original.articles.filter((item) => item.id != id);
  saveFile(original, "articles");

  res.send({ message: "Successfully deleted this item" });
});

// HOME /////////////////////////////////////////////////////////////////

app.patch("/api/home", (req, res) => {
  const data = JSON.stringify(req.body);
  fs.writeFile(`${__dirname}/../data/home.json`, data, (err) => {
    if (err) {
      console.log(err);
      res.send({ message: "An error occurred" });
    }
  });
  res.send({ message: "Successfully updated the homepage" });
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
