//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);


//create schema for db list

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

// Three default items for today's list
const item1 = new Item({
    name: "Welcome to your to do list"
});

const item2 = new Item({
  name: "Press the + button to add a new item"
});

const item3 = new Item({
  name: "<-- Press this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Schema for custom list
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

//Home route get function
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){

    if (foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if (err){
          console.log(err);
        } else {
          console.log("Successfully added items!");
        }
      });

      res.redirect("/");

    } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

//Create new lists on the fly
app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

  //Search for possible previous lists 
 //and redirect there or create a new list
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show an exsisting list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }

  });

  

});

//Add new items to list
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
      }
    });
  }


});

//Delete items off list when box is checked
app.post("/delete", function(req, res){

  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today"){

    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){

        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
  });

  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
