let socket;    // define a socket variable

function setup() {
  // connect to server via sockets
  socket = io.connect('http://www.cookingtool.tk/');

  // trigger 'updateMeals' when this client recieves a message called 'updateMeals'
  socket.on('updateMeals', updateMeals); // same message name as in server

  console.log('connected to server');
}

let meals;

function updateMeals(meals) {
  meals = meals;
  displayMeals('.wrapperMealList', meals);
  console.log('updated all meals!');
}

// function draw() {

// }

window.onload = function() {
    $('#meal-date').val(dateToday());
    // displayMeals('.wrapperMealList', meals);
    // displayMeals('.wrapperBestMeal', bestMeal);
};

function dateToday() {
    let today = new Date().toJSON().slice(0,10).replace(/-/g,'-');
    // console.log(today);
    return today;
}

$('#btn-saveChanges').click(function() {
    let inputMealName = $('#meal-name').val();
    $('#meal-name').val('');
    let inputMealDescription = $('#meal-description').val();
    $('#meal-description').val('');
    let inputMealDate = $('#meal-date').val();
    $('#meal-date').val(dateToday());
    
    // TODO: edit database and not the array
    console.log('Requesting to add a new Meal: Schnitzl');

    let newMeal = {
      name: inputMealName,
      description: inputMealDescription,
      date: inputMealDate
    }
  
    socket.emit('addMeal', newMeal);   // send "newMeal", messagename: "addMeal"
});

function displayMeals(container, meals) {
    $(container).children().remove();

    for (let i = 0; i < meals.length; i++) {
        $(container).append(
            '<div class="mealContainer rounded-lg bg-dark text-white">' +
                '<div class="mealHeader">' +
                    '<img src="assets/schnitzel.jpg" class="mr-2 card-img-left rounded-lg" alt="schnitzel">' +
                    '<h2>'+meals[i].name+'</h2>'+
                '</div>'+
                '<div class="mealMain d-flex">'+
                    '<div>'+
                        '<h4>Last Cook</h4>'+
                        '<p>'+meals[i].date+'</p>'+
                    '</div>'+
                    '<div>'+
                        '<h4>Rating</h4>'+
                        '<p>4.3</p>'+
                    '</div>'+
                '</div>'+
                '<div class="mealFooter">'+
                    '<div>'+
                        '<h5>Description</h5>'+
                        '<ul>'+
                            '<li>'+meals[i].description+'</li>'+
                        '</ul>'+
                    '</div>'+
                    '<p>Ratings: 3, 4, 5, 4, 3</p>'+
                '</div>'+
            '</div>'
        );
    }

    // footer display
    let toggleFooter = false;
    
    let footers = $('.mealFooter');
    for (let i = 0; i < footers.length; i++) {
        $(footers[i]).hide();
    }
    
    $('.mealContainer').click(function() {
        let footer = $(this).find('.mealFooter');
        if (toggleFooter) {
            footer.fadeOut();
            toggleFooter = false;
        }
        else {
            footer.fadeIn();
            toggleFooter = true;
        }
    });
    //
}

