const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const validator = require("email-validator");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require('fs');
let currUser;
let photoName;

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'Public/img/userPhotoID')
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `${req.body.email.toLowerCase()}.jpeg`);
  }
});

const multerFilter = (req, file, cb) => {
  if(file.mimetype.startsWith('image')){
    cb(null, true);
  }else{
    cb(new AppError('Not an image', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("Public"));
app.use("/node_modules",express.static(__dirname + "/node_modules"));

app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://admin:admin%40123@cluster0.fagut8i.mongodb.net/LibMan", {useNewUrlParser: true});

const userSchema = {
  email: String,
  password: String,
  num: Number,
  booksIssued: [],
  photoID: String
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
  res.render("index",{vi: "hidden", src: "", vis: "hidden", visi: "hidden", content: "", x: "Login"});
});

app.post("/signin", function(req, res){
  const email = req.body.email.toLowerCase();
  const password = req.body.password;

  if(email.length === 0 || password.length === 0){
    return res.render("index", {vi: "hidden", src: "", vis: "hidden", visi: "Inherit", content: "Enter Email and Password", x: "Login"});
  }

  if(!validator.validate(email)){
    res.render("index", {vi: "hidden", src: "", vis: "hidden", visi: "Inherit", content: "Incorrect Email or Password", x: "Login"});
  }else{
    User.findOne({email: email}, function(err, user){
      if(!err){
        if(!user){
          res.render("index", {vi: "hidden", src: "", vis: "hidden", visi: "Inherit", content: "User Does Not Exist", x: "Login"});
        }else if(user != null && password === user.password){
          currUser = email;
          const encodedString = user.photoID;

          function decodeBinary(binary){
            binary = binary.split(' ');
            binary = binary.map(elem => parseInt(elem,2));
            binary = binary.map(elem => String.fromCharCode(elem));
            let newText = binary.join("").toUpperCase();

            return newText;
          }

          photoName = decodeBinary(encodedString).toLowerCase();
          res.redirect("/user");
        }else{
          res.render("index", {vi: "hidden", src: "", vis: "hidden", visi: "Inherit", content: "Incorrect Email or Password", x: "Login"});
        }
      }else console.log(err);
    });
  }
});

app.get("/register", function(req, res){
  res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "red", visi: "hidden", content: "", x: "Login"});
});

app.post("/registration", upload.single('photo'), function(req, res){
  const email = req.body.email;
  const password = req.body.password;
  const cpassword = req.body.cpassword;
  const p = req.file;

  const photoToBinary = (str = '') => {
   let res = '';
   res = str.split('').map(char => {
      return char.charCodeAt(0).toString(2);
   }).join(' ');
   return res;
 };

  if(email.length === 0 || password.length === 0 || cpassword.length === 0 || p == null){
    return res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "red", visi: "inherit", content: "Please enter all the details", x: "Login"});
  }

  const photo = photoToBinary(p.filename);

  if(!validator.validate(email)){
    res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "red", visi: "inherit", content: "Invalid email", x: "Login"});
  }else{
    if(req.body.password != req.body.cpassword){
      res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "red", visi: "inherit", content: "Password does not match", x: "Login"});
    }else{
      User.findOne({email: email}, function(err, userData){
        if(!err){
          if(!userData){
            const newUser = new User({
              email: email,
              password: password,
              num: 0,
              photoID: photo
            });
            newUser.save();

            res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "#22AC00", visi: "inherit", content: "Successfully registered.", x: "Login"});
          }else{
            res.render("register", {vi: "hidden", src: "", vis: "hidden", color: "red", visi: "inherit", content: "User Already Exists", x: "Login"});
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
      res.render("user", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", books: books, x: "Logout"});
    }
  });
});

app.get("/search", function(req, res){
  res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/searchBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Available. Already Checked Out", x: "Logout"});
          }else{
            res.render("search", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Available To Issue", x: "Logout"});
          }
        }else{
          console.log(err);
        }
      });
    }
  }
});

app.get("/donate", function(req, res){
  res.render("donate", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/addBook", function(req, res){
  const title = req.body.title;
  const author = req.body.author;
  const availability = "Yes"

  if(currUser == null){
    res.render("donate", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
      if(title.length === 0 || author.length === 0){
        res.render("donate", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title and Author", x: "Logout"});
      }else{
        Book.findOne({title: title}, function(err, bookData){
          if(!err){
            if(!bookData){
              const newBook = new Book({title: title, author: author, availability: availability, issuedTo: ""});
              newBook.save();

              res.render("donate", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Added", x: "Logout"});
            }else{
              res.render("donate", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Already Exists", x: "Logout"});
            }
          }else{
            console.log(err);
          }
        });
      }
  }
});

app.get("/issue", function(req, res){
  res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/issueBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No" && book.issuedTo === currUser){
            res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "You already have issued the book", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Available", x: "Logout"});
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
                  res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Book Issued", x: "Logout"});
                }else if(user != null && user.num >= 3){
                  res.render("issue", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "You cannot issue more than 3 books at a time. Please return to issue new a book.", x: "Logout"});
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
  res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/returnBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title of Book", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Does Not Exists", x: "Logout"});
          }else if(book != null && book.availability === "Yes"){
            res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book is already available", x: "Logout"});
          }else if(book != null && book.availability === "No" && book.issuedTo != currUser){
            console.log(currUser);
            res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "You cannot return this book", x: "Logout"});
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
                    res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Return Success", x: "Logout"});
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
  res.render("remove", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "white", visi: "hidden", content: "", x: "Logout"});
});

app.post("/removeBook", function(req, res){
  const title = req.body.title;

  if(currUser == null){
    res.render("return", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Session timeout. Please Login Again", x: "Logout"});
  }else{
    if(title.length === 0){
      res.render("remove", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Enter Title of Book", x: "Logout"});
    }else{
      Book.findOne({title: title}, function(err, book){
        if(!err){
          if(!book){
            res.render("remove", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book Not Present", x: "Logout"});
          }else if(book != null && book.availability === "No"){
            res.render("remove", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "red", visi: "Inherit", content: "Book already issued. Cannot remove.", x: "Logout"});
          }else{
            Book.deleteOne({title: title}, function(err){
              if(!err){
                res.render("remove", {vi: "Inherit", src: "/img/userPhotoID/" + photoName, vis: "Inherit", color: "#22AC00", visi: "Inherit", content: "Remove Success", x: "Logout"});
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
