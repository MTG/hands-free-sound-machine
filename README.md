# Hands-free Sound Machine

## Description

Hands-Free Sound Machine is a voice and gesture controlled drum machine built using HTML5, WebAudio API, WebSpeech API and the Freesound API. The drum machine can be controlled using your voice, telling it to start, stop, set the tempo and search sounds for each pad. Sounds are retrieved from Freesound. IRCAM’s riot sensor is used to activate and deactivate steps from the sequencer and to set the tempo.
Hands-Free Sound Machine has been developed at the Music Technology Group, Universitat Pompeu Fabra, by Jordi Janer and Frederic Font.

It has been developed as a prototype for the MusicBricks H2020 - ICT Innovation Action European project (Grant nr. 644871).

## Video demo

https://www.youtube.com/watch?v=MOTwiOaCY3o


## Installation instructions

### Web app
  1. Download code, open terminal and cd into folder
  2. Install python requirements (pip install -r requirements.txt, vortualenv recommended)
  3. Get a [Freesound API api key](http://www.freesound.org/apiv2/apply/) and paste it into line 214, static/js/all.js.
  3. Run web werver with 'python app.py'
  4. Open browser and point at localhost:5000
  5. Enjoy!

If no messages are being received from the RiOT sensor, make sure ports and IP addresses are configured correctly in app.py. 

The speech control only works with Chrome.


## Relevant links:

Relevant links:
- Source code repository: https://github.com/MTG/hands-free-sou...
- WebAudio API: https://developer.mozilla.org/en-US/d...
- Google’s WebSpeech API: https://developers.google.com/web/upd...
- Freesound API: http://www.freesound.org/docs/api/
- MusicBricks: http://musictechfest.net/musicbricks/
- IRCAM’s Riot sensor: http://ismm.ircam.fr/riot/
