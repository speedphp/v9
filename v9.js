require("promptly").prompt('Name: ', function (err, value) {
    // err is always null in this case, because no validators are set
    console.log(value);
});