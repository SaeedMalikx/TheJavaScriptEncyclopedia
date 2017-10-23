// make_book.js
// 2016-01-27

// Make a book as a single HTML file.

//      node make_book

"use strict";

var RQ = require("./rq.js");
var cyc = require("./cyc.js");
var onehtml = require("./onehtml.js");
var include = require("./include.js");
var fs = require("fs");

var filename = process.argv[2] || "book";
if (filename.slice(-4) === ".cyc") {
    filename = filename.slice(0, -4);
}

function get_inclusion(callback, key, ignore) {
    fs.readFile(key, "utf8", function (failure, data) {
        return callback(data, failure);
    });
}

RQ.sequence([
    function (callback) {
        fs.readFile("./" + filename + ".cyc", function (error, data) {
            if (error) {
                console.log(error);
                return callback(undefined, error);
            }
            return callback(data.toString());
        });
    },
    function (callback, value) {
        return include(callback, value, get_inclusion);
    },
    function (callback, value) {
        return callback(cyc(value, onehtml));
    },
    function (callback, value) {
        fs.writeFile("./" + filename + ".html", value, function (error) {
            if (error) {
                console.log(error);
                return callback(undefined, error);
            }
            return callback(true);
        });
    }
])(console.log);


