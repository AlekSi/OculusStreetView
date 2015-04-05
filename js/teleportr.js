$(function(){
  window.startSpeechRecognizr('d7657fb2-a955-48a7-9a29-a9a2a34da8ea');
})

window.generateUUID = function() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}

window.startSpeechRecognizr = function(key){
  var matcher = /Хочу( в| во| на| к)? (.+)/i;
  var uuid = window.generateUUID();
  var dict = new webspeechkit.Dictation("wss://webasr.yandex.net/asrsocket.ws?topic=maps", uuid, key);
  var tts = new webspeechkit.Tts({key: key});
  var processing = false;
  console.log(key);
  console.log(uuid);
  dict.start({
    format: webspeechkit.FORMAT.PCM44,
    bufferSize: 2048,
    errorCallback: function(msg) {
      console.log(msg);
    },
    dataCallback: function(text, uttr, merge) {
      if (text.length == 0) {
        return;
      }

      console.log(text, uttr, merge);

      if(!processing && uttr && matcher.test(text)) {
        var place = text.match(matcher);
        if(place.length < 3) {
          return false;
        }
        dict.pause();

        preposition = place[1];
        if (preposition === undefined) {
          preposition = "";
        }
        preposition = preposition.trim()
        place = place[2].trim();
        processing = true;

        $.getJSON("http://geocode-maps.yandex.ru/1.x/?format=json&geocode=" + place, function(data) {
          if (parseInt(data.response.GeoObjectCollection.metaDataProperty.GeocoderResponseMetaData.found) == 0) {
            tts.say("Не смогли найти " + place, function() {
                processing = false;
                dict.onstart();
              }, {emotion: 'mixed', speaker: 'jane'});
            return;
          }

          lonlat = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(" ");
          travelTo(lonlat[0], lonlat[1]);
          tts.say("Телепортирую "+ preposition + " " + place, function() {
              processing = false;
              dict.onstart();
            }, {emotion: 'good', speaker: 'jane'});
        });

        return;
      }
    },
    punctuation: false,
    vad: true,
    speechStart: function() {
      console.log("speechStart");
    },
    speechEnd: function() {
      console.log("speechEnd");
    }
  });
}

window.travelTo = function(lon, lat) {
  panoLoader.load(new google.maps.LatLng(lat, lon));
  console.log("Lon: "+ lon + " Lat: " + lat);
}
