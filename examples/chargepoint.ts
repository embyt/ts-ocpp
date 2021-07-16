import ChargePoint from "../src/cp";

if (!process.env.STATION_ID || !process.env.CENTRAL_SYSTEM_URL)
  throw new Error("pass STATION_ID and CENTRAL_SYSTEM_URL environment variables");

const cp = new ChargePoint(
  process.env.STATION_ID,
  (req) => {
    switch (req.action) {
      case "RemoteStartTransaction":
        return {
          action: req.action,
          status: "Accepted",
        };
    }
    throw new Error("message not supported");
  },
  process.env.CENTRAL_SYSTEM_URL,
);

async function main() {
  console.log("connecting cp...");
  cp.connect();
  console.log("connected!");
  setInterval(
    () => cp.sendRequest({ action: "Heartbeat", payload: {} }).then(console.log),
    3 * 1000,
  );
}

main().catch(console.error);
