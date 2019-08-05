/**
 * Created by Daniel Denenberg
 * dannydenenberg@gmail.com
 * Use of this code is allowed if this comment is not removed.
 */

require("dotenv").config(); // loads enviornment variables from the .env file

// init project
const express = require("express"); // the library we will use to handle requests
const mongodb = require("mongodb"); // load mongodb
const csprng = require('csprng'); // for random salts
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

    // Example request: https://mynodejsurl.com/myusername?pass=mypassword123
  // sends back the user information if the hashed query parameter for `pass` (password) is the right one for the user
  // sends back object with database information as well as a field called `correctPassword` which is either true or false
  app.get("/:user", (req, res) => {
    collection.find({ user: req.params.user }).toArray((err, docs) => {
      if (err) {
        res.send({ response: "An error occured in getting the user info." });
      } else {
        if (docs.length > 0) { // if there were matches (there are users with that username)
          // get the first users password (each user should have a unique username)
          let hashedPassword = docs[0].pass;
          
          // get the salt
          const salt = docs[0].salt;

          // if there was no password sent in the query of the url (after the `?` in the req url)
          if (!req.query.pass) {
            res.send("There was no password associated with the GET req.");
          }

          // The password sent in the GET req.
          // Enclose in template to make sure it is a string (so if a password is a number, it treats it as a string).
          // Prepend the salt to the sent passcode.
          const hashedQueryPassword = hash(`${salt}${req.query.pass}`); 

          // if the password that was sent with the get request matches the user's password
          if (hashedPassword === hashedQueryPassword) {
            // send back the user's information
            res.send({ ...docs[0] });
          } else {
            // otherwise, the password was wrong. Send back a generic error message.
            res.send("There was an error with either the username or passcode.");
          }
        } else {
          res.send("There were no users with that name found. ");
        }
      }
    });
  });
  });

  // the password is sent in the body of the request as the `pass` field
app.post("/:user", (req, res) => {
    // generate the salt using the npm package 'csprng'. 
    // The first argument is the number of bits and the second is the radix (how many characters to choose from, basically)
    const salt = csprng(160, 36);
    
    // hash the password with the salt prepended 
    req.body.pass = hash(`${salt}${req.body.pass}`); 

    // inserts a new document on the server. make sure to store the hash and salt
    collection.insertOne(
      { ...req.body, user: req.params.user, salt }, // this is one object to insert. `requst.params` gets the url parameters
      (err, r) => {
        if (err) {
          res.send("An error occured.");
        } else {
          res.send("All went well.");
        }
      }
    );
  });

  app.get("/", (req, res) => {
    res.send("You are home 🏚.");
  });

    // this doesn't create a new user but rather updates an existing one by the user name
  // a request looks like this: `https://nodeserver.com/username23?pass=12345` plus the associated JSON data sent in the body of the req
  app.put("/:user", (req, res) => {
    // get the user, compare the hashed + salted password sent in the query to the one in the database, if they match, then update the data
    collection.find({ user: req.params.user }).toArray((err, docs) => {
      if (err) {
        res.send("An error occured in getting the user info." );
      } else {
        // there were matches (there are users with that username)
        if (docs.length > 0) {
          // get the first users password (each user should have a unique username)
          let hashedPasswordInDatabase = docs[0].pass;
          
          // get the salt
          const salt = docs[0].salt;

          // if there was no password sent in the query of the url (after the `?`)
          if (!req.query.pass) {
            res.send("There was no password associated with the GET req.");
          }

          // The password sent in the GET req.
          // Enclose in template to make sure it is a string (so if a password is a number, it treats it as a string).
          // Prepend the salt 
          const hashedQueryPassword = hash(`${salt}${req.query.pass}`); 

          // if the password that was sent with the get request matches the user's password
          if (hashedPasswordInDatabase === hashedQueryPassword) {
            // update user info in database

            // hash the password for storing
            req.body.pass = hash(req.body.pass);
            collection.updateOne(
              { user: req.params.user }, // if the username is the same, update the user
              { $set: { ...req.body, user: req.params.user, salt } }, // make sure to include the salt in the update of info
              (err, r) => {
                if (err) {
                  console.log("An error occurred in updating information");
                }
              }
            );
            res.send("All went well");
          } else {
            // otherwise, the password was wrong. Generic error message sent back
            res.send("Something went wrong in user authentication.");
          }
        } else {
          res.send("There were no users with that name found. ");
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
