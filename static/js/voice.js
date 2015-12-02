var final_transcript = '';
var recognizing = false;
var restart_on_end = true;
var process_on_end = true;
var process_on_result = false;
var restart_on_error = true;
var SPEECH_CONTROL_SUPPORTED = true;
var NOT_ALLOWED_ERROR = false;
var recognition = undefined;

$(document).ready(function() {
    if (!('webkitSpeechRecognition' in window)) {
        console.log("Speech recognition not supported...");
        SPEECH_CONTROL_SUPPORTED = false;
        $("#voice_control_instructions").html("Voice control not supported... (only runs on Chrome)");
    } else {
        console.log("Setting up speech recognition...");
        recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.onstart = function() {
            recognizing = true;
        };
        recognition.onerror = function(event) {
            $("#voice_control_recording_indicator").html("<h4>ups, an error occurred... relaod?</h4>");
            console.log("Speech, ERROR: " + event.error);
            if (event.error == 'no-speech') {
                ////alert('info_no_speech');
            }
            if (event.error == 'audio-capture') {
                ////alert('info_no_microphone');
                restart_on_error = false;
            }
            if (event.error == 'not-allowed') {
                NOT_ALLOWED_ERROR = true;
                restart_on_error = false;
            }
            if (restart_on_error == true){
                startSpeechToText();
            }
        };
        recognition.onend = function() {
            console.log("Speech, END");
            recognizing = false;
            if ((process_on_end) && (!NOT_ALLOWED_ERROR)){
                processTranscript(final_transcript);
            }
            if ((restart_on_end) && (!NOT_ALLOWED_ERROR)){
                startSpeechToText();
            }
        };
        recognition.onresult = function(event) {
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            if (process_on_result){
                console.log("Speech, RESULT");
                $("#voice_control_recording_indicator").html("<h4>hmmmm...</h4>");
                recognizing = false;
                recognition.stop();
                processTranscript(final_transcript);
                startSpeechToText();
            }
        };
    }

    if (SPEECH_CONTROL_SUPPORTED) {
        startSpeechToText();
    }

});

function startSpeechToText(){
    if (!recognizing) {
        recognition.lang = "en-US";
        recognition.start();
        setTimeout(function(){
            $("#voice_control_recording_indicator").html("<h4>go ahead, I'm listening...</h4>");
        }, 1000);
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
    if (transcript.indexOf("to") > -1){
        return 2;
    }
    if (transcript.indexOf("3") > -1){
        return 3;
    }
    if (transcript.indexOf("three") > -1){
        return 3;
    }
    if (transcript.indexOf("free") > -1){
        return 3;
    }
    if (transcript.indexOf("4") > -1){
        return 4;
    }
    if (transcript.indexOf("four") > -1){
        return 4;
    }
    if (transcript.indexOf("for") > -1){
        return 4;
    }
    return -1;
}


VOICE_CHANGING_SOUND = false;
function processTranscript(transcript){
    if (transcript != ""){
        transcript = transcript.toLowerCase();
        console.log("Processing transcript: " + transcript);
        if (transcript != ""){
            $("#voice_control_output").html(transcript);
        }
        setTimeout(function(){
            $("#voice_control_output").html("");
        }, 5000);

        var understood_command = false;
        if (!VOICE_CHANGING_SOUND){
            if (contains_string_or_strings(transcript, ["play", "start", "star"])){
                start_sequencer();
                understood_command = true;
            }
            else if (contains_string_or_strings(transcript, ["stop", "stuff"])){
                stop_sequencer();
                understood_command = true;
            }
            else if (contains_string_or_strings(transcript, ["record", "regard"])){
                var number = get_number_in_transcript(transcript);
                if (number > -1) {
                    toggle_recording(number - 1);
                    understood_command = true;
                }
            }
            else if (contains_string_or_strings(transcript, ["search"])){
                var number = get_number_in_transcript(transcript);
                if (number > -1) {
                    change_sound(number - 1);
                    VOICE_CHANGING_SOUND = true;
                    understood_command = true;
                }
            }
            else if (contains_string_or_strings(transcript, ["clear"])){
                var number = get_number_in_transcript(transcript);
                if (number > -1) {
                    clear_track(number - 1);
                    understood_command = true;
                }
            }
            else if (contains_string_or_strings(transcript, ["tempo", "temple", "september"])){
                start_changing_tempo();
                understood_command = true;
            }
        } else {
            $("#query_terms").val(transcript);
            load_from_freesound_text_search();
            VOICE_CHANGING_SOUND = false;
            understood_command = true;
        }
        final_transcript = '';

        if (understood_command){
            $("#voice_control_recording_indicator").html("<h4>ok!</h4>");
        } else {
            $("#voice_control_recording_indicator").html("<h4>hmmm... I think I missed something...</h4>");
        }
    }
}