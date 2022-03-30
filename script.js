
// this  evens out logic() and render() functions to be on same frames per second ticker
var FPS = 60
setInterval(function () {
    logic()
    render()
}, 1000 / FPS)

// HTML element variables
var can     //variable for canvas html element
var ctx     // variable for canvas context
var log_p   // variable for log paragraph html element
var cred_p  // variable for credits paragraph html element

var symbols_loaded = false
var reels_bg_loaded = false

// variables used for the images and sounds
var symbols = new Image() //this Image() constructor creates an HTMLImageElement and is functionally equivalent to document.createElement('img')
var reels_bg = new Image() //this Image() constructor creates an HTMLImageElement and is functionally equivalent to document.createElement('img')
var snd_reel_stop = new Array() //this is a variable as array for sounds when stopping a reel, more reels more times it goes off
var snd_win //variable for the sound when win situation appears

symbols.src = "images/icons_small.png" //adds .src to the variable symbols
reels_bg.src = "images/reels_bg_5x3.png" //adds .src to the variable reels_bg

snd_win = new Audio("sounds/win.wav")
snd_reel_stop[0] = new Audio("sounds/reel_stop.wav")
snd_reel_stop[1] = new Audio("sounds/reel_stop.wav")
snd_reel_stop[2] = new Audio("sounds/reel_stop.wav")
snd_reel_stop[3] = new Audio("sounds/reel_stop.wav")
snd_reel_stop[4] = new Audio("sounds/reel_stop.wav")

// setting up CONSTANTS, or enumators
var STATE_REST = 0
var STATE_SPINUP = 1
var STATE_SPINDOWN = 2
var STATE_REWARD = 3

//slot machine configuration, might as well get them from API
var increase_reward = 1       //sets increase_reward height, default is 1
var reel_count = 5 //sets up number of reels
var reel_positions = 32 //sets the reel positions, total number of symbols in array
var symbol_size = 32 //sets the symbol size
var symbol_count = 11 //sets total amount of symbols, limited by the image loaded for variable symbols
var reel_pixel_length = reel_positions * symbol_size //sets the reel pixel length as the product of reel_position and symbol_size
var row_count = 3 //sets the number of rows
var stopping_distance = 528 //as named, sets the stoping distance
var max_reel_speed = 32 //reel speed when blurring
var spinup_acceleration = 2 //increment of 2 for the setInterval ticker
var spindown_acceleration = 1 //increment in decelerator speed of 1 for the setInterval ticker
var starting_credits = 100 //ideally this would be loaded from API in JSON for the player
var reward_delay = 3 //number of frames between each credit tick
var reward_delay_grand = 1 //this delays the grand-prize winning
var reward_grand_threshold = 25 //count faster if the reward is over this size

// setting up the payouts/rewards system
var match_payout = new Array(symbol_count) //this creates a new object named match_payout from a constructor function Array() that is the size of variable symbol_count
match_payout[7] = 4 // 3Dollars
match_payout[6] = 6 // 2Dollars
match_payout[5] = 8 // 1Dollar
match_payout[1] = 10 // 1Coin
match_payout[2] = 15 // 2Coins
match_payout[3] = 20 // 3Coins
match_payout[4] = 25 // Pineapple
match_payout[0] = 50 // Alien
match_payout[9] = 75 // Joker
match_payout[10] = 100 // Diamond
match_payout[8] = 250 // Cake

var payout_coin = 6 //pays out any 3 Coins
var payout_dollar = 2 //pays out any 3 Dollars

//this will be needing a bit of tweaking if the width and height properties are being changed in html or css respective file
var reel_area_left = 32
var reel_area_top = 32
var reel_area_width = 160
var reel_area_height = 96

//setting up the reels, might as well create a function that randomizes this
var reels = new Array(reel_count) //this creates a new object named reels from a constructor function Array()
reels[0] = new Array(6, 0, 10, 3, 6, 7, 9, 2, 5, 2, 3, 1, 5, 2, 1, 10, 4, 5, 8, 4, 7, 6, 0, 1, 7, 6, 3, 1, 5, 9, 7, 4) //set up a random array in future using from() and keys()
reels[1] = new Array(2, 1, 7, 1, 2, 7, 6, 7, 3, 10, 1, 6, 1, 7, 3, 4, 3, 2, 4, 5, 0, 6, 10, 5, 6, 5, 8, 3, 0, 9, 5, 4) //set up a random array in future using from() and keys()
reels[2] = new Array(1, 4, 2, 7, 5, 6, 4, 10, 7, 5, 2, 0, 6, 4, 10, 1, 7, 6, 3, 0, 5, 7, 2, 3, 9, 3, 5, 6, 1, 8, 1, 3) //set up a random array in future using from() and keys()
reels[3] = new Array(1, 4, 2, 7, 5, 6, 4, 10, 7, 5, 2, 0, 6, 4, 10, 1, 7, 6, 3, 0, 5, 7, 2, 3, 9, 3, 5, 6, 1, 8, 1, 3) //set up a random array in future using from() and keys()
reels[4] = new Array(1, 4, 2, 7, 5, 6, 4, 10, 7, 5, 2, 0, 6, 4, 10, 1, 7, 6, 3, 0, 5, 7, 2, 3, 9, 3, 5, 6, 1, 8, 1, 3) //set up a random array in future using from() and keys()

//get the reel_position (note that it's different form reel_positions in configuration section)
var reel_position = new Array(reel_count) //creates and object with key-value pair equal to reel_count
//and next for loop adds to the reel_position[]
for (var i = 0; i < reel_count; i++) {
    reel_position[i] = Math.floor(Math.random() * reel_positions) * symbol_size
}

var stopping_position = new Array(reel_count)
var start_slowing = new Array(reel_count)

//sets up the reel speed in pixels per frame
var reel_speed = new Array(reel_count)
for (var i = 0; i < reel_count; i++) {
    reel_speed[i] = 0
}

var result = new Array(reel_count)
for (var i = 0; i < reel_count; i++) {
    result[i] = new Array(row_count)
}

var game_state = STATE_REST
var credits = starting_credits
var payout = 0
var delay_reward_counter = 0
var playing_lines


// RENDER FUNCTIONS --------------

function draw_symbol(symbol_index, x, y) {
    var symbol_pixel = symbol_index * symbol_size
    ctx.drawImage(symbols, 0, symbol_pixel, symbol_size, symbol_size, x + reel_area_left, y + reel_area_top, symbol_size, symbol_size)
}

function render_reel() {
    //this clears the reel
    ctx.drawImage(reels_bg, reel_area_left, reel_area_top)

    //sets the clipping area
    ctx.beginPath()
    ctx.rect(reel_area_left, reel_area_top, reel_area_width, reel_area_height)
    ctx.clip()

    var reel_index
    var symbol_offset
    var symbol_index
    var x
    var y

    for (var i = 0; i < reel_count; i++) {
        for (var j = 0; j < row_count + 1; j++) {
            reel_index = Math.floor(reel_position[i] / symbol_size) + j

            symbol_offset = reel_position[i] % symbol_size

            //reel wrap
            if (reel_index >= reel_positions) reel_index -= reel_positions

            //symbol look up
            symbol_index = reels[i][reel_index]

            x = i * symbol_size
            y = j * symbol_size - symbol_offset

            draw_symbol(symbol_index, x, y)
        }
    }
}

function highlight_line(line_num) {

    ctx.strokeStyle = "orange";
    var ss = symbol_size;

    // middle row highlight
    if (line_num == 1){
        ctx.strokeRect(reel_area_left, reel_area_top + ss, ss - 1, ss - 1) //first rectangle in middle row
        ctx.strokeRect(reel_area_left + ss, reel_area_top + ss, ss - 1, ss - 1) //second rectangle in middle row
        ctx.strokeRect(reel_area_left + ss + ss, reel_area_top + ss, ss - 1, ss - 1) //third rectangle in middle row
        ctx.strokeRect(reel_area_left + ss + ss + ss, reel_area_top + ss, ss - 1, ss - 1) //fourth rectangle in middle row
        ctx.strokeRect(reel_area_left + ss + ss + ss + ss, reel_area_top + ss, ss - 1, ss - 1) //fifth rectangle in middle row
    }

    // top row highlight
    if (line_num == 2){
        ctx.strokeRect(reel_area_left, reel_area_top, ss - 1, ss - 1) //first rectangle in top row
        ctx.strokeRect(reel_area_left + ss, reel_area_top, ss - 1, ss - 1) //second rectangle in top row
        ctx.strokeRect(reel_area_left + ss + ss, reel_area_top, ss - 1, ss - 1) //third rectangle in top row
        ctx.strokeRect(reel_area_left + ss + ss + ss, reel_area_top, ss - 1, ss - 1) //fourth rectangle in top row
        ctx.strokeRect(reel_area_left + ss + ss + ss + ss, reel_area_top, ss - 1, ss - 1) //fifth rectangle in top row
    }

    // bottom row highlight
    if (line_num == 3){
        ctx.strokeRect(reel_area_left, reel_area_top + ss + ss, ss - 1, ss - 1) //first rectangle in bottom row
        ctx.strokeRect(reel_area_left + ss, reel_area_top + ss + ss, ss - 1, ss - 1) //second rectangle in bottom row
        ctx.strokeRect(reel_area_left + ss + ss, reel_area_top + ss + ss, ss - 1, ss - 1) //third rectangle in bottom row
        ctx.strokeRect(reel_area_left + ss + ss + ss, reel_area_top + ss + ss, ss - 1, ss - 1) //fourth rectangle in bottom row
        ctx.strokeRect(reel_area_left + ss + ss + ss + ss, reel_area_top + ss + ss, ss - 1, ss - 1) //fifth rectangle in bottom row
    }

}

//renders all art needed for the current frame
function render() {
    if (game_state == STATE_SPINUP || game_state == STATE_SPINDOWN) {
        render_reel() //this calls the function render_reel() that clears the reel,sets the clipping area, wraps the reel and looks for symbols
    }
}

// LOGIC FUNCTIONS --------------

function set_stops() {
    for (var i = 0; i < reel_count; i++) {
        start_slowing[i] = false
        stop_index = Math.floor(Math.random() * reel_positions)
        stopping_position[i] = stop_index * symbol_size
        stopping_position[i] += stopping_distance
        if (stopping_position[i] >= reel_pixel_length) stopping_position[i] -= reel_pixel_length

        //convenient here to remember the winning position
        for (var j = 0; j < row_count; j++) {
            result[i][j] = stop_index + j
            if (result[i][j] >= reel_positions) result[i][j] -= reel_positions

            //translate reel position into symbol
            result[i][j] = reels[i][result[i][j]]
        }
    }
}

function move_reel(i) {
    reel_position[i] -= reel_speed[i]

    //wrap
    if (reel_position[i] < 0) {
        reel_position[i] += reel_pixel_length
    }
}

// handles the reels ccelerating to full speed, and maximum power :)
function logic_spinup() {
    for (var i = 0; i < reel_count; i++) {
        //move the reel at current speed
        move_reel(i)

        //accelerate the reel speed
        reel_speed[i] += spinup_acceleration
    }

    //if reel is at max speed, begin the spindown
    if (reel_speed[0] == max_reel_speed) {

        //calculate the final results now, so that the spindwn is ready
        set_stops()

        game_state = STATE_SPINDOWN
    }
}

//handles the reel movement as the reels are coming to rest
function logic_spindown() {

    //if reels finished moving, begin rewards
    if (reel_speed[reel_count - 1] == 0) {

        calc_reward()
        game_state = STATE_REWARD
    }

    for (var i = 0; i < reel_count; i++) {

        // move reel to current speed
        move_reel(i)

        //start slowing the reel (this reel)
        if (start_slowing[i] == false) {

            //if the first or previous reel is already slowing
            var check_position = false
            if (i == 0) check_position = true
            else if (start_slowing[i - 1]) check_position = true

            if (check_position) {
                if (reel_position[i] == stopping_position[i]) {
                    start_slowing[i] = true
                }
            }
        }
        else {
            if (reel_speed[i] > 0) {
                reel_speed[i] -= spindown_acceleration

                if (reel_speed[i] == 0) {
                    try {
                        snd_reel_stop[i].currentTime = 0
                        snd_reel_stop[i].play()
                    } catch (err) { }
                }
            }
        }
    }
}

//this counts up reward credits, plays the sound effects...
function logic_reward() {
    if (payout == 0) {
        game_state = STATE_REST
        return
    }

    //dont tick up rewards each frame , too fast?
    if (delay_reward_counter > 0) {
        delay_reward_counter--
        return
    }

    payout--
    credits++
    cred_p.innerHTML = "Bank (" + credits + ")"

    if (payout < reward_grand_threshold) {
        delay_reward_counter = reward_delay
    }
    else { //speed up big rewards
        delay_reward_counter += reward_delay_grand
    }

}

//update all logic in the current frame
function logic() {

    //game_state REST to game_state SPINUP happens on an input event

    if (game_state == STATE_SPINUP) {
        logic_spinup()
    }
    else if (game_state == STATE_SPINDOWN) {
        logic_spindown()
    }
    else if (game_state == STATE_REWARD) {
        logic_reward()
    }
}

//given an input line of symbols, determine the payout
function calc_line(s1, s2, s3, s4, s5) {

    //perfect matching
    if (s1 == s2 && s2 == s3 && s3 == s4 && s4 == s5) {
        return match_payout[s1]
    }

    //special case #1 triple coin
    if ((s1 == 1 || s1 == 2 || s1 == 3) &&
        (s2 == 1 || s2 == 2 || s2 == 3) &&
        (s3 == 1 || s3 == 2 || s3 == 3) &&
        (s4 == 1 || s4 == 2 || s4 == 3) &&
        (s5 == 1 || s5 == 2 || s5 == 3)) {
        return payout_coin
    }

    //special case #2 triple dollar
    if ((s1 == 5 || s1 == 6 || s1 == 7) &&
        (s2 == 5 || s2 == 6 || s2 == 7) &&
        (s3 == 5 || s3 == 6 || s3 == 7) &&
        (s4 == 5 || s4 == 6 || s4 == 7) &&
        (s5 == 5 || s5 == 6 || s5 == 7)) {
        return payout_dollar
    }

    //special case #3 joker goes with everything
    if (s1 == 9) {
        if (s2 == s3 && s3 == s4 && s4 == s5) return match_payout[s2]

        //joker is a wildcard for triple coin
        if ((s2 == 1 || s2 == 2 || s2 == 3) &&
            (s3 == 1 || s3 == 2 || s3 == 3) &&
            (s4 == 1 || s4 == 2 || s4 == 3) &&
            (s5 == 1 || s5 == 2 || s5 == 3)) return payout_coin

        //joker is a wildcard for triple dollar
        if ((s2 == 5 || s2 == 6 || s2 == 7) &&
            (s3 == 5 || s3 == 6 || s3 == 7) &&
            (s4 == 5 || s4 == 6 || s4 == 7) &&
            (s5 == 5 || s5 == 6 || s5 == 7)) return payout_dollar


    }
    if (s2 == 9) {
        if (s1 == s3 && s3 == s4 && s4 == s5) return match_payout[s1];

        // wildcard trip coin
        if ((s1 == 1 || s1 == 2 || s1 == 3) &&
            (s3 == 1 || s3 == 2 || s3 == 3) &&
            (s4 == 1 || s4 == 2 || s4 == 3) &&
            (s5 == 1 || s5 == 2 || s5 == 3)) return payout_coin;

        // wildcard trip dollar
        if ((s1 == 5 || s1 == 6 || s1 == 7) &&
            (s3 == 5 || s3 == 6 || s3 == 7) &&
            (s4 == 5 || s4 == 6 || s4 == 7) &&
            (s5 == 5 || s5 == 6 || s5 == 7)) return payout_dollar;

    }
    if (s3 == 9) {
        if (s1 == s2 && s2 == s4 && s4 == s5) return match_payout[s1];

        // wildcard trip coin
        if ((s1 == 1 || s1 == 2 || s1 == 3) &&
            (s2 == 1 || s2 == 2 || s2 == 3) &&
            (s4 == 1 || s4 == 2 || s4 == 3) &&
            (s5 == 1 || s5 == 2 || s5 == 3)) return payout_coin;

        // wildcard trip dollar
        if ((s1 == 5 || s1 == 6 || s1 == 7) &&
            (s2 == 5 || s2 == 6 || s2 == 7) &&
            (s4 == 5 || s4 == 6 || s4 == 7) &&
            (s5 == 5 || s5 == 6 || s5 == 7)) return payout_dollar;
    }
    if (s4 == 9) {
        if (s1 == s2 && s2 == s3 && s3 == s5) return match_payout[s1];

        // wildcard trip coin
        if ((s1 == 1 || s1 == 2 || s1 == 3) &&
            (s2 == 1 || s2 == 2 || s2 == 3) &&
            (s3 == 1 || s3 == 2 || s3 == 3) &&
            (s5 == 1 || s5 == 2 || s5 == 3)) return payout_coin;

        // wildcard trip dollar
        if ((s1 == 5 || s1 == 6 || s1 == 7) &&
            (s2 == 5 || s2 == 6 || s2 == 7) &&
            (s3 == 5 || s3 == 6 || s3 == 7) &&
            (s5 == 5 || s5 == 6 || s5 == 7)) return payout_dollar;
    }
    if (s5 == 9) {
        if (s1 == s2 && s2 == s3 && s3 == s4) return match_payout[s1];

        // wildcard trip coin
        if ((s1 == 1 || s1 == 2 || s1 == 3) &&
            (s2 == 1 || s2 == 2 || s2 == 3) &&
            (s3 == 1 || s3 == 2 || s3 == 3) &&
            (s4 == 1 || s4 == 2 || s4 == 3)) return payout_coin;

        // wildcard trip dollar
        if ((s1 == 5 || s1 == 6 || s1 == 7) &&
            (s2 == 5 || s2 == 6 || s2 == 7) &&
            (s3 == 5 || s3 == 6 || s3 == 7) &&
            (s4 == 5 || s4 == 6 || s4 == 7)) return payout_dollar;
    }

    // no reward
    return 0
}

//function to calculate the reward
function calc_reward() {
    payout = 0
    var multiplier = increase_reward
    var partial_payout

    //seeks result on middle row Line 1
    partial_payout = calc_line(result[0][1], result[1][1], result[2][1], result[3][1], result[4][1])
    if (partial_payout > 0) {
        log_p.innerHTML += "Line 1 pays " + partial_payout * multiplier + "<br />\n"
        payout += partial_payout * multiplier
        highlight_line(1)
    }

    if (playing_lines > 1) {

        //seeks result on top row Line 2
        partial_payout = calc_line(result[0][0], result[1][0], result[2][0], result[3][0], result[4][0])
        if (partial_payout > 0) {
            log_p.innerHTML += "Line 2 pays " + partial_payout * multiplier + "<br />\n"
            payout += partial_payout * multiplier
            highlight_line(2)
        }
        //seeks result on bottom row Line 3
        partial_payout = calc_line(result[0][2], result[1][2], result[2][2], result[3][2], result[4][2])
        if (partial_payout > 0) {
            log_p.innerHTML += "Line 3 pays " + partial_payout * multiplier + "<br />\n"
            payout += partial_payout * multiplier
            highlight_line(3)
        }
    }

    if (payout > 0) {
        try {
            snd_win.currentTime = 0
            snd_win.play()
        }
        catch (err) { }
    }

}


//INPUT FUNCTIONS --------------------------
function handleKey(evt) {
    if (evt.keyCode == 32) { //keyCode 32 is for spacebar
        if (game_state != STATE_REST) return

        if (credits >= 3) spin(3)
        else spin(1)
        // else if (credits >= 1) spin(1)

    }
}


function spin(line_choice) {
    if (game_state != STATE_REST) return
    if (credits < line_choice) return

    credits -= line_choice
    playing_lines = line_choice

    cred_p.innerHTML = "Bank (" + credits + ")"
    log_p.innerHTML = ""

    game_state = STATE_SPINUP
}


//INITIATION FUNCTIONS Init ----------------------
function init() {
    can = document.getElementById("slots")
    ctx = can.getContext("2d")
    log_p = document.getElementById("log")
    cred_p = document.getElementById("credits")

    cred_p.innerHTML = "Bank (" + credits + ")"

    window.addEventListener('keydown', handleKey, true)

    symbols.onload = function () {
        symbols_loaded = true
        if (symbols_loaded && reels_bg_loaded) render_reel()
    }

    reels_bg.onload = function () {
        reels_bg_loaded = true
        if (symbols_loaded && reels_bg_loaded) render_reel()
    }
}