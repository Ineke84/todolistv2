//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//Verbinden met de specifieke database, is die er nog niet dan wordt deze aangemaakt
mongoose.set("strictQuery", false);
mongoose.connect("mongodb+srv://admin-ineke:xnZZcK411bTdHR4G@cluster0.8yexyqp.mongodb.net/todolistDB");

//1. Opzet voor een nieuwe database: hoe zien to-do items eruit
const itemsSchema = new mongoose.Schema ({
  name: String
});

//2. Creeren model 'Item' in de (automatisch gegenereerde) collection 'Items'
const Item = mongoose.model("Item", itemsSchema);

//3. Default items maken en daar een array van maken
const item1 = new Item ({
  name: "Welcome to your todolist!"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "Hit this checkbox to delete an item"
});
var defaultItems = [item1, item2, item3];

//1. Opzet voor een nieuwe database: alle to do lijsten maken (met daarin todo items)
const listSchema = new mongoose.Schema ({
  name: String,
  items: [{ type: itemsSchema }] 
});

//2. Creeren model 'List' in de (automatisch gegenereerde) collection 'Lists'
const List = mongoose.model("List", listSchema);


// PAGINA home laden
app.get("/", function(req, res) {
  console.log("Start function get /");

  main().catch(err => console.log(err));
  async function main() {
    // Vind alle items
    const items = await Item.find({});
    
    // Als er items zijn, dan die items laten zien
    if (items.length > 0) {
      console.log("Home - get - if - items.length = " + items.length);
      res.render("list", {listTitle: "Today", newListItems: items});
      /* const day = date.getDate();
      res.render("list", {listTitle: day, newListItems: items}); */
    // anders de defaultItems neerzetten  
    } else {
        await Item.create(defaultItems);
        console.log("Home get - else - default items created");
        res.redirect("/");
    }
  }
});

// PAGINA /list/<listName> laden
app.get("/:listName", function (req, res){
  main().catch(err => console.log(err));
  async function main() {
    
    //Ophalen 'listname' uit de url
    const requestedListName = _.capitalize(req.params.listName);

    console.log("Eigen list - get - listname is" + requestedListName + " en default items zijn toegevoegd");

    //Creeëren nieuwe list in lists collectie als dat nodig is
    List.findOne({name: requestedListName})
      .then(function(foundList) {
        if(!foundList) {
          const newList = new List ({
            name: requestedListName,
            items: defaultItems
          });
          List.create(newList);
          console.log("Eigen list - get - if lijst = requestedlistname - nieuwe lijst gemaakt")
          console.log("Eigen list - get - if lijst = requestedlistnamedefault - items created");
          res.redirect("/" + requestedListName);
        } else {
          console.log("Eigen list - get - else - Lijst gevonden en pagina wordt opgebouwd");
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});

        }
      });
    }
  });


app.get("/about", function(req, res){
  res.render("about");
});

// POSTEN van nieuw to do item
app.post("/", function(req, res){

  console.log("Start function post /");
  main().catch(err => console.log(err));
  async function main() {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const newItem = new Item ({
      name: itemName
    });

    if (listName === "Today") {
      await Item.create(newItem);
      res.redirect("/");
    } else {
      List.findOne({name: listName})
      .then (function (foundList) {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      })
    }
   
  }
});

//Items van todo lijst verwijderen
app.post("/delete", function(req, res) {
  console.log("Start function /delete ");

  main().catch(err => console.log(err));
  async function main() {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.list;

    if (listName == "Today") {
      await Item.findByIdAndRemove(checkedItemId);
      res.redirect("/");
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      .then (function(foundList) {
        res.redirect("/" + listName);
      }) 
      }      
    }
  }

);





app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
