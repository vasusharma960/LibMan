const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const validator = require("email-validator");
const mongoose = require("mongoose");
const fs = require('fs');
const http = require('http');
const formidable = require('formidable');
let currUser;

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("Public"));
app.use("/node_modules",express.static(__dirname + "/node_modules"));

app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost:27017/apnalibraryDB", {useNewUrlParser: true});

const booksHaving = {
  title: String
}

const userSchema = {
  email: String,
  password: String,
  num: Number,
  booksIssued: [booksHaving]
};

const bookSchema = {
  title: String,
  author: String,
  availability: String,
  issuedTo: String
};

const User = mongoose.model("user", userSchema);
const Book = mongoose.model("book", bookSchema);

app.get("/", function(req, res){
  res.render("index",{vis: "hidden", content: "", x: "Login"});
});

app.post("/signin", function(req, res){
  const email = req.body.email;
  const password = req.body.password;

  if(!validator.validate(email)){
    res.render("index", {vis: "inherit", content: "Incorrect Email or Password", x: "Login"});
  }else{
    User.findOne({email: email}, function(err, user){
      if(!err){
        if(user != null && password === user.password){
          currUser = email;
          console.log(email + " current user");
          res.redirect("/user");
        }else{
          res.render("index", {vis: "inherit", content: "Incorrect Email or Password", x: "Login"});
        }
      }else console.log(err);
    });
  }
});

app.get("/user", function(req, res){
  res.render("user", {x: "Logout"});
});

app.get("/register", function(req, res){
  res.render("register", {color: "red", visi: "hidden", content: "", x: "Login"});
});

app.post("/registration", function(req, res){
  const email = req.body.email;
  const password = req.body.password;
  const cpassword = req.body.cpassword;
  const img = req.url;

  if(!validator.validate(email)){
    res.render("register", {color: "red", visi: "inherit", content: "Invalid email", x: "Login"});
  }else{
    if(req.body.password != req.body.cpassword){
      res.render("register", {color: "red", visi: "inherit", content: "Password does not match", x: "Login"});
    }else{
      User.findOne({email: email}, function(err, userData){
        if(!err){
          if(!userData){
            const newUser = new User({email: email, password: password, num: 0});
            newUser.save();

            var form = new formidable.IncomingForm();
            // console.log(form);
            form.parse(req, function (err, fields, files) {
              var oldpath = files.filetoupload.filepath;
              console.log("OldPath" + oldpath);
              var newpath = __dirname + files.filetoupload.originalFilename;
              fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                console.log('File uploaded and moved!');
              });
            });
            console.log(img);

            res.render("register", {color: "#22AC00", visi: "inherit", content: "Successfully registered.", x: "Login"});
          }else{
            res.render("register", {color: "red", visi: "inherit", content: "User Already Exists", x: "Login"});
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.get("/donate", function(req, res){
  res.render("donate", {color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/addBook", function(req, res){
  const title = req.body.title;
  const author = req.body.author;
  const availability = "Yes"

  console.log(title);
  console.log(author);

  Book.findOne({title: title}, function(err, bookData){
    if(!err){
      if(!bookData){
        const newBook = new Book({title: title, author: author, availability: availability, issuedTo: ""});
        newBook.save();

        res.render("donate", {color: "#22AC00", visi: "Inherit", content: "Book Added", x: "Logout"});
      }else{
        res.render("donate", {color: "red", visi: "Inherit", content: "Book Already Exists", x: "Logout"});
      }
    }else{
      console.log(err);
    }
  });
});

app.get("/issue", function(req, res){
  res.render("issue", {color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/issueBook", function(req, res){
  const title = req.body.title;

  Book.findOne({title: title}, function(err, book){
    if(!err){
      if(!book){
        res.render("issue", {color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
      }else if(book != null && book.availability === "No"){
        res.render("issue", {color: "red", visi: "Inherit", content: "Book Not Available", x: "Logout"});
      }
    }else{
      console.log(err);
    }
  });

  User.findOne({email: currUser}, function(err, user){
    if(!err){
      if(user != null && user.num < 3){
        let tempArray = user.booksIssued.map(function(bookTitle){
          return bookTitle;
        });
        tempArray.push(title);

        User.updateOne({email: currUser}, {$inc: {num : 1}, $set: {booksIssued: tempArray}}, function(err){
          if(err) console.log(err);
        });
        Book.updateOne({title: title}, {$set: {availability: "No"}}, function(err){
          if(err) console.log(err);
        });
        res.render("issue", {color: "#22AC00", visi: "Inherit", content: "Book Issued", x: "Logout"});
      }
    }
  });
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on port 3000")
});
