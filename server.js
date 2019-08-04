// Setup the Server
  var express = require('express');

  var port = 5000;

  var app = express();
  var server = app.listen(port);
  app.use(express.static('public'));
  console.log("Socket server is runnning on port " + port);

  // let app = express();
  // let server = require('http').createServer(app);
  // let io = require('socket.io').listen(server);
// ----
  
var socket = require('socket.io'); // old
var io = socket(server); // old

io.sockets.on('connection', newConnection);

// --- reading from the meals.json file ---
  let fs = require('fs');                   // import the FileSystem of NodeJS
  let data = fs.readFileSync('meals.json'); // read the current meals (raw json data)
  let meals = JSON.parse(data);             // parse the raw data so meals is a JS Array with the meal objects in it

  // meals.sort((a, b) => a.rating - b.rating);// sort by rating (best to worst)
  
  // readFileSync vs readFile:
  // with sync the next line of code gets executed when the file has been fully read
  // with asynchronos sync you can still listen to other stuff while loading the json
// --- ---

let mealTodayIndex;
let mealTodaySet = false;
let mealSuggestedIndex;
globalUpdateMeals();

function newConnection(socket) {
  console.log('new connection: ' + socket.id);

  // check user validity
  let validUser = false;
  let validAdmin = false;
  //
  
  // trigger these functions if there are that messages frin the client
  socket.on('req-addMeal', addMeal);
  socket.on('req-rateMeal', rateMeal);
  socket.on('req-setPassword', setPassword);
  socket.on('req-setMealToday', setMealToday);
  socket.on('req-unsetMealToday', unsetMealToday);
  socket.on('req-setMealTodaySuggested', setMealTodaySuggested);
  //

  // give the client the meals once he's connected
  socket.emit('updateMeals', [meals, mealSuggestedIndex]); 

  emitMealToday();

  var date = new Date();
  var current_hour = date.getHours();
  if (current_hour >= 16) { 
    console.log('unsetting meal today, time: ' + current_hour);
    io.sockets.emit('unsetMealToday');
  }

  // client called functions
  function addMeal(newMeal) {
    // check validity of new meal
    if (validAdmin) {

      let mealNameValid = true;

      // name should have at least 3 letters
      if (newMeal.name.length < 3) {
        mealNameValid = false;
      }

      // name should not be a duplicant
      for (let i = 0; i < meals.length; i++) {
        if (meals[i].name == newMeal.name) {
          mealNameValid = false;
        }
      }

      if (mealNameValid) {
        // if 'newMeal' is valid
        //  -> write to json and send update all meals
        
        // --- writing to the meals.json file ---
          meals.push(newMeal);                          // add the new meal to the array from the json file
          let data = JSON.stringify(meals, null, 2);    // stringify the new meals array
          fs.writeFile('meals.json', data, finished);   // save the stringified JSON
          function finished(error) {
            console.log(newMeal.name + ' added to database!');
          }
        // --- ---

        globalUpdateMeals();

        let msg = 'Added ' + newMeal.name + ' to database!';
        socket.emit('alertAddMeal', [false, msg])  // [dangerBool/*'true if its an error'*/, msg]
      }
      else {
        // if invalid meal name:
        //  -> send error message to this client
        let msg = 'Couldn\'t add this meal to database. Invalid meal name!';
        socket.emit('alertAddMeal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
      }
    }
    else {
      // if no admin permissions:
      //  -> send error message to this client
      let msg = 'Couldn\'t add this meal to database. You are not a valid admin!';
      socket.emit('alertAddMeal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
  }
  function rateMeal([index, rating]) {
    let msg = '';
  
    // check for rating validity 
    if (rating != null && rating >= 1 && rating <= 5) {
      // check for index validity 
      if (index < meals.length && index >= 0) {
        // check user validity 
        if (validUser) {
          // add the new rating to the meal with the given index
          meals[index].ratings.unshift(rating);
          // max ratings: 10
          if (meals[index].ratings.length > 10) {
            meals[index].ratings.pop();
          }

          globalUpdateMeals();
  
          msg += 'Rated \'' + meals[index].name + '\' a ' + rating + '!';
          socket.emit('alertGeneral', [false, msg])
        }
        else {
          msg += 'You are not a valid user!';
          socket.emit('alertGeneral', [true, msg])
        }
      }
      else {
        msg += 'Index not valid!';
        socket.emit('alertGeneral', [true, msg])
      }
    }
    else {
      msg += 'Rating not valid!';
      socket.emit('alertGeneral', [true, msg])
    }
  }
  function setPassword(pw) {
    let validUserPW = '321';
    let validAdminPW = '987654321';
    if (pw == validUserPW) {
      validUser = true;
      console.log('user logon');
    }
    else if (pw == validAdminPW) {
      validUser = true;
      validAdmin = true;
      console.log('admin logon');
    }
    else {
      console.log('user wrong pw');
    }
  }  
  function setMealToday(index) {
    if (validAdmin) {
      if (!mealTodaySet) {
        if (index < meals.length) {
          mealTodayIndex = index;
          mealTodaySet = true;
          emitMealToday();
          console.log('set meal today:');
          console.log(meals[mealTodayIndex]);
          let msg = 'Successfully set today\'s meal!'
          socket.emit('alertGeneral', [false, msg]);
        }
        else {
          let msg = 'Index too high (you are as well probably :) )!';
          socket.emit('alertGeneral', [true, msg]);
        }
      }
      else {
        let msg = 'Meal already set to be cooked today!';
        socket.emit('alertGeneral', [true, msg]);
      }
    }
    else {
      let msg = 'You are not a valid admin!';
      socket.emit('alertGeneral', [true, msg]);
    }
  }
  function unsetMealToday() {
    if (validAdmin) {
      if (mealTodaySet) {
        mealTodaySet = false;
        io.sockets.emit('unsetMealToday');
        console.log('unset meal today');
        let msg = 'Successfully unset today\'s meal!'
        socket.emit('alertGeneral', [false, msg]);
      }
    }
    else {
      let msg = 'You are not a valid admin!';
      socket.emit('alertGeneral', [true, msg]);
    }
  }
  function setMealTodaySuggested() {
    setMealToday(mealSuggestedIndex);
    console.log('set meal suggested to be cooked today');
  }
  //
}

function globalUpdateMeals() {
  sortMealsByDate();
  updateRating();
  updateSuggested();
  emitMealToday();
  io.sockets.emit('updateMeals', [meals, mealSuggestedIndex]);
}

function emitMealToday() {
  if (mealTodaySet) {
    io.sockets.emit('setMealToday', meals[mealTodayIndex]);
  }
}

function updateSuggested() {
  let startIndex = Math.floor(meals.length/2);

  mealSuggestedIndex = meals.length-1;

  for (let i = meals.length-1; i >= startIndex; i--) {
    if (meals[i].rating < meals[mealSuggestedIndex].rating || meals[mealSuggestedIndex].rating == 0) {
      mealSuggestedIndex = i;
    }
  }
}

function updateRating() {
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
}