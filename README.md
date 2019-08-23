# mongodb-users
My backend for some of my MongoDB projects. Feel free to copy and use!

[Link to complete instructions](https://medium.com/swlh/creating-connecting-a-mongodb-database-and-node-js-server-to-a-front-end-6a53d400ae6a)

## Quick Notes

* All code in [app.js](/app.js)
* All passwords in https requests are called `pass` as the variable name.
* All passwords are **sha256** encrypted with CSPRNG generated salts before storage in the database.
* Remember to create a `.env` file and add your uri key. Should look something like this: `URI=mongodb://<USERNAME>:<PASSWORD>@<MONGO_URL>:<PORT>,<PARAMS>`


