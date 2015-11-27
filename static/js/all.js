/* SETTINGS */

var MODE = 'mode1';
var TRIGGERS_SOUND_INFORMATION = [];
var MASCHINE_INFORMATION = [];
var LICENSE_NAMES = {
    'http://creativecommons.org/publicdomain/zero/1.0/': 'CC0',
    'http://creativecommons.org/licenses/by/3.0/': 'CC-BY',
    'http://creativecommons.org/licenses/by-nc/3.0/': 'CC-BY-NC',
    'http://creativecommons.org/licenses/sampling+/1.0/': 'Sampling+'
};
var NUM_TRIGGERS = 4;
var KEY_MAPPING = [
    '3', '4', '5', '6',
    'W', 'E', 'R', 'T',
    'S', 'D', 'F', 'G',
    'Z', 'X', 'C', 'V'
];
var LAST_STEP_TIME = 0;
var SEQUENCE = [];
var SEQUENCE_LENGTH = 16;
var CURRENT_SEQUENCE_POSITION = -1;
var SEQUENCER_RUNNING = false;
var SEQUENCER_TIMER = false;
var TEMPO = 120;
var SCHEDULE_INTERVAL = 100 // in ms
var LOOKAHEAD_WINDOW = 0.200 // in sec
var RECORDING_TRIGGER_ID = -1;
var CHANGING_TRIGGER_ID = -1;

/* END SETTINGS */


/* AUDIO SEQUENCER */
var Sampler = function() {};

Sampler.prototype.playSoundByName = function(name, time) {
  if (time == undefined){
    time = 0;
  }
  playSound(this[name], time);
}

Sampler.prototype.changeVolume = function(element) {
  var volume = element.value;
  var fraction = parseInt(element.value) / parseInt(element.max);
  context.gainNode.gain.value = fraction * fraction;
};

var current16thNote = 0;
var timeoutId;
var startTime;
var noteTime = 0.0;
var lastDrawTime = -1;
var sampler = new Sampler();

function play_sound(trigger_id, contextPlayTime){
    if (contextPlayTime == undefined){
        contextPlayTime = 0;
    }
    sampler.playSoundByName(trigger_id, contextPlayTime);
}

function nextNote() {
  // Advance current note and time by a 16th note...
  var secondsPerBeat = 60.0 / TEMPO;  // picks up the CURRENT tempo value!
  noteTime += 0.5 * secondsPerBeat;  // Add 1/4 of quarter-note beat length to time
  current16thNote++;  // Advance the beat number, wrap to zero
  if (current16thNote == SEQUENCE_LENGTH) {
    current16thNote = 0;
  }
}

function schedule() {
    var currentTime = context.currentTime;
    currentTime -= startTime;
    while (noteTime < currentTime + LOOKAHEAD_WINDOW) {
        var contextPlayTime = noteTime + startTime;
        for (slot in SEQUENCE){
          if (SEQUENCE[slot][current16thNote] == 'x'){
            play_sound(slot, contextPlayTime);
          }
        }
        if (noteTime != lastDrawTime) {
            lastDrawTime = noteTime;
            drawPlayhead((current16thNote + (SEQUENCE_LENGTH - 1)) % SEQUENCE_LENGTH);
        }
        nextNote();
        
    }
    if (SEQUENCER_RUNNING){
        timeoutId = setTimeout(schedule, SCHEDULE_INTERVAL);
    }
}

function drawPlayhead(xindex) {
    CURRENT_SEQUENCE_POSITION = current16thNote;
    // draw cursor position
    for (var i=0; i<SEQUENCE_LENGTH; i++){
        $("#seq_cell_" + i.toString() + '_' + CURRENT_SEQUENCE_POSITION.toString()).addClass('current_cell');
        var previous_sequence_step = CURRENT_SEQUENCE_POSITION - 1;
        if (previous_sequence_step < 0){
            previous_sequence_step = SEQUENCE_LENGTH - 1;
        }
        $("#seq_cell_" + i.toString() + '_' + previous_sequence_step.toString()).removeClass('current_cell');
    }
}

// SQUENCER

function start_sequencer(){
    SEQUENCER_RUNNING = true;
    noteTime = 0.0;
    startTime = context.currentTime + 0.005;
    schedule();
    $("#start_stop_sequencer").html('<span class="glyphicon glyphicon-stop">');
    $("#stepin_sequencer").prop('disabled', true);
}


function stepIn(){
    // Only advance the sequencer by one position
    if (!SEQUENCER_RUNNING){
        noteTime = 0.0;
        startTime = context.currentTime + 0.005;
        lastDrawTime = -1;
        schedule();
    }
}

function stop_sequencer(){
    window.clearTimeout(timeoutId);
    SEQUENCER_RUNNING = false;
    $("#start_stop_sequencer").html('<span class="glyphicon glyphicon-play">');
    $("#stepin_sequencer").prop('disabled', false);
}

function start_stop_sequencer(){
    if (SEQUENCER_RUNNING){
        stop_sequencer();
    } else {
        start_sequencer();
    }
}

function toggle_recording(n_trigger){
    for (var i=0; i<NUM_TRIGGERS; i++){
        if (i != n_trigger){
            $("#toggle_recording_" + i).removeClass("active");
        } else {
            if ($("#toggle_recording_" + i).hasClass("active")){
                $("#toggle_recording_" + i).removeClass("active");
                RECORDING_TRIGGER_ID = -1;
            } else {
                $("#toggle_recording_" + i).addClass("active");
                RECORDING_TRIGGER_ID = n_trigger;
            }
        }
    }
}

function change_sound(n_trigger){
    for (var i=0; i<NUM_TRIGGERS; i++){
        if (i != n_trigger){
            $("#change_sound_" + i).removeClass("active");
        } else {
            if ($("#change_sound_" + i).hasClass("active")){
                $("#change_sound_" + i).removeClass("active");
                CHANGING_TRIGGER_ID = -1;
            } else {
                $("#change_sound_" + i).addClass("active");
                CHANGING_TRIGGER_ID = n_trigger;
            }
        }
    }
    if (CHANGING_TRIGGER_ID != -1){
        $("#query_controls").show();
    } else {
        $("#query_controls").hide();
    }   
}


/* END AUDIO SEQUENCER */

/* INTERFACE */

function on_kick_receive(){
    console.log("KICK!");
    // If on recording, play corresponding sound and add it to the sequencer
    if (RECORDING_TRIGGER_ID != -1) {
        if (CURRENT_SEQUENCE_POSITION != -1){
            if (SEQUENCE[RECORDING_TRIGGER_ID][CURRENT_SEQUENCE_POSITION] != 'x'){
                play_sound(RECORDING_TRIGGER_ID);
            }
            toggle_sequence_element(RECORDING_TRIGGER_ID, CURRENT_SEQUENCE_POSITION);    
        }
    }
}


function set_progress_bar_value(value){
    $("#progress_bar").width(value + "%");
}

function init_stuff(){
    freesound.setToken("d31c795be3f70f7f04b21aeca4c5b48a599db6e9");
    set_progress_bar_value(0);
    $('#bpm_input').val(TEMPO);
    load_from_freesound_text_search("percussion", all_triggers=true);
    randomize_sequence(0.15);
    render_sequencer();
    sequencer_wrapper = $("#sequencer_wrapper").show();
    //drawPlayhead();
    
    // Set key events
    $(document).keydown(function(e) {
        if (e.target.localName == "input"){
        } else {
            var c = String.fromCharCode(e.which);
            var index = KEY_MAPPING.indexOf(c);
            if (index != -1){
                play_sound(index);
            } else {
                if (c == " "){
                    if (SEQUENCER_RUNNING){
                        stop_sequencer();
                    } else {
                        start_sequencer();
                    }
                }
                if (c == "K"){
                    on_kick_receive();
                }
            }
        }
    });

    // set bpm button
    $('#bpm_input').bind('keypress', function(e) {
        if(e.keyCode==13){
            var input_tempo = parseInt($('#bpm_input').val(), 10);
            if (!isNaN(input_tempo)){
                TEMPO = input_tempo;
                $('#bpm_input').blur ();
            } else {
                $('#bpm_input').val(TEMPO);
                $('#bpm_input').blur ();
            }
        }
    });
}

function set_trigger_info_and_sound(sound, trigger_id){
    TRIGGERS_SOUND_INFORMATION.push({'id':sound.id,
                                     'name':sound.name,
                                     'license':sound.license,
                                     'username':sound.username,
                                     'description':sound.description,
                                     'created':sound.created
    });
    load_sound(trigger_id, sound.previews['preview-hq-mp3']); 
}

function load_from_freesound_text_search(query, all_triggers){
    if (query == undefined){
        query = $("#query_terms").val();
    }
    TRIGGERS_SOUND_INFORMATION = [];
    set_progress_bar_value(10);
    var filter = "duration:[0%20TO%200.5]";
    var fields = "id,name,previews,license,username,description,created";
    var page_size = 100;
    freesound.textSearch(query, {page:1, filter:filter, fields:fields, page_size:page_size, group_by_pack:1},
        function(sounds){
            sounds.results = shuffle(sounds.results); // randomize
            for (var i in sounds.results){
                if (i < NUM_TRIGGERS){
                    var sound = sounds.results[i];
                    if (all_triggers){
                        set_trigger_info_and_sound(sound, i);
                    } else {
                        if (i == CHANGING_TRIGGER_ID){
                            set_trigger_info_and_sound(sound, i);
                            $("#query_controls").hide();
                            $("#change_sound_"  + CHANGING_TRIGGER_ID).removeClass("active");
                            CHANGING_TRIGGER_ID = -1;
                        }
                    }
                }
            }
            set_progress_bar_value(100);
        },function(){ console.log("Error while searching...")}
    );
}

function load_sound(index, url){
    var name = index.toString();
    var soundMap = {}
    soundMap[name] = url
    loadSounds(sampler,soundMap, function(){});
}


// UTILS

function shuffle(array) {
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function create_random_pattern(probability){
    var pattern = [];
    for (var i=0; i<NUM_TRIGGERS; i++){
        var line = [];
        for (var j=0; j<SEQUENCE_LENGTH; j++) {
            if (Math.random() < probability){
                line.push('x');
            } else {
                line.push('_');
            }
        }
        pattern.push(line);
    }
    return pattern;
}

function render_sequencer(){

    var cell_classes = [
        'btn btn-disabled btn-primary seq_cell',
        'btn btn-lg btn-success seq_cell',
        'btn btn-lg btn-warning seq_cell',
        'btn btn-lg btn-danger seq_cell'
    ];
    var html = '';
    for (var i=0; i<NUM_TRIGGERS; i++){
        var cell_class_idx = Math.floor(i % 4);
        var html_line = '';
        html_line += '<div class="seq_row">';
        html_line += '<div class="seq_controls"><div class="btn-group btn-group-lg">';
        html_line += '<button id="toggle_recording_' + i.toString(10) + '" type="button" class="btn btn-lg btn-default seq_cell" onclick="toggle_recording(' + i + ')"><span class="glyphicon glyphicon-record"></button>';
        html_line += '<button id="change_sound_' + i.toString(10) + '" type="button" class="btn btn-lg btn-default seq_cell" onclick="change_sound(' + i + ')"><span class="glyphicon glyphicon-refresh"></button>';
        html_line += '</div></div>';
        
        for (var j=0; j<SEQUENCE_LENGTH; j++) {
            var wrapper_class = 'cell_wrapper';
            html_line += '<div id="cell_wrapper_' + i.toString() + '_' + j.toString() + '" class="' + wrapper_class + '"><a id="seq_cell_' + i.toString() + '_' + j.toString() + '" href=javascript:void(0); class="' + cell_classes[cell_class_idx];
            if (SEQUENCE[i][j] != 'x'){
                html_line += ' my_disabled">&nbsp;</a></div>';
            } else {
                html_line += '">&nbsp;</a></div>';
            }
        }
        html_line += '</div>';
        html += html_line;
    }
    $("#sequencer").html(html);

    for (var i=0; i<NUM_TRIGGERS; i++){
        // Update controls
        if (i == RECORDING_TRIGGER_ID){
            $("#toggle_recording_" + i).addClass("active");    
        }
    
        // Draw cells
        for (var j=0; j<SEQUENCE_LENGTH; j++) {
            var cell = $("#seq_cell_" + i.toString() + "_" + j.toString());
            cell.click(function(event){
                var event_id_parts = event.target.id.split('_');
                var row = parseInt(event_id_parts[event_id_parts.length - 2], 10);
                var col = parseInt(event_id_parts[event_id_parts.length - 1], 10);
                toggle_sequence_element(row,col);
            });
        }
    }
}

function toggle_sequence_element(row, col){
    var cell = $("#seq_cell_" + row.toString() + "_" + col.toString());
    if (SEQUENCE[row][col] != 'x'){
        SEQUENCE[row][col] = 'x';
        cell.removeClass('my_disabled');
    } else {
        SEQUENCE[row][col] = '_';
        cell.addClass('my_disabled');
    }
}

function randomize_sequence(prob){
    SEQUENCE = create_random_pattern(prob);
    render_sequencer();
}
