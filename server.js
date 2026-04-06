const express = require("express");
const path = require("path");
const session = require("express-session");
const authRoutes = require("./Routes/auth");

console.log("server.js started");
console.log("authRoutes type:", typeof authRoutes);

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, "Public")));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
res.send("main server works");
});

app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});