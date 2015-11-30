var final_transcript = '';
var recognizing = false;
var restart_on_end = true;
var process_on_end = true;
var restart_on_error = true;

if (!('webkitSpeechRecognition' in window)) {
    console.log("Speech recognition not supported...")
} else {
    console.log("Setting up speech recognition...")
    var recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = function() {
        recognizing = true;
    };
    recognition.onerror = function(event) {
        console.log("Speech, ERROR: " + event.error);
        if (event.error == 'no-speech') {
            ////alert('info_no_speech');
        }
        if (event.error == 'audio-capture') {
            ////alert('info_no_microphone');
            restart_on_error = false;
        }
        if (event.error == 'not-allowed') {
            restart_on_error = false;
        }
        if (restart_on_error){
            startSpeechToText();
        }
    };
    recognition.onend = function() {
        console.log("Speech, END");
        recognizing = false;
        if (restart_on_end){
            startSpeechToText();
        }
        if (process_on_end){
            processTranscript(final_transcript);
        }
    };
    recognition.onresult = function(event) {
        console.log("Speech, RESULT");
        var interim_transcript = '';
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        recognizing = false;
        recognition.stop();
        processTranscript(final_transcript);
        startSpeechToText();
    };
}

function startSpeechToText(){
    if (!recognizing) {
        recognition.lang = "en-US";
        recognition.start();
    }
}

function contains_string_or_strings(string, options){
    var output = false;
    for (var i in options){
        var option = options[i];
        if (string.indexOf(option) > -1){
            output = true;
            break;
        }
    }
    return output;
}

function get_number_in_transcript(transcript){
    if (transcript.indexOf("1") > -1){
        return 1;
    }
    if (transcript.indexOf("one") > -1){
        return 1;
    }
    if (transcript.indexOf("2") > -1){
        return 2;
    }
    if (transcript.indexOf("two") > -1){
        return 2;
    }
    if (transcript.indexOf("3") > -1){
        return 3;
    }
    if (transcript.indexOf("three") > -1){
        return 3;
    }
    if (transcript.indexOf("4") > -1){
        return 4;
    }
    if (transcript.indexOf("four") > -1){
        return 4;
    }
    return -1;
}


VOICE_CHANGING_SOUND = false;
function processTranscript(transcript){
    transcript = transcript.toLowerCase();
    console.log("Processing transcript: " + transcript);

    if (!VOICE_CHANGING_SOUND){
        if (contains_string_or_strings(transcript, ["play"])){
            start_sequencer();
        }
        else if (contains_string_or_strings(transcript, ["stop"])){
            stop_sequencer();
        }
        else if (contains_string_or_strings(transcript, ["record"])){
            var number = get_number_in_transcript(transcript);
            if (number > -1) {
                toggle_recording(number - 1);
            }
        }
        else if (contains_string_or_strings(transcript, ["search"])){
            var number = get_number_in_transcript(transcript);
            if (number > -1) {
                change_sound(number - 1);
                VOICE_CHANGING_SOUND = true;
            }
        }
        else if (contains_string_or_strings(transcript, ["clear"])){
            var number = get_number_in_transcript(transcript);
            if (number > -1) {
                clear_track(number - 1);
            }
        }
        else if (contains_string_or_strings(transcript, ["tempo"])){
            start_changing_tempo();
        }
    } else {
        $("#query_terms").val(transcript);
        load_from_freesound_text_search();
        VOICE_CHANGING_SOUND = false;
    }
    final_transcript = '';
}

startSpeechToText();