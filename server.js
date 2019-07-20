var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
// const exphbs = require("express-handlebars");
// app.engine("handlebars", exphbs({ defaultLayout: "main" }));
// app.set("view engine", "handlebars");

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/mongoHeadlines", {
  useNewUrlParser: true
});

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.espn.com/nba/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // An empty array to save the data that we'll scrape
    var result = [];

    // Select each element in the HTML body from which you want information.
    // NOTE: Cheerio selectors function similarly to jQuery's selectors,
    // but be sure to visit the package's npm page to see how it works
    $("article.contentItem").each(function(i, element) {
      // var gameData = $(element).text();

      const content = {};

      content.title = $(this)
        .find("h1")
        .text();

      content.summary = $(this)
        .find("p")
        .text();

      content.link = $(this)
        .find("a")
        .attr("href");

      content.image = $(this)
        .find("figure")
        .find("picture")
        .find("img")
        .attr("data-default-src");

      console.log(content);
      result.push(content);
      console.log("scrape");
    });
    // Create a new Article using the `result` object built from scraping
    db.Article.create(result)
      .then(function(dbArticle) {
        // View the added result in the console
        console.log(dbArticle);
        res.redirect("/");
      })
      .catch(function(err) {
        // If an error occurred, log it
        console.log(err);
      });
    // Send a message to the client
  });
});

app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/clear", (req, res) => {
  db.Article.remove({}).then(function(err) {
    res.redirect("/");
  });
});

// Route for getting all Articles from the db
app.get("/api/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/api/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Article.findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
});

// Route for saving/updating an Article's associated Note
app.post("/api/articles/:id", function(req, res) {
  // TODO
  // ====
  db.Note.create(req.body)
    .then(function(dbNote) {
      return dbArticle.findOneAndUpdate(
        { _id: req.params.id },
        { note: dbNote._id },
        { new: true }
      );
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
