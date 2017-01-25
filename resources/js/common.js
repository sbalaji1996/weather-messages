
var jsdom = require("jsdom");
$ = require("jquery")(jsdom.jsdom().parentWindow);
$('document').ready(() => {
  $("#header").load("/resources/html/header.html");
})
