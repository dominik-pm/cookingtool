let socket;    // define a socket variable

function setup() {
    // connect to server via sockets
    // socket = io.connect('http://37.120.137.243:13181');
    // socket = io.connect('http://cookingtool.tk');
    //socket = io.connect('192.168.1.133:80');
    socket = io.connect('localhost:80'); // local

    // trigger 'updateMeals' when this client recieves a message called 'updateMeals'
    socket.on('updateMeals', updateMeals); // same message name as in server
    socket.on('setMealToday', setMealToday);
    socket.on('alertAddMeal', alertAddMeal);
    socket.on('alertGeneral', alertGeneral);
    socket.on('unsetMealToday', unsetMealToday);

    console.log('connected to server! ');

    noCanvas();
}

let meals;

// --- server called functions ---
function updateMeals([meals, mealSuggestedIndex]) {
    meals = meals;
    displayMeals('.wrapperMealList', meals);
    displayMeals('.wrapperMealSuggested', [meals[mealSuggestedIndex]]);
    updateMealTodayPlaceholder(meals);
    console.log('updated all meals!');
}
function setMealToday(mealToday) {
    console.log('set meal to cook for today')
    $('.mealTodayPlaceholder').hide();              // hide default stuff when there is no meal for today
    displayMeals('.wrapperMealToday', [mealToday]); // add the meal to the container
    $('.wrapperMealToday').show();                  // show the meal today wrapper
    $('#btn-unsetMealToday').show();                // show the button to unselect today's meal
    $('#btn-unsetMealToday').click(function() {     // eventlistener to that button
        socket.emit('req-unsetMealToday');
    });
}
function unsetMealToday() {
    console.log('unset meal to cook for today')
    $('.wrapperMealToday').hide();
    $('#btn-unsetMealToday').show();
    $('.mealTodayPlaceholder').show();
}
function alertAddMeal([dangerBool, msg]) {
    let alertBox;
    if (dangerBool) {
        alertBox = $('.alert-danger-modal');
    }
    else {
        alertBox = $('.alert-success-modal');
    }
    alertBox.text(msg);
    alertBox.slideDown("slow");
    setTimeout(function() {
        alertBox.fadeOut(1000);
    }, 2500);
}
function alertGeneral([dangerBool, msg]) {
    let alertBox;
    if (dangerBool) {
        alertBox = $('.alert-danger-general');
    }
    else {
        alertBox = $('.alert-success-general');
    }
    alertBox.find('p').text(msg);
    alertBox.slideDown("slow");
    setTimeout(function() {
        alertBox.fadeOut(1000);
    }, 2500);
}
// --- ---


window.onload = function() {
    $('#meal-date').val(getDateToday());
    $('.alert').hide();
    $('#btn-unsetMealToday').hide();
    setPassword();
};

$('#btn-saveChanges').click(function() {
    let inputMealName = $('#meal-name').val();
    $('#meal-name').val('');
    let inputMealDescription = $('#meal-description').val();
    $('#meal-description').val('');
    let inputMealDate = $('#meal-date').val();
    $('#meal-date').val(getDateToday());
    
    console.log('Requesting to add a new Meal: \'' + inputMealName +'\'');

    let newMeal = {
      name: inputMealName,
      description: inputMealDescription,
      date: inputMealDate,
      ratings: [],
      rating: 0
    }

    console.log(newMeal);
    
    socket.emit('req-addMeal', newMeal);   // send "newMeal", messagename: "addMeal"
});

$('#btn-cookSuggested').click(function() {
    socket.emit('req-setMealTodaySuggested');
    // console.log('requested to cook suggested meal today');
});

function updateMealTodayPlaceholder(meals) {
    let dropdownMenu = $('.dropdown-menu');

    dropdownMenu.children().remove();

    for (let i = 0; i < meals.length; i++) {
        dropdownMenu.append('<a class="dropdown-item" href="#">'+ meals[i].name +'</a>');
    }

    $('.dropdown-item').click(function() {
        let index = 0;

        let dropdownItems = $($(this).parent()).children();

        for (let i = 0; i < dropdownItems.length; i++) {
            if (dropdownItems[i].innerText == this.innerText) {
                index = i;
            }
        }

        socket.emit('req-setMealToday', index);
    });
}
function setPassword() {
    let alertBox = $('.alert-info');
    alertBox.slideDown("slow");
    $('#btnPasswordSubmit').click(function() {
        let pwInput = $('#inputPassword');
        alertBox.fadeOut(1000);
        socket.emit('req-setPassword', pwInput.val());
        pwInput.val('');
    });
}
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
                '<img src="assets/mealIcon.png" class="mr-2 card-img-left rounded-lg" alt="schnitzel">' +
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
        socket.emit('req-rateMeal', [mealIndex, 1]);
    });
    $('.btn-rate2').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('req-rateMeal', [mealIndex, 2]);
    });
    $('.btn-rate3').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('req-rateMeal', [mealIndex, 3]);
    });
    $('.btn-rate4').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('req-rateMeal', [mealIndex, 4]);
    });
    $('.btn-rate5').click(function() {
        let mealIndex = +$(this).val();
        socket.emit('req-rateMeal', [mealIndex, 5]);
    });
    
    
    // hide all meal footers by default
    let footers = $(container + ' .mealFooter');
    for (let i = 0; i < footers.length; i++) {
        $(footers[i]).hide();
    }

    // slide down/up meal footer when clicked on meal header
    $(container + ' .mealHeader').click(function() {
        let collapse = $(this).parent().find('.mealFooter');
        // collapse: element to collapse
        if ($(collapse).is(':visible')) {
            collapse.slideUp();
            footerVisible = false;
        }
        else {
            collapse.slideDown();
            footerVisible = true;
        }
    });
}
function getDateToday() {
    let today = new Date().toJSON().slice(0,10).replace(/-/g,'-');
    // console.log(today);
    return today;
}