const express = require("express");
const bots = require("./src/botsData");
const shuffle = require("./src/shuffle");
const path = require('path')
const cors = require("cors");


const playerRecord = {
  wins: 0,
  losses: 0,
};
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + '/public'));

var Rollbar = require('rollbar')
var rollbar = new Rollbar({
  accessToken: '5c4f9d5826894a8ba116f06555d6db0f',
  captureUncaught: true,
  captureUnhandledRejections: true,
})

rollbar.log('Hello world!')

app.get('/', (req, res) => {
  rollbar.info("HTML loaded successfully.");
  res.sendFile(path.join(__dirname, '/public/index.html'))
})

// Add up the total health of all the robots
const calculateTotalHealth = (robots) =>
  robots.reduce((total, { health }) => total + health, 0);

// Add up the total damage of all the attacks of all the robots
const calculateTotalAttack = (robots) =>
  robots
    .map(({ attacks }) =>
      attacks.reduce((total, { damage }) => total + damage, 0)
    )
    .reduce((total, damage) => total + damage, 0);

// Calculate both players' health points after the attacks
const calculateHealthAfterAttack = ({ playerDuo, compDuo }) => {
  const compAttack = calculateTotalAttack(compDuo);
  const playerHealth = calculateTotalHealth(playerDuo);
  const playerAttack = calculateTotalAttack(playerDuo);
  const compHealth = calculateTotalHealth(compDuo);

  return {
    compHealth: compHealth - playerAttack,
    playerHealth: playerHealth - compAttack,
  };
};

app.get("/api/robots", (req, res) => {
  try {
    rollbar.log("Robots loaded successfully.", {author: "Corbin", type: "manual entry"});
    res.status(200).send(botsArr);
  } catch (error) {
    rollbar.error("Failed to load robots.");
    console.error("ERROR GETTING BOTS", error);
    res.sendStatus(400);
  }
});

app.get("/api/robots/shuffled", (req, res) => {
  try {
    rollbar.log("Robots shuffled successfully.", {author: "Corbin", type: "manual entry"});
    let shuffled = shuffle(bots);
    res.status(200).send(shuffled);
  } catch (error) {
    rollbar.error("Failed to shuffle robots.");
    console.error("ERROR GETTING SHUFFLED BOTS", error);
    res.sendStatus(400);
  }
});

app.post("/api/duel", (req, res) => {
  try {
    const { compDuo, playerDuo } = req.body;

    const { compHealth, playerHealth } = calculateHealthAfterAttack({
      compDuo,
      playerDuo,
    });

    // comparing the total health to determine a winner
    if (compHealth > playerHealth) {
      playerRecord.losses += 1;
      rollbar.log("A player successfully lost a duel.", {author: "Corbin", type: "manual entry"});
      res.status(200).send("You lost!");
    } else {
      playerRecord.wins += 1;
      rollbar.log("A player successfully won a duel.", {author: "Corbin", type: "manual entry"});
      res.status(200).send("You won!");
    }
  } catch (error) {
    rollbar.error("Failed to duel.");
    console.log("ERROR DUELING", error);
    res.sendStatus(400);
  }
});

app.get("/api/player", (req, res) => {
  try {
    rollbar.log("A player successfully got their stats.", {author: "Corbin", type: "manual entry"});
    res.status(200).send(playerRecord);
  } catch (error) {
    rollbar.error("Failed to get a player's stats.");
    console.log("ERROR GETTING PLAYER STATS", error);
    res.sendStatus(400);
  }
});

app.listen(8000, () => {
  console.log(`Listening on 8000`);
});
