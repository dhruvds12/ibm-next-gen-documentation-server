const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

app.use(bodyParser.json());

let notes = [];

app.post('/notes', (req, res) => {
    const note = req.body;
    notes.push(note);
    res.status(201).send(note);
    console.log(`Post ${notes}`)
});

app.get('/notes', (req, res) => {
    res.status(200).send(notes);
    console.log(`Get ${notes}`)
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
