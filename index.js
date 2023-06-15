$(function () {
    const host = "https://oltmaywew4wvw2246qi4c3o23q0uwecc.lambda-url.us-east-1.on.aws";
    const incomingCallHangupButton = document.getElementById(
      "button-hangup-incoming"
    );
    const incomingCallAcceptButton = document.getElementById(
      "button-accept-incoming"
    );
    const incomingCallRejectButton = document.getElementById(
      "button-reject-incoming"
    );

    const myTable = document.getElementById("my-table")
    const incomingHandler = document.getElementById("incoming-handler")

    let device;
    let token;

    async function init(db) {
      resetIncomingCallUI();
      for (const element of db) {
        await startupClient(element);
      }
    }

    // SETUP STEP 1:
    // Browser client should be started after a user gesture
    // to avoid errors in the browser console re: AudioContext
    init([{
      number: "+13613149536",
      about: "这里是数据库里面存储的有关这个电话的信息，具体的信息是可以修改的"
    }]).then(() => console.log("init")).catch((error) => console.error(error));


    // SETUP STEP 2: Request an Access Token
    async function startupClient(element) {
      console.log("Requesting Access Token...");

      await navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        const data = await $.getJSON(host + "/token?number=" + encodeURIComponent(element.number));
        console.log("Got a token.");
        token = data.token;
        intitializeDevice(element);
      } catch (err) {
        console.log(err);
        console.log("An error occurred. See your browser console for more information.");
      }
    }

    // SETUP STEP 3:
    // Instantiate a new Twilio.Device
    function intitializeDevice(element) {
      console.log("Initializing device");
      device = new Twilio.Device(token, {
        logLevel: 1,
        // Set Opus as our preferred codec. Opus generally performs better, requiring less bandwidth and
        // providing better audio quality in restrained network conditions.
        codecPreferences: ["opus", "pcmu"]
      });

      addDeviceListeners(device);

      // Device must be registered in order to receive incoming calls
      device.register();

      const row = document.createElement("tr");
      const cell1 = document.createElement("td");
      cell1.textContent = element.number;
      row.appendChild(cell1);
      const cell2 = document.createElement("td");
      cell2.textContent = element.about;
      row.appendChild(cell2);
      const cell3 = document.createElement("td");
      cell3.textContent = device.state;
      row.appendChild(cell3);
      myTable.appendChild(row);

      console.log(device);
    }

    // SETUP STEP 4:
    // Listen for Twilio.Device states
    function addDeviceListeners(device) {
      device.on("registered", function () {
        console.log("Twilio.Device Ready to make and receive calls!");
      });

      device.on("error", function (error) {
        console.error("Twilio.Device Error: " + error.message);
      });

      device.on("incoming", handleIncomingCall);
    }

    // HANDLE INCOMING CALL

    function handleIncomingCall(call) {
      console.log(`Incoming call from ${call.parameters.From}`);
      incomingHandler.classList.remove("hide");

      //add event listeners for Accept, Reject, and Hangup buttons
      incomingCallAcceptButton.onclick = () => {
        acceptIncomingCall(call);
      };

      incomingCallRejectButton.onclick = () => {
        rejectIncomingCall(call);
      };

      incomingCallHangupButton.onclick = () => {
        hangupIncomingCall(call);
      };

      // add event listener to call object
      call.on("cancel", handleDisconnectedIncomingCall);
      call.on("disconnect", handleDisconnectedIncomingCall);
      call.on("reject", handleDisconnectedIncomingCall);
    }

    // ACCEPT INCOMING CALL

    function acceptIncomingCall(call) {
      call.accept();

      //update UI
      console.log("Accepted incoming call.");
      incomingCallAcceptButton.classList.add("hide");
      incomingCallRejectButton.classList.add("hide");
      incomingCallHangupButton.classList.remove("hide");
    }

    // REJECT INCOMING CALL

    function rejectIncomingCall(call) {
      call.reject();
      console.log("Rejected incoming call");
      resetIncomingCallUI();
    }

    // HANG UP INCOMING CALL

    function hangupIncomingCall(call) {
      call.disconnect();
      console.log("Hanging up incoming call");
      resetIncomingCallUI();
    }

    // HANDLE CANCELLED INCOMING CALL

    function handleDisconnectedIncomingCall() {
      console.log("Incoming call ended.");
      resetIncomingCallUI();
    }

    // MISC USER INTERFACE
    function resetIncomingCallUI() {
      incomingHandler.classList.add("hide");
      incomingCallAcceptButton.classList.remove("hide");
      incomingCallRejectButton.classList.remove("hide");
      incomingCallHangupButton.classList.add("hide");
    }
});
