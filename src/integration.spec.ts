import CentralSystem from "./cs";
import ChargePoint from "./cp";
import { ChargePointAction } from "./messages/cp";
import { Request } from "./messages";
import { CentralSystemAction } from "./messages/cs";

describe("test cs<->cp communication", () => {
  const connect = async (cp: ChargePoint, cs: CentralSystem) => {
    let triggerConnected = (_cpId: string) => {};
    cs.addConnectionListener((cpId, status) => {
      if (status === "connected") triggerConnected(cpId);
    });
    const waitForConnection = (cpId: string) =>
      new Promise((resolve) => {
        triggerConnected = (connectedId) => {
          if (connectedId == cpId) resolve(cpId);
        };
      });

    const waitCentralSystem = waitForConnection(cp.id);
    await cp.connect();
    await waitCentralSystem;
  };

  it("should connect", async () => {
    const PORT = 8080;
    const cs = new CentralSystem(PORT, (_req, _cpId) => {
      throw new Error("cs");
    });

    const cp = new ChargePoint(
      "123",
      () => {
        throw new Error("123");
      },
      `ws://localhost:${PORT}`,
    );
    await connect(cp, cs);

    cp.close();
    cs.close();
  });

  describe("sending messages", () => {
    const PORT = 8081;
    let waitCsReqTrigger = (_req: Request<ChargePointAction>) => {};
    const waitCsReq: Promise<Request<ChargePointAction>> = new Promise(
      (resolve) => (waitCsReqTrigger = resolve),
    );

    let waitCpReqTrigger = (_req: Request<CentralSystemAction>) => {};
    const _waitCpReq: Promise<Request<CentralSystemAction>> = new Promise(
      (resolve) => (waitCpReqTrigger = resolve),
    );

    const currentTime = new Date().toISOString();
    const cs = new CentralSystem(
      PORT,
      (req) => {
        waitCsReqTrigger(req as Request<ChargePointAction>);
        if (req.action === "Heartbeat") {
          return { action: "Heartbeat", currentTime };
        }
        if (req.action === "StatusNotification") {
          return { action: "StatusNotification" };
        }
        throw new Error("message not supported");
      },
      { rejectInvalidRequests: false },
    );

    const cp = new ChargePoint(
      "456",
      (req) => {
        waitCpReqTrigger(req as Request<CentralSystemAction>);
        if (req.action === "GetConfiguration")
          return {
            action: "GetConfiguration",
            configurationKey: [
              {
                key: "Test",
                readonly: true,
              },
            ],
          };
        throw new Error("456");
      },
      `ws://localhost:${PORT}`,
    );

    beforeAll(async () => await connect(cp, cs));

    it("normal heartbeat", async () => {
      const csResp = await cp.sendRequest({ action: "Heartbeat", payload: {} });

      expect((await waitCsReq).action).toBe("Heartbeat");
      expect(csResp.map((resp) => resp.currentTime)).toStrictEqual(currentTime);

      const cpResp = await cs.sendRequest({
        action: "GetConfiguration",
        chargePointId: "456",
        payload: {},
      });
      expect(cpResp.map((resp) => resp.configurationKey?.[0].key)).toStrictEqual("Test");
    });

    it("rejects invalid message", async () => {
      const csResp = await cp.sendRequest({
        action: "StatusNotification",
        payload: { connectorId: 0, errorCode: "NoError", status: "INVALID" as any },
      });
      expect(csResp.isLeft()).toBeTruthy();
    });

    afterAll(() => cs.close());
  });
});
