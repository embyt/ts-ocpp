import CentralSystem from "../src/cs";

const cs = new CentralSystem(
  8080,
  (req, metadata) => {
    console.log("new request from: ", metadata.chargePointId);
    switch (req.action) {
      case "Heartbeat":
        return { action: req.action, currentTime: new Date().toISOString() };
      case "StatusNotification":
        return { action: req.action };
    }
    throw new Error("not supported");
  },
  {
    onRawSocketData: (data) => console.log(data.toString("ascii")),
    onRawWebsocketData: (data, { chargePointId }) => console.log(chargePointId, data.toString()),
  },
);

cs.addConnectionListener(console.log);

console.log("server started");

if (process.env.SEND_COMMAND) {
  setTimeout(async () => {
    console.log("sending request");
    const response = await cs.sendRequest({
      action: "RemoteStartTransaction",
      chargePointId: "123",
      // chargePointUrl: 'http://localhost:12800',
      payload: {
        connectorId: 2,
        idTag: "123",
      },
    });
    console.log({ response });
  }, 3000);
}
