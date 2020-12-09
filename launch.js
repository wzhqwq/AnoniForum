var express = require('express');

var app = express();

app.use(express.static('route'));

app.get('/foo', function (req, res) {
    res.send('Hello from foo! [express sample]');
});

app.get('/bar', function (req, res) {
    res.send('Hello from bar! [express sample]');
});

app.listen(20715, "localhost", () => {
	console.log("Processing server is running");
});

process.on('exit', () => {
	console.log("server shutted down.");
	process.exit(0);
});