//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,

  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-harish:easypass@cluster0.56hxn.mongodb.net/userdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);
mongoose.set('useFindAndModify', false);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  balance: Number,
  admin: Boolean,
  numberofstocks: Number,
  FullName: String
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
  res.render("home");
});

app.get("/stocks", function (req, res) {
  if (req.isAuthenticated()) {
    var mid = req.session.uniqueid;
    var stockdisp = 0
    var baldisp = 0
    User.findOne({ _id: mid }).then((users) => {
      stockdisp = users.numberofstocks;

      baldisp = users.balance

      res.render("stocks", { k: mid, stockspurchased: stockdisp, balanceleft: baldisp });
    })


  } else {
    res.render("login");
  }
});
app.get("/failtransaction", function (req, res) {
  if (req.isAuthenticated()) {
    var mid = req.session.uniqueid;
    var stockdisp = 0
    var baldisp = 0
    User.findOne({ _id: mid }).then((users) => {
      stockdisp = users.numberofstocks;

      baldisp = users.balance

      res.render("failtransaction", { stockspurchased: stockdisp, balanceleft: baldisp });
    })


  } else {
    res.render("login");
  }
});
app.get("/successtransaction", function (req, res) {
  if (req.isAuthenticated()) {
    var mid = req.session.uniqueid;
    var stockdisp = 0
    var baldisp = 0
    User.findOne({ _id: mid }).then((users) => {
      stockdisp = users.numberofstocks;

      baldisp = users.balance

      res.render("successtransaction", { stockspurchased: stockdisp, balanceleft: baldisp });
    })


  } else {
    res.render("login");
  }
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/buy/:postid", function (req, res) {
  const requestedid = req.params.postid;
  User.findOne({ _id: requestedid }).then((users) => {
    if (users.balance - (req.body.ityt * req.body.currentcost) >= 0 && req.body.ityt > 0) {
      var accountbalupdate = users.balance - (req.body.ityt * req.body.currentcost);
      var stockbal = Number(req.body.ityt) + users.numberofstocks;
      User.findByIdAndUpdate(requestedid, { balance: accountbalupdate, numberofstocks: stockbal }).then((success) => {
        res.redirect("/successtransaction")
      }).catch((ayyo) => {
        console.log(ayyo)
      })
    }
    else {
      res.redirect("/failtransaction");
    }
  }).catch((e) => {
    console.log(e);
  })
});

app.get("/continuetrading", function (req, res) {
  res.redirect("/stocks")
})
app.post("/sell/:postid", function (req, res) {
  const requestedid = req.params.postid;

  User.findOne({ _id: requestedid }).then((users) => {


    if (Number(req.body.ityt2) <= users.numberofstocks && req.body.ityt2 > 0) {

      var accountbalupdate = users.balance + (Number(req.body.currentcost2) * Number(req.body.ityt2));
      var stockbal = users.numberofstocks - Number(req.body.ityt2);

      User.findByIdAndUpdate(requestedid, { balance: accountbalupdate, numberofstocks: stockbal }).then((success) => {
        res.redirect("/successtransaction")
      }).catch((ayyo) => {
        console.log(ayyo)
      })
    } else {
      res.redirect("/failtransaction");
    }
  }).catch((e) => {
    console.log(e);
  })



});
app.get("/leaderboard", function (req, res) {
  User.find({}, { "balance": 1, "numberofstocks": 1, "FullName": 1 }).sort({ "balance": -1 }).then((details) => {
    for (var x = 0; x < details.length; x++) {
      details[x].rank = x + 1;
    }
    res.render("leaderboard", { details: details });
  })
})

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, balance: 1000, admin: false, numberofstocks: 0, FullName: req.body.Name },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          req.session.uniqueid = user._id;
          res.redirect("/stocks");
        });
      }
    }
  );
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/aboutopen", function (req, res) {
  res.render("aboutopen");
});
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local", { failureRedirect: "/login" })(req, res, function () {
        User.findOne({ username: req.body.username }).then((users) => {
          req.session.uniqueid = users._id;
          if (users.admin == true) {
            res.redirect("/admin");
          }
          res.redirect("/stocks");
        }).catch((e) => {
          console.log(e);
        })
      });
    }
  });
});
app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});
app.get("*", function (req, res) {
  res.render("errorpage")
})
app.listen(process.env.PORT || 3000, function () {
  console.log("Server is running");
});
