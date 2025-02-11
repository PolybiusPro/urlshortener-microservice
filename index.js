require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const dns = require("node:dns");

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

const urlSchema = new mongoose.Schema({
    url: { type: String, required: true },
    url_id: { type: Number },
});

let ShortURL = mongoose.model("ShortURL", urlSchema);

const createURL = (data, done) => {
    const addUrl = new ShortURL({
        url: data.url,
    });
    addUrl.save((err, data) => {
        if (err) return console.log(err);
        done(null, data);
    });
};

app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
    res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res, next) => {
    const parsedUrl = new URL(req.body.url);
    dns.lookup(parsedUrl.hostname, (err) => {
        if (err) {
            res.json({ error: "Invalid URL" });
        } else {
            ShortURL.findOne({ url: parsedUrl.href }, (err, data) => {
                if (err) return console.error(err);
                if (!data) {
                    createURL({ url: parsedUrl.href }, (err, savedUrl) => {
                        console.log("Saved URL!");
                        if (err) return console.err(err);
                        req.parsedUrl = parsedUrl;
                        return next();
                    });
                }
                else {
                    next();
                }
            });
        }
    });
}, (req, res) => {
    ShortURL.findOne({ url: req.parsedUrl.href }, (err, data) => {
        if (err) return console.err(err);
        res.json({
            original_url: data.url,
            short_url: data.url_id,
        });
    });
});

app.get('/api/shorturl/:short_url', (req, res) => {
    ShortURL.findOne({url_id: req.params.short_url},(err, data) => {
        if(err) return console.error(err);
        res.redirect(data.url);
    });
});

app.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
