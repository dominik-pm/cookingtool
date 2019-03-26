let socket;    // define a socket variable

function setup() {
  // connect to server via sockets
  socket = io.connect('http://www.cookingtool.tk'); 
//   socket = io.connect('localhost:80'); // local

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
    
    console.log('Requesting to add a new Meal: Schnitzl');

    let newMeal = {
      name: inputMealName,
      description: inputMealDescription,
      date: inputMealDate,
      ratings: [],
      rating: 0
    }

    console.log(newMeal);
    
    socket.emit('addMeal', newMeal);   // send "newMeal", messagename: "addMeal"
});

function displayMeals(container, meals) {
    $(container).children().remove();

    let ratingStrings = [];
    for (let i = 0; i < meals.length; i++) {
        ratingStrings[i] = meals[i].ratings;
    }

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
                        '<h4>Rate</h4>'+
                        '<button class="btn btn-success btn-rate1" value='+i+'>1</button>'+
                        '<button class="btn btn-warning btn-rate2" value='+i+'>2</button>'+
                        '<button class="btn btn-info btn-rate3" value='+i+'>3</button>'+
                        '<button class="btn btn-primary btn-rate4" value='+i+'>4</button>'+
                        '<button class="btn btn-danger btn-rate5" value='+i+'>5</button>'+
                    '</div>'+
                    '<div>'+
                        '<h4>Rating</h4>'+
                        '<p>'+ meals[i].rating +'</p>'+
                    '</div>'+
                '</div>'+
                '<div class="mealFooter">'+
                    '<div>'+
                        '<h5>Description</h5>'+
                        '<ul>'+
                            '<li>'+meals[i].description+'</li>'+
                        '</ul>'+
                    '</div>'+
                    '<p>Ratings: '+ ratingStrings[i] +'</p>'+
                '</div>'+
            '</div>'
        );
    }
    
    // Rating
    // TODO: maybe more dynamic
    // get somehow the rating (1-5)
    // 'mealIndex' = +$(this).val();    // + converts the value of the button to a number
    // 'rateMeal': [index of the meal, rating]

    $('.btn-rate1').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('rateMeal', [mealIndex, 1]);
    });
    $('.btn-rate2').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('rateMeal', [mealIndex, 2]);
    });
    $('.btn-rate3').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('rateMeal', [mealIndex, 3]);
    });
    $('.btn-rate4').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('rateMeal', [mealIndex, 4]);
    });
    $('.btn-rate5').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('rateMeal', [mealIndex, 5]);
    });


    // footer display
    let toggleFooter = false;
    
    let footers = $('.mealFooter');
    for (let i = 0; i < footers.length; i++) {
        $(footers[i]).hide();
    }
    
    $('.mealHeader').click(function() {
        let footer = $(this).parent().find('.mealFooter');
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