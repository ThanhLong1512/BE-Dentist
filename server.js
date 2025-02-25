const mongoose = require("mongoose");

const dotenv = require("dotenv");

const app = require("./index");

const port = process.env.PORT || 3000;
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(con => {
    console.log(con.connection);
    console.log("Database connection successful");
  });

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Xử lý tất cả những trường hợp Unhandle promise Rejection
process.on("UnhandledRejection", err => {
  console.log(err.name, err.message);
});
