/**
 * Created by Daniel Denenberg
 * dannydenenberg@gmail.com
 * Use of this code is allowed if this comment is not removed.
 */

require("dotenv").config(); // loads enviornment variables from the .env file

// init project
const express = require("express"); // the library we will use to handle requests
const mongodb = require("mongodb"); // load mongodb

const crypto = require("crypto"); // for hashing passwords

const port = process.env.PORT || 4567;
// const port = 4567;

const app = express(); // instantiate express
app.use(require("cors")()); // allow Cross-domain requests
app.use(require("body-parser").json()); // automatically parses request data to JSON

// make sure in the free tier of MongoDB atlas when connecting, to select version 2.2.* as the node.js driver instead of the default 3.0
const uri = process.env.URI; // load env. variables from .env

mongodb.MongoClient.connect(uri, (err, db) => {
  const collection = db.collection("users");

  // base route
  // Example request: https://mynodejsurl.com/myusername?pass=mypassword123
  // sends back the user information if the hashed query parameter for `pass` (password) is the right one for the user
  // sends back object with database information as well as a field called `correctPassword` which is either true or false
  app.get("/:user", (req, res) => {
    collection.find({ user: req.params.user }).toArray((err, docs) => {
      if (err) {
        res.send({ response: "An error occured in getting the user info." });
      } else {
        // there were matches (there are users with that username)
        if (docs.length > 0) {
          // get the first users password (each user should have a unique username)
          let hashedPassword = docs[0].pass;

          // if there was no password sent in the query of the url (after the `?`)
          if (!req.query.pass) {
            res.send({
              response: "There was no password associated with the GET req."
            });
          }

          // the password sent in the GET req.
          const hashedQueryPassword = hash(`${req.query.pass}`); // enclose in template to make sure it is a string (so if a password is a number, it treats it as a string)

          // if the password that was sent with the get request matches the user's password
          if (hashedPassword === hashedQueryPassword) {
            // send back the user's information
            res.send({ ...docs[0], correctPassword: true });
          } else {
            // otherwise, the password was wrong
            res.send({ correctPassword: false });
          }
        } else {
          res.send("There were no users with that name found. ");
        }
      }
    });
  });

  // base route. User is a parameter
  app.post("/:user", (req, res) => {
    // hash the password
    req.body.pass = hash(req.body.pass);

    // inserts a new document on the server
    collection.insertOne(
      { ...req.body, user: req.params.user }, // this is one object to insert. `requst.params` gets the url parameters
      function(err, r) {
        if (err) {
          res.send("An error occured");
          console.log("ERROR IN POST REQ:");
          console.log(err);
        } else {
          res.send("All well");
        }
      }
    );
  });

  app.get("/", (req, res) => {
    res.send("You are home 🏚.");
  });

  // this doesn't create a new user but rather updates an existing one by the user name
  // base route
  // a request looks like this: `https://nodeserver.com/username23?pass=12345` plus the associated JSON data
  app.put("/:user", (req, res) => {
    // get the user, compare the hashed password sent in the query to the one in the database, if they match, then update the data
    collection.find({ user: req.params.user }).toArray((err, docs) => {
      if (err) {
        res.send({ response: "An error occured in getting the user info." });
      } else {
        // there were matches (there are users with that username)
        if (docs.length > 0) {
          // get the first users password (each user should have a unique username)
          let hashedPasswordInDatabase = docs[0].pass;

          // if there was no password sent in the query of the url (after the `?`)
          if (!req.query.pass) {
            res.send({
              response: "There was no password associated with the GET req."
            });
          }

          // the password sent in the GET req.
          const hashedQueryPassword = hash(`${req.query.pass}`); // enclose in template to make sure it is a string (so if a password is a number, it treats it as a string)

          // if the password that was sent with the get request matches the user's password
          if (hashedPasswordInDatabase === hashedQueryPassword) {
            // update user info in database

            // hash the password for storing
            req.body.pass = hash(req.body.pass);
            collection.updateOne(
              { user: req.params.user }, // if the username is the same, update the user
              { $set: { ...req.body, user: req.params.user } },
              (err, r) => {
                if (err) {
                  console.log("AN error occurred in updating information");
                }
              }
            );
            res.send({ correctPassword: true });
          } else {
            // otherwise, the password was wrong
            res.send({ correctPassword: false });
          }
        } else {
          res.send("There were no users with that name found. ");
          console.log("There were no users with that name found. ");
        }
      }
    });
  });

  // listen for requests, the process.env.PORT is needed because
  // we are using glitch, otherwise you could have written 80 or whatever
  var listener = app.listen(port, () => {
    console.log("Your app is listening on port " + listener.address().port);
  });
});

// hashes strings with sha256 for storing passwords
function hash(pwd) {
  return crypto
    .createHash("sha256")
    .update(pwd)
    .digest("base64");
}
