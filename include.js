// include.js
// 2017-08-31

/*jslint node */


function include(callback, text, get_inclusion) {
    "use strict";

// The include function replaces @include expressions with stuff. If there are
// no @include expressions, then the original text is the result.

// The include processor takes these parameters:

//      callback(result, failure):
//                  This function is given the result in this turn or a future
//                  turn.

//      text: A string that may have embedded zero or more of

//                      @include "key"

//                  There can be 0 or 1 spaces between the @include and the
//                  opening of the key. This function will replace each with
//                  the inclusion associated with the key. A key (which could
//                  be a filename) can be wrapped in any of these six pairs:

//                      " "     ' '     < >     ( )     [ ]     { }

//      get_inclusion(callback, key, quote):
//                  This function will take a key string and give the resulting
//                  inclusion string to callback(data, failure). The function
//                  could be implemented by accessing a file system, database,
//                  source control system, content manager, or JSON Object.
//                  It may also take an initial quote character that shows how
//                  the key was wrapped. This makes it possible to treat '"'
//                  differently from '<'.

// Nothing is returned. The result is communicated through the callback.

// An inclusion may contain more @include commands. There is no protection
// against infinite loops, so be careful out there.

// If inclusions are coming from files, and if the environment is nodejs, then
// get_inclusion could be defined like this:

// var fs = require("fs");

// function get_inclusion(callback, key, ignore) {
//     fs.readFile(key, "utf8", function (failure, data) {
//         return callback(data, failure);
//     });
// }

    var at_include = "@include";
    var head = 0;   // head marks the beginning of the "@include" substring.
                    // head is kept in the outer scope so indexOf does not
                    // need to ever rescan material that previously didn't
                    // match.
    var middle;     // middle will eventually mark the beginning of the key.
    var pair = {    // We allow the key to be wrapped by any of these pairs.
        "\"": "\"",
        "'": "'",
        "<": ">",
        "(": ")",
        "[": "]",
        "{": "}"
    };

    function back(data, failure) {

// We use the back function to call the callback. This indirection is to
// ensure that the callback is only called once.

        var call = callback;
        callback = undefined;
        return call(data, failure);
    }

    function error_message(message) {
        return back(
            undefined,
            new Error(message + " " + middle + ": " + text)
        );
    }

    function minion() {

// The minion function does include's work. It will cause itself to call itself
// until all of the @include specifications have been replaced.

        var close;  // a close quote
        var count;  // the number of excess @ prefixes
        var fore;   // the position before the head of excess @ prefixes
        var key;
        var open;   // an open quote
        var tail;   // tail will mark the remainder of the text.

// Search for the next occurrence of "@include". If it isn't found, then there
// is no more work to do. Give the text to the callback. This is the successful
// conclusion of include.

        while (true) {
            head = text.indexOf(at_include, head);
            if (head < 0) {
                return back(text);
            }
            fore = head;
            count = 0;

// If the "@include" was preceeded by an odd number of "@", then ignore it.

            while (true) {
                fore -= 1;
                if (fore < 0 || text.charAt(fore) !== "@") {
                    break;
                }
                count += 1;
            }
            if (Math.floor(count / 2) === 0) {
                break;
            }
            head += at_include.length;
        }

// The middle index points to the character position immediately after the
// "@include". If it is an optional space, skip over it.

        middle = head + at_include.length;
        if (text.charAt(middle) === " ") {
            middle += 1;
        }

// The next character must be an opener. If it is not an opener, give the error
// to the callback.

        open = text.charAt(middle);
        close = pair[open];
        if (typeof close !== "string") {
            return error_message("Missing quote at");
        }

// Search for the close quote. If it isn't there, give an error to the callback.

        tail = text.indexOf(close, middle + 1);
        if (tail < 0) {
            return error_message("Missing '" + close + "' after");
        }
        key = text.slice(middle + 1, tail);

// Process the @include. Read the inclusion, providing another callback function.

        return get_inclusion(
            function (data, failure) {

// This is the callback function that is passed to get_inclusion.
// If the get failed for any reason, pass the error to the original callback.

                if (failure) {
                    return back(undefined, failure);
                }

// If the get succeeded, insert the inclusion into the text. Then, to
// process any additional includes, call minion.

                text = text.slice(0, head) + data + text.slice(tail + 1);
                return minion();
            },
            key,
            open
        );
    }
    try {
        return minion();
    } catch (exception) {
        return back(undefined, exception);
    }
}

module.exports = include;
