// Setup the Server
  var express = require('express');

  var app = express();
  var server = app.listen(80);

  app.use(express.static('public'));

  console.log("Socket server is runnning");
// ----

var socket = require('socket.io');
var io = socket(server);

io.sockets.on('connection', newConnection);


// --- reading from the meals.json file ---
  let fs = require('fs');                   // import the FileSystem of NodeJS
  let data = fs.readFileSync('meals.json'); // read the current meals (raw json data)
  let meals = JSON.parse(data);             // parse the raw data so meals is a JS Array with the meal objects in it
  
  // meals.sort((a, b) => a.rating - b.rating);// sort by rating (best to worst)
  
  updateMeals();

  // readFileSync vs readFile:
  // with sync the next line of code gets executed when the file has been fully read
  // with asynchronos sync you can still listen to other stuff while loading the json
/// --- ---

function newConnection(socket) {
  console.log('new connection: ' + socket.id);

  socket.emit('updateMeals', meals);  // give the client the meals once its connected
  // (only this client (currently to all))

  // if there is a message called 'addMeal' from this client --> trigger the 'addMeal'-function
  socket.on('addMeal', addMeal);

  socket.on('rateMeal', rateMeal);


  function addMeal(newMeal) {
    console.log('received a new meal: ' + newMeal.name);
    // maybe some checking
    // if (newMeal.name) ...
    // if all good: write to json and send a message 'updateMeals' to all CLients
    // {
      // --- writing to the meals.json file ---
        meals.push(newMeal);                          // add the new meal to the array from the json file
        let data = JSON.stringify(meals, null, 2);    // stringify the new meals array
        fs.writeFile('meals.json', data, finished);   // save the stringified JSON
        function finished(error) {
          console.log(newMeal.name + ' added to database!');
        }
        // --- ---
        
        updateMeals();
    // }
    // if anything wrong: send error message to this client
    // {
      //socket.emit('newMealError', errorMsg); //--> goes to everyone including this client
    //}
  }
}

function rateMeal([index, rating]) {
  // add the new rating to the meal with the given index
  meals[index].ratings.unshift(rating);
  // max ratings: 10
  if (meals[index].ratings.length > 10) {
    meals[index].ratings.pop();
  }
  updateMeals();
} 

function updateMeals() {
  sortMealsByDate();
  calculateRating();
  // socket.broadcast.emit('updateMeals', meals);    // send data to all other clients, could be renamed or changed
  io.sockets.emit('updateMeals', meals); //--> goes to everyone including this client
}

function calculateRating() {
  for (let i = 0; i < meals.length; i++) {
    if (meals[i].ratings.length < 1) {
      meals[i].rating = 0;
    }
    else {
      let sum = 0;
      for (let j = 0; j < meals[i].ratings.length; j++) {
        sum += meals[i].ratings[j];
      }
      meals[i].rating = Math.round((sum / meals[i].ratings.length) * 10) / 10;
    }
  }
}

function sortMealsByDate() {
  // sort by date (newest first)
  let sortedMeals = meals;
  sortedMeals.sort((a, b) => {  // sort by date
    let date1 = a.date;
    let date2 = b.date;
    if (date1 < date2) {
        return -1;
    } else if (date1 > date2) {
        return 1;
    } else {
        return 0;
    }
  });
  console.log(sortedMeals);
}