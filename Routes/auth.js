const fs = require("fs");
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../Database/connection");

function logEvent(event, data = {}) {
    const log = {
        timestamp: new Date().toISOString(),
        event: event,
        ...data
    };

    fs.appendFile("Logs/app.log", JSON.stringify(log) + "\n", (err) => {
        if (err) {
            console.error("Log write error:", err);
        }
    });
}

console.log("Routes/auth.js loaded");

const router = express.Router();

router.get("/test", (req, res) => {
    console.log("GET /auth/test hit");
    res.send("auth router works");
});

router.post("/signup", async (req, res) => {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
        return res.send("All fields are required.");
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
            "INSERT INTO users (name, email, password_hash, department) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, department],
            (err) => {
                if (err) {
                    console.error(err);
                    logEvent("SIGNUP_ERROR", {
                        email: email
                    });
                    return res.send("Error creating account.");
                }

                logEvent("SIGNUP_SUCCESS", {
                    email: email,
                    department: department
                });

                res.redirect("/login.html");
            }
        );
    } catch (error) {
        console.error(error);

        logEvent("SIGNUP_SERVER_ERROR", {
            email: email
        });

        res.send("Server error during signup.");
    }
});

router.post("/login", (req, res) => {
    console.log("POST /auth/login hit");

    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) {
            console.error(err);

            logEvent("LOGIN_SERVER_ERROR", {
                email: email
            });

            return res.redirect("/login.html?error=server");
        }

        if (results.length === 0) {
            logEvent("LOGIN_FAILED", {
                email: email,
                reason: "no_user"
            });

            return res.redirect("/login.html?error=invalid");
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            logEvent("LOGIN_FAILED", {
                email: email,
                reason: "wrong_password"
            });

            return res.redirect("/login.html?error=invalid");
        }

        logEvent("LOGIN_SUCCESS", {
            email: email,
            department: user.department
        });

        res.redirect(`/dashboard.html?dept=${encodeURIComponent(user.department)}&name=${encodeURIComponent(user.name)}`);
    });
});

module.exports = router;

