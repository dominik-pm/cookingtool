// Setup the Server
  var express = require('express');

  var port = 5000;
  // var port = 5500;

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
  let data;
  
  data = fs.readFileSync('meals.json'); // read the current meals (raw json data)
  let meals = JSON.parse(data);             // parse the raw data so meals is a JS Array with the meal objects in it

  data = fs.readFileSync('user.json'); // read all the current user (raw json data)
  let allUser = JSON.parse(data);             // parse the raw data so meals is a JS Array with the meal objects in it

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
  let memberstatus = 0 // 0 - read, 1 - rate, 2 - admin
  let loggedinUserIndex = null;
  //
  
  // trigger these functions if there are that messages frin the client
  socket.on('req-addMeal', addMeal);
  socket.on('req-rateMeal', rateMeal);
  socket.on('req-login', login);
  socket.on('req-loginFromStorage', loginFromStorage);
  socket.on('req-register', register);
  socket.on('req-logoff', logoff);
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
    if (loggedinUserIndex != null) {

      // check validity of new meal
      if (memberstatus >= 2) {
        
        let mealNameValid = true;
        
        // name should have at least 3 letters
        if (newMeal.name.length < 3) {
          mealNameValid = false;
        }
        
        // name should not be a duplicant
        if (meals.length > 0) {
          for (let i = 0; i < meals.length; i++) {
            if (meals[i].name == newMeal.name) {
              mealNameValid = false;
            }
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
          socket.emit('alertModal', [false, msg])  // [dangerBool/*'true if its an error'*/, msg]
        }
        else {
          // if invalid meal name:
          //  -> send error message to this client
          let msg = 'Couldn\'t add this meal to database. Invalid meal name!';
          socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
        }
      }
      else {
        // if no admin permissions:
        //  -> send error message to this client
        let msg = 'Couldn\'t add this meal to database. You are not an admin!';
        socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
      }
    }
    else {
      let msg = 'You are not logged in!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
  }
  function rateMeal([mealName, rating]) {
    let msg = '';

    // find index
    let index = 0;
    for (let i = 0; i < meals.length; i++) {
      if (meals[i].name == mealName) {
        index = i;
      }
    }
  
    // check for rating validity 
    if (rating != null && rating >= 1 && rating <= 5) {
      // check for index validity 
      if (index < meals.length && index >= 0) {
        // check if rated meal is cooked today
        if (index == mealTodayIndex || true) {
          // check if the user is logged in
          if (loggedinUserIndex != null) {
            // check if the user is a member or an admin
            if (memberstatus >= 1) {
              // check if the user has already rated this meal
              let rated = false;
              if (loggedinUserIndex != null) {
                for (let i = 0; i < allUser[loggedinUserIndex].ratings.length; i++) {
                  if (allUser[loggedinUserIndex].ratings[i].meal == meals[index].name) {
                    rated = true;
                  }
                }
              }
              if (!rated) {

                // add the new rating to the meal with the given index
                meals[index].ratings.unshift(rating);
                // max ratings: 10
                if (meals[index].ratings.length > 10) {
                  meals[index].ratings.pop();
                }
                // log the rating to the user
                allUser[loggedinUserIndex].ratings.push(
                  {
                    meal: mealName,
                    rated: rating
                  });
                let data = JSON.stringify(allUser, null, 2);  // stringify the allUser array
                fs.writeFile('user.json', data, function(e){});    // save the stringified JSON

                console.log(meals[index].name + ' just got rated a ' + rating + '!');
                
                globalUpdateMeals();
                
                msg += 'Rated \'' + meals[index].name + '\' a ' + rating + '!';
                socket.emit('alertGeneral', [false, msg])
              }
              else {
                msg += 'You have already rated this meal!';
                socket.emit('alertGeneral', [true, msg])
              }
            }
            else {
              msg += 'You are not a member!';
              socket.emit('alertGeneral', [true, msg])
            }
          }
          else {
            let msg = 'You are not logged in!';
            socket.emit('alertGeneral', [true, msg]);
          }
        }
        else {
          msg += 'You can only rate a meal that is cooked today!';
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
  function loginFromStorage(username) {
    let user = allUser.find(function(u) {
      return u.username == username;
    });

    if (user != null) {
      loginUser(user);
    }
    else {
      console.log('storage login didnt work');
    }
  }
  function login([username, password]) {
    let user = allUser.find(function(u) {
      return u.username == username;
    });

    if (user == null) {
      // there is not a user registered with that username
      let msg = username + ' is not registered yet!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else if (user.password != password && password) {
      let msg = 'Wrong password!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else {
      // correctly logged in
      loginUser(user);
    }
  }
  function loginUser(user) {
      loggedinUserIndex = allUser.indexOf(user);

      let msg = 'Logged in!';
      socket.emit('alertGeneral', [false, msg])  // [dangerBool/*'true if its an error'*/, msg]
      console.log(user.username + ' just logged in!');
      memberstatus = user.memberstatus;
      socket.emit('loggedIn', [user.username, user.memberstatus]);
  }
  function register([username, password, repassword]) {
    // check for errors
    if (username.length < 2) {
      // username is too short
      let msg = 'Username is too short!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else if (allUser.find(function(user) {
      return user.username == username;
    })) {
      // username already exists
      let msg = 'Username already registered!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else if (password.length < 3) {
      // password is too short
      let msg = 'Password too short!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else if (password != repassword) {
      // passwords dont match
      let msg = 'Passwords don\'t match!';
      socket.emit('alertModal', [true, msg])  // [dangerBool/*'true if its an error'*/, msg]
    }
    else {
      // valid register
      // write the new user to file: user.json
      let newUser = {
        username: username,
        password: password,
        memberstatus: 0
      }
      allUser.push(newUser);                        // add the new user to the array
      let data = JSON.stringify(allUser, null, 2);  // stringify the allUser array
      fs.writeFile('user.json', data, finished);   // save the stringified JSON
      function finished(error) {
        console.log(newUser.username + ' registered!');
      }

      let msg = 'Successfully registered the user \'' + username + '\'!';
      socket.emit('alertGeneral', [false, msg])  // [dangerBool/*'true if its an error'*/, msg]
    
      socket.emit('registered', 'success')  // [dangerBool/*'true if its an error'*/, msg]
    }
  } 
  function logoff() {
    memberstatus = 0;
    loggedinUserIndex = null;
  }
  function setMealToday(index) {
    if (loggedinUserIndex != null) {
      if (memberstatus >= 2) {
        if (!mealTodaySet) {
          if (index < meals.length) {
            mealTodayIndex = index;
            mealTodaySet = true;
            emitMealToday();
            console.log('set meal today:');
            console.log(meals[mealTodayIndex]);
            meals[mealTodayIndex].date = new Date().toJSON().slice(0, 10).replace(/-/g, '-'); // change last cooked date of this meal to today
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
        let msg = 'You are not an admin!';
        socket.emit('alertGeneral', [true, msg]);
      }
    }
    else {
      let msg = 'You are not logged in!';
      socket.emit('alertGeneral', [true, msg]);
    }
  }
  function unsetMealToday() {
    if (loggedinUserIndex != null) {
      if (memberstatus >= 2) {
        if (mealTodaySet) {
          mealTodaySet = false;
          io.sockets.emit('unsetMealToday');
          console.log('unset meal today');
          let msg = 'Successfully unset today\'s meal!'
          socket.emit('alertGeneral', [false, msg]);
        }
      }
      else {
        let msg = 'You are not an admin!';
        socket.emit('alertGeneral', [true, msg]);
      }
    }
    else {
      let msg = 'You are not logged in!';
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
  io.sockets.emit('updateMeals', [meals, mealSuggestedIndex]);
  emitMealToday();
}

function emitMealToday() {
  if (mealTodaySet) {
    io.sockets.emit('setMealToday', [meals[mealTodayIndex], mealTodayIndex]);
  }
}

function updateSuggested() {
  let startIndex = Math.floor(meals.length/2);

  mealSuggestedIndex = meals.length-1;

  for (let i = meals.length-1; i >= startIndex; i--) {
    if (meals[i].rating < meals[mealSuggestedIndex].rating) {
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
        return 1;
    } else if (date1 > date2) {
        return -1;
    } else {
        return 0;
    }
  });
}
