// Things to do as soon as the page loads
var user = 'Viena-' + makeid();


var hostname = "test.mosquitto.org";
var port = "8080";
var baseTopic = "VIENA/mqttController/";


var client = new Paho.MQTT.Client(hostname, Number(port), "/mqtt", user);



// set callback handlers
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// connect the client
client.connect({
	onSuccess: onConnect,
	mqttVersion: 4
});


// called when the client connects
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	document.getElementById ("led_serv_con").className = "led led-green";
	console.log("onConnect");
	client.subscribe(baseTopic + "connectStatus", {
		qos: 2
	});
	client.subscribe(baseTopic + "logger", {
		qos: 2
	});
    client.subscribe(baseTopic + "canopenStatus", {
        qos:2
    });
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		document.getElementById ("led_serv_con").className = "led led-red";
		console.log("onConnectionLost:" + responseObject.errorMessage);
	}
}

// called when a message arrives
function onMessageArrived(message) {
	console.log('Message Recieved: Topic: ', message.destinationName, '. Payload: ', message.payloadString, '. QoS: ', message.qos);


	if (message.destinationName === (baseTopic + "connectStatus")) {
		if (message.payloadString === "Connected") {
			document.getElementById("led_con_controller").className = "led led-green";
		}
		if (message.payloadString === "Disconnected") {
			document.getElementById("led_con_controller").className = "led led-red";
		}
	}
	if (message.destinationName === (baseTopic + "canopenStatus")) {
		if (message.payloadString === "Connected") {
			document.getElementById("led_can").className = "led led-green";
		}
		if (message.payloadString === "Disconnected") {
			document.getElementById("led_can").className = "led led-red";
		}
	}
	if (message.destinationName === (baseTopic + "logger")) {
		var messageTime = new Date().toISOString();
		// Insert into History Table
		var table = document.getElementById("incomingMessageTable").getElementsByTagName('tbody')[0];
		var row = table.insertRow(0);
		row.insertCell(0).innerHTML = message.destinationName;
		row.insertCell(1).innerHTML = safe_tags_regex(message.payloadString);
		row.insertCell(2).innerHTML = messageTime;
		row.insertCell(3).innerHTML = message.qos;
	}
}


// Just in case someone sends html
function safe_tags_regex(str) {
   return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clearHistory(){
    var table = document.getElementById("incomingMessageTable");
    //or use :  var table = document.all.tableid;
    for(var i = table.rows.length - 1; i > 0; i--)
    {
        table.deleteRow(i);
    }

}

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
