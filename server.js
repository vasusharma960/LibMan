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

const userSchema = {
  email: String,
  password: String,
  num: Number,
  booksIssued: []
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
  res.render("index",{vis: "hidden", visi: "hidden", content: "", x: "Login"});
});

app.post("/signin", function(req, res){
  const email = req.body.email;
  const password = req.body.password;

  if(!validator.validate(email)){
    res.render("index", {vis: "hidden", visi: "Inherit", content: "Incorrect Email or Password", x: "Login"});
  }else{
    User.findOne({email: email}, function(err, user){
      if(!err){
        if(user != null && password === user.password){
          currUser = email;
          console.log(currUser + " current user");
          res.redirect("/user");
        }else{
          res.render("index", {vis: "hidden", visi: "Inherit", content: "Incorrect Email or Password", x: "Login"});
        }
      }else console.log(err);
    });
  }
});

app.get("/register", function(req, res){
  res.render("register", {vis: "hidden", color: "red", visi: "hidden", content: "", x: "Login"});
});

app.post("/registration", function(req, res){
  const email = req.body.email;
  const password = req.body.password;
  const cpassword = req.body.cpassword;
  const img = req.url;

  if(!validator.validate(email)){
    res.render("register", {vis: "hidden", color: "red", visi: "inherit", content: "Invalid email", x: "Login"});
  }else{
    if(req.body.password != req.body.cpassword){
      res.render("register", {vis: "hidden", color: "red", visi: "inherit", content: "Password does not match", x: "Login"});
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

            res.render("register", {vis: "hidden", color: "#22AC00", visi: "inherit", content: "Successfully registered.", x: "Login"});
          }else{
            res.render("register", {vis: "hidden", color: "red", visi: "inherit", content: "User Already Exists", x: "Login"});
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});


app.get("/user", function(req, res){
  Book.find({availability: "Yes"}, function(err, books){
    if(!err){
      console.log(books);
      res.render("user", {vis: "Inherit", books: books, x: "Logout"});
    }
  });
});

app.get("/search", function(req, res){
  res.render("search", {vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/searchBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("search", {vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("search", {vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("search", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("search", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Available. Already Checked Out", x: "Logout"});
          }else{
            res.render("search", {vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Available To Issue", x: "Logout"});
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.get("/donate", function(req, res){
  res.render("donate", {vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/addBook", function(req, res){
  const title = req.body.title;
  const author = req.body.author;
  const availability = "Yes"

  if(currUser == null){
    res.render("donate", {vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
      if(title.length === 0 || author.length === 0){
        res.render("donate", {vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title and Author", x: "Logout"});
      }else{
        Book.findOne({title: title}, function(err, bookData){
          if(!err){
            if(!bookData){
              const newBook = new Book({title: title, author: author, availability: availability, issuedTo: ""});
              newBook.save();

              res.render("donate", {vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Added", x: "Logout"});
            }else{
              res.render("donate", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Already Exists", x: "Logout"});
            }
          }else{
            console.log(err);
          }
        });
      }
  }
});

app.get("/issue", function(req, res){
  res.render("issue", {vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/issueBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No" && book.issuedTo === currUser){
            res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "You already have issued the book", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Available", x: "Logout"});
          }else{
            User.findOne({email: currUser}, function(err, user){
              if(!err){
                if(user != null && user.num < 3){
                  user.booksIssued.push(title);

                  User.updateOne({email: currUser}, {$inc: {num : 1}, $set: {booksIssued: user.booksIssued}}, function(err){
                    if(err) console.log(err);
                  });

                  Book.updateOne({title: title}, {$set: {availability: "No", issuedTo: currUser}}, function(err){
                    if(err) console.log(err);
                  });
                  res.render("issue", {vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Issued", x: "Logout"});
                }else if(user != null && user.num >= 3){
                  res.render("issue", {vis: "Inherit", color: "red", visi: "Inherit", content: "You cannot issue more than 3 books at a time. Please return to issue new a book.", x: "Logout"});
                }
              }else{
                console.log(err);
              }
            });
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.get("/return", function(req, res){
  res.render("return", {vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/returnBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title of Book", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Does Not Exists", x: "Logout"});
          }else if(book != null && book.availability === "Yes"){
            res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book is already available", x: "Logout"});
          }else if(book != null && book.availability === "No" && book.issuedTo != currUser){
            console.log(currUser);
            res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "You cannot return this book", x: "Logout"});
          }else{
            Book.updateOne({title: title}, {$set: {availability: "Yes", issuedTo: ""}}, function(err){
              if(err) console.log(err);
            });

            User.findOne({title: title}, function(err, user){
              if(!err){
                let tempArray = user.booksIssued;
                tempArray = tempArray.filter(function(item){
                  return item != title;
                });

                User.updateOne({email: currUser}, {$inc: {num : -1}, $set: {booksIssued: tempArray}}, function(err){
                  if(!err){
                    res.render("return", {vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Return Success", x: "Logout"});
                  } else{
                    console.log(err);
                  }
                });
              }else{
                console.log(err);
              }
            });
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.get("/remove", function(req, res){
  res.render("remove", {vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/removeBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("return", {vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("remove", {vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title of Book", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("remove", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("remove", {vis: "Inherit", color: "red", visi: "Inherit", content: "Book already issued. Cannot remove.", x: "Logout"});
          }else{
            Book.deleteOne({title: title}, function(err){
              if(!err){
                res.render("remove", {vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Remove Success", x: "Logout"});
              }else{
                console.log(err);
              }
            });
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Server started on port 3000")
});
