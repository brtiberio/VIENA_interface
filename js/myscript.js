// Things to do as soon as the page loads
var user = 'Viena-' + makeid();


var hostname;
var port;
var path;
var baseTopic = "VIENA/mqttController/";
var connected = false;
var cleanSession = true;
var retained = false;
var client;
var eposTopic = "VIENA/steering/";




// connect the client
function connectionToggle() {
	if (connected) {
		client.disconnect();
		document.getElementById("led_serv_con").className = "led led-red";
		document.getElementById("led_con_controller").className = "led led-red";
		document.getElementById("led_bat").className = "led led-red";
		document.getElementById("led_can").className = "led led-red";
		document.getElementById("server-settings").disabled = false;
		connected = false;
		document.getElementById("clientConnectButton").innerText = "Connect";
	} else {
		hostname = document.getElementById("hostInput").value;
		port = document.getElementById("portInput").value;
		path = document.getElementById("pathInput").value;
		cleanSession = document.getElementById("cleanSessionInput").checked;
		retained = document.getElementById("cleanSessionInput").checked;

		client = new Paho.MQTT.Client(hostname, Number(port), path, user);
		// set callback handlers
		client.onConnectionLost = onConnectionLost;
		client.onMessageArrived = onMessageArrived;

		client.connect({
			onSuccess: onConnect,
			mqttVersion: 4,
			cleanSession: cleanSession,
			onFailure: onFailure
		});
	}
}


function onFailure(err) {
	alert(err.errorCode + " " + err.errorMessage);
}
// called when the client connects
function onConnect() {
	// Once a connection has been made, make a subscription and send a message.
	document.getElementById("led_serv_con").className = "led led-green";
	console.log("onConnect");
	connected = true;
	document.getElementById("clientConnectButton").innerText = "Disconnect";
	document.getElementById("server-settings").disabled = true;
	client.subscribe(baseTopic + "connectStatus", {
		qos: 2
	});
	client.subscribe(baseTopic + "logger", {
		qos: 2
	});
	client.subscribe(baseTopic + "canopenStatus", {
		qos: 2
	});
	client.subscribe(eposTopic + "pid", {
		qos: 2
	});
	client.subscribe(eposTopic + "stateID", {
		qos: 2
	});
	client.subscribe(eposTopic + "rpc/response", {qos: 2});
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
	if (responseObject.errorCode !== 0) {
		document.getElementById("led_serv_con").className = "led led-red";
		document.getElementById("led_con_controller").className = "led led-red";
		document.getElementById("led_bat").className = "led led-red";
		document.getElementById("led_can").className = "led led-red";
		document.getElementById("clientConnectButton").innerText = "Connect"
		document.getElementById("server-settings").disabled = false;
		console.log("onConnectionLost:" + responseObject.errorMessage);
		connected = false;
	}
}

// called when a message arrives
function onMessageArrived(message) {

	switch (message.destinationName) {
	    case (baseTopic + "connectStatus"):
	        // receive mqtt controller connection status
            if (message.payloadString === "Connected") {
			    document.getElementById("led_con_controller").className = "led led-green";
		    }
		    if (message.payloadString === "Disconnected") {
			    document.getElementById("led_con_controller").className = "led led-red";
		    }
            break;
        case (baseTopic + "canopenStatus"):
            // receive canopen connection status
            if (message.payloadString === "Connected") {
			    document.getElementById("led_can").className = "led led-green";
		    }
		    if (message.payloadString === "Disconnected") {
			    document.getElementById("led_can").className = "led led-red";
	    	}
            break;
        case ((baseTopic + "logger")):
            // receive log message
            let messageTime = new Date().toLocaleString();
		    // Insert into History Table
		    let table = document.getElementById("incomingMessageTable").getElementsByTagName('tbody')[0];
		    let row = table.insertRow(0);
		    row.insertCell(0).innerHTML = message.destinationName;
		    row.insertCell(1).innerHTML = safe_tags_regex(message.payloadString);
		    row.insertCell(2).innerHTML = messageTime;
		    row.insertCell(3).innerHTML = message.qos;
		    if (table.rows.length > 15) {
			    table.deleteRow(15);
		    }
		    break;
        case(eposTopic + "pid"):
            // receive PID settings
            if(message.payloadString === ""){
	            document.getElementById("PIDpGain").value = "pGain";
	            document.getElementById("PIDiGain").value = "iGain";
	            document.getElementById("PIDdGain").value = "dGain";
	        }else{
	            var jsonMessage = JSON.parse(message.payloadString);
	            document.getElementById("PIDpGain").value = jsonMessage.pGain;
	            document.getElementById("PIDiGain").value = jsonMessage.iGain;
	            document.getElementById("PIDdGain").value = jsonMessage.dGain;
            }
            break;
        case(eposTopic + "stateID"):
            document.getElementById("stateID").value = message.payloadString;
            // remove spinning effect on button if present
            document.getElementById("refreshStateIcon").className ="fa fa-sync";
            break;
        case(eposTopic + "rpc/response"):
            if(message.payloadString !== ""){
                var jsonMessage = JSON.parse(message.payloadString)
                console.log(message.payloadString);
            }
        default:
            console.log('Message Recieved: Topic: ', message.destinationName, '. Payload: ', message.payloadString, '. QoS: ', message.qos);
    }
    // receive mqtt controller connection status
	if (message.destinationName === (baseTopic + "connectStatus")) {
		if (message.payloadString === "Connected") {
			document.getElementById("led_con_controller").className = "led led-green";
		}
		if (message.payloadString === "Disconnected") {
			document.getElementById("led_con_controller").className = "led led-red";
		}
	}
	// receive canopen connection status
	if (message.destinationName === (baseTopic + "canopenStatus")) {
		if (message.payloadString === "Connected") {
			document.getElementById("led_can").className = "led led-green";
		}
		if (message.payloadString === "Disconnected") {
			document.getElementById("led_can").className = "led led-red";
		}
	}
}


// Just in case someone sends html
function safe_tags_regex(str) {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function clearHistory() {
	let table = document.getElementById("incomingMessageTable");
	for (var i = table.rows.length - 1; i > 0; i--) {
		table.deleteRow(i);
	}

}

function makeid() {
	let text = "";
	let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < 5; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

async function requestState(){
	let x = document.getElementById("refreshStateIcon");
	x.className += " fa-spin";
	let jsonMessage = {request: "stateID"};
	jsonMessage = JSON.stringify(jsonMessage);
	client.send(eposTopic + "rpc/request", payload=jsonMessage, qos=2, retained=false);
	await sleep(2000);
	if(x.className!=="fa fa-sync"){
		console.log("Request state timeout");
		x.className="fa fa-sync"
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}