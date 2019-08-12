let socket;    // define a socket variable

function setup() {
    // connect to server via sockets
    // socket = io.connect('http://37.120.137.243:13181');
    // socket = io.connect('http://cookingtool.tk');
    // socket = io.connect('192.168.1.133:80');
    
    socket = io.connect('http://10.0.0.33:5000');
    // socket = io.connect('localhost:5500'); // local

    // trigger 'updateMeals' when this client recieves a message called 'updateMeals'
    socket.on('updateMeals', updateMeals); // same message name as in server
    socket.on('setMealToday', setMealToday);
    socket.on('alertModal', alertModal);
    socket.on('alertGeneral', alertGeneral);
    socket.on('unsetMealToday', unsetMealToday);
    socket.on('loggedIn', loggedIn);
    socket.on('registered', registered);

    console.log('connected to server! ');

    noCanvas();
}

let meals;

/* #region server called functions */
function updateMeals([m, mealSuggestedIndex]) {
    meals = m;
    setIneciesMeals()   // TODO: do better (some completely different system please)
    displayMeals('.wrapperMealList', meals)
    displayMeals('.wrapperMealSuggested', [meals[mealSuggestedIndex]]);
    updateMealTodayPlaceholder(meals);
    console.log('updated all meals!');
}
function setMealToday([mealToday]) {
    console.log('set meal to cook for today')
    $('.mealTodayPlaceholder').hide();              // hide default stuff when there is no meal for today
    displayMeals('.wrapperMealToday', [mealToday]); // add the meal to the container
    $('.wrapperMealToday').show();                  // show the meal today wrapper
    $('#btn-unsetMealToday').show();                // show the button to unselect today's meal
    $('#btn-unsetMealToday').click(function () {    // eventlistener to that button
        socket.emit('req-unsetMealToday');
    });
}
function unsetMealToday() {
    console.log('unset meal to cook for today')
    $('.wrapperMealToday').hide();
    $('#btn-unsetMealToday').show();
    $('.mealTodayPlaceholder').show();
}
function alertModal([dangerBool, msg]) {
    console.log(msg);
    
    // get all modals
    let modals = $('.modal');
    // find active modal
    let activeModal = null;
    for (let i = 0; i < modals.length; i++) {
        if ($(modals[i]).is(':visible')) {
            activeModal = modals[i];
        }
    }
    if (activeModal == null) {
        console.log('critical error: no open modal to show alert');
    }
    
    let alertBox;
    if (dangerBool) {
        alertBox = $(activeModal).find('.alert-danger-modal');
    }
    else {
        alertBox = $(activeModal).find('.alert-success-modal');
    }
    alertBox.text(msg);
    alertBox.slideDown("slow");
    setTimeout(function () {
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
    setTimeout(function () {
        alertBox.fadeOut(1000);
    }, 2500);
}
function loggedIn([username, memberstatus]) {
    // clear modal and hide it
    // TODO: maybe a better way doing that
    $('#username-login').val('');
    $('#password-login').val('');
    $('.modal').modal('hide');

    $('header #logged-out').hide();
    $('header #logged-in').show();

    $('#username-p').text(username);
    // memberstatus is 0 - not a member, 1 - member, 2 - admin
    if (memberstatus == 0) {
        $('#memberstatus-p').removeClass();
        $('#memberstatus-p').addClass('text-light');
        $('#memberstatus-p').text('Not A Member');
    }
    else if (memberstatus == 1) {
        $('#memberstatus-p').removeClass();
        $('#memberstatus-p').addClass('text-info');
        $('#memberstatus-p').text('Member');
    }
    else if (memberstatus == 2) {
        $('#memberstatus-p').removeClass();
        $('#memberstatus-p').addClass('text-success');
        $('#memberstatus-p').text('Admin');
    }
}
function registered(msg) {
    // clear modal and hide it
    // TODO: maybe a better way doing that
    $('#username-register').val('');
    $('#password-register').val('');
    $('#repassword-register').val('');
    $('#register-modal').modal('hide');
}
/* #endregion server called functions */

window.onload = function () {
    $('#meal-date').val(getDateToday());
    $('.alert').hide();
    $('#btn-unsetMealToday').hide();

    $('header #logged-out').show();
    $('header #logged-in').hide();
};

$('#login-btn').click(function() {
    login();
});
$('#register-btn').click(function() {
    register();
});
$('#logoff-btn').click(function() {
    $('#logoff-modal').modal('show');
});
$('#logoff-confirm-btn').click(function() {
    logoff();
});

// for tooltips
function activatetooltips() {
    $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();   
    });
}
$('#btn-saveChanges').click(function () {
    let inputMealName = $('#meal-name').val();
    $('#meal-name').val('');
    let inputMealDescription = $('#meal-description').val();
    $('#meal-description').val('');
    let inputMealDate = $('#meal-date').val();
    $('#meal-date').val(getDateToday());

    console.log('Requesting to add a new Meal: \'' + inputMealName + '\'');

    let newMeal = {
        name: inputMealName,
        description: inputMealDescription,
        date: inputMealDate,
        ratings: [],
        rating: 0
    }

    // console.log(newMeal);

    socket.emit('req-addMeal', newMeal);   // send "newMeal", messagename: "addMeal"
});

$('#btn-cookSuggested').click(function () {
    socket.emit('req-setMealTodaySuggested');
    // console.log('requested to cook suggested meal today');
});

function updateMealTodayPlaceholder(meals) {
    let dropdownMenu = $('.dropdown-menu');

    dropdownMenu.children().remove();

    for (let i = 0; i < meals.length; i++) {
        dropdownMenu.append('<a class="dropdown-item" href="#">' + meals[i].name + '</a>');
    }

    $('.dropdown-item').click(function () {
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
function login() {
    $('#login-submit-btn').click(function () {
        let unInput = $('#username-login');
        let pwInput = $('#password-login');
        socket.emit('req-login', [unInput.val(), pwInput.val()]);
    });
}
function register() {
    $('#register-submit-btn').click(function() {
        let unInput = $('#username-register');
        let pwInput = $('#password-register');
        let repwInput = $('#repassword-register');
        socket.emit('req-register', [unInput.val(), pwInput.val(), repwInput.val()]);
    });
}
function logoff() {
    socket.emit('req-logoff');
    $('header #logged-out').show();
    $('header #logged-in').hide();
}
function setIneciesMeals() {
    for (let i = 0; i < meals.length; i++) {
        meals[i].index = i;
    }
}
function displayMeals(container, meals) {
    $(container).children().remove();

    let ratingStrings = [];
    for (let i = 0; i < meals.length; i++) {
        ratingStrings[i] = meals[i].ratings;
    }

    for (let i = 0; i < meals.length; i++) {

        let rate = '';
        // only the meal cooked today can be rated
        if (container == '.wrapperMealToday') {
            rate =
                '<div>' +
                '<h4>Rate</h4>' +
                '<button class="btn btn-success btn-rate1" value=' + meals[i].index + '>1</button>' +
                '<button class="btn btn-warning btn-rate2" value=' + meals[i].index + '>2</button>' +
                '<button class="btn btn-info btn-rate3" value=' + meals[i].index + '>3</button>' +
                '<button class="btn btn-primary btn-rate4" value=' + meals[i].index + '>4</button>' +
                '<button class="btn btn-danger btn-rate5" value=' + meals[i].index + '>5</button>' +
                '</div>';
        }

        $(container).append(
            '<div class="mealContainer rounded-lg bg-dark text-white">' +
            '<div class="mealHeader">' +
            '<img src="assets/mealIcon.png" class="mr-2 card-img-left rounded-lg" alt="Meal">' +
            '<h2>' + meals[i].name + '</h2>' +
            '</div>' +
            '<div class="mealMain d-flex">' +
            '<div>' +
            '<h4>Last Cooked</h4>' +
            '<p>' + meals[i].date + '</p>' +
            '</div>' +
            rate +
            '<div>' +
            '<h4>Rating</h4>' +
            '<p>' + meals[i].rating + '</p>' +
            '</div>' +
            '</div>' +
            '<div class="mealFooter">' +
            '<div>' +
            '<p>Description</p>' +
            '<ul>' +
            '<li>' + meals[i].description + '</li>' +
            '</ul>' +
            '</div>' +
            '<p>Ratings: ' + ratingStrings[i] + '</p>' +
            '</div>' +
            '</div>'
        );
    }

    // Rating
    // TODO: maybe more dynamic
    // get somehow the rating (1-5)
    // 'mealIndex' = +$(this).val();    // + converts the value of the button to a number
    // 'rateMeal': [index of the meal, rating]

    $('.btn-rate1').unbind().click(function () {
        let mealName = $(this).closest('.mealContainer').find('h2')[0].textContent;
        socket.emit('req-rateMeal', [mealName, 1]);
    });
    $('.btn-rate2').unbind().click(function () {
        let mealName = $(this).closest('.mealContainer').find('h2')[0].textContent;
        socket.emit('req-rateMeal', [mealName, 2]);
    });
    $('.btn-rate3').unbind().click(function () {
        let mealName = $(this).closest('.mealContainer').find('h2')[0].textContent;
        socket.emit('req-rateMeal', [mealName, 3]);
    });
    $('.btn-rate4').unbind().click(function () {
        let mealName = $(this).closest('.mealContainer').find('h2')[0].textContent;
        socket.emit('req-rateMeal', [mealName, 4]);
    });
    $('.btn-rate5').unbind().click(function () {
        let mealName = $(this).closest('.mealContainer').find('h2')[0].textContent;
        socket.emit('req-rateMeal', [mealName, 5]);
    });

    // $('.btn-rate1').unbind().click(function () {
    //     console.log('clicked on 1!');
    //     let mealIndex = +$(this).val();
    //     socket.emit('req-rateMeal', [mealIndex, 1]);
    // });
    // $('.btn-rate2').unbind().click(function () {
    //     let mealIndex = +$(this).val();
    //     socket.emit('req-rateMeal', [mealIndex, 2]);
    // });
    // $('.btn-rate3').unbind().click(function () {
    //     let mealIndex = +$(this).val();
    //     socket.emit('req-rateMeal', [mealIndex, 3]);
    // });
    // $('.btn-rate4').unbind().click(function () {
    //     let mealIndex = +$(this).val();
    //     socket.emit('req-rateMeal', [mealIndex, 4]);
    // });
    // $('.btn-rate5').unbind().click(function () {
    //     let mealIndex = +$(this).val();
    //     socket.emit('req-rateMeal', [mealIndex, 5]);
    // });


    // hide all meal footers by default
    let footers = $(container + ' .mealFooter');
    for (let i = 0; i < footers.length; i++) {
        $(footers[i]).hide();
    }

    // slide down/up meal footer when clicked on meal header
    $(container + ' .mealHeader').click(function () {
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
    activatetooltips();
}
function getDateToday() {
    let today = new Date().toJSON().slice(0, 10).replace(/-/g, '-');
    // console.log(today);
    return today;
}
