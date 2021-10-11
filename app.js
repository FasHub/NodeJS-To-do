const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Create DB Connection
mongoose.connect("mongodb+srv://admin-fasil:igotpopi@cluster0.oeqjh.mongodb.net/todolistDB");

// Create DB Schema
const itemsSchema = {
  name: String
};

// Create DB Model
const Item = mongoose.model("Item", itemsSchema);

// create defult DB Documents
const food = new Item ({
  name: "Eat nutritious food"
});
const drink = new Item({
  name: "Drink enough water"
});

const sleep = new Item({
  name: "Get enough sleep"
});

const exercise = new Item({
  name: "Do some exercise"
});
const defaultItems = [food, drink, sleep, exercise];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const Category = mongoose.model("Category", listSchema);


app.get("/", function(req, res) {
  Item.find({},function (err, items) {
    if (items.length === 0) {
        // Insert defult DB Documents to DB
        Item.insertMany(defaultItems, function (err) {
          if (err) {
            console.log(err);
          }else {
            console.log("Document Inserted Successfully!");
          }
        });
        res.redirect("/");
    }else {
      res.render("list", {listTitle: "Today", newListItems: items});
    }
  });
});


// insert new todos
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }else {
    Category.findOne({name: listName}, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete completed todos
app.post("/delete", function (req, res) {
  const checkedItemId = req.body.toBeDeletedItem;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove({_id: checkedItemId}, function (err) {
      if (err) {
        console.log(err);
      }else {
        console.log("Successfully Deleted");
        res.redirect("/");
      }
    });
  }else {
    Category.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, results) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }


});


app.get("/:categoryName", function (req,res) {
  const todoCategory = _.capitalize(req.params.categoryName);

  Category.findOne({name: todoCategory}, function (err, results) {
    if (!err) {
      if (!results) {
        const list = new Category({
          name: todoCategory,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + todoCategory);
      }else {
        // show an existing list
        res.render("list", {listTitle: results.name, newListItems: results.items});
      }
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully.");
});
