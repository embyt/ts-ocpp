/**
 * Sets up a central system, that can communicate with charge points
 */
import WebSocket from "ws";
import { IncomingMessage, createServer, Server } from "http";
import { Request, RequestHandler, Response } from "../messages";
import { ChargePointAction, chargePointActions } from "../messages/cp";
import { Connection, SUPPORTED_PROTOCOLS } from "../ws";
import { CentralSystemAction, centralSystemActions } from "../messages/cs";
import { OCPPRequestError, ValidationError } from "../errors";

const handleProtocols = (protocols: string[] | Set<string>): string => {
  // string[] in ws < 8.0
  if (Array.isArray(protocols)) {
    return protocols.find((protocol) => SUPPORTED_PROTOCOLS.includes(protocol)) ?? "";
  }
  // Set<string> in ws >= 8.0
  return SUPPORTED_PROTOCOLS.find((protocol) => protocols.has(protocol)) ?? "";
};

type ConnectionListener = (cpId: string, status: "disconnected" | "connected") => void;

export type RequestMetadata = {
  chargePointId: string;
  httpRequest: IncomingMessage;
  validationError?: ValidationError;
};

export type CSSendRequestArgs<T extends CentralSystemAction> = {
  chargePointId: string;
  payload: Omit<Request<T>, "action">;
  action: T;
};

export type CentralSystemOptions = {
  /** if the chargepoint sends an invalid request(in ocpp v1.6), we can still forward it to the handler */
  rejectInvalidRequests?: boolean;
  /** default is 0.0.0.0 */
  host?: string;
  /**
   * can be used to log exactly what the chargepoint sends to this central system without any processing
   * @example
   * onRawSocketData: (data) => console.log(data.toString('ascii'))
   **/
  onRawSocketData?: (data: Buffer) => void;
  onRawWebsocketData?: (
    data: WebSocket.Data,
    metadata: Omit<RequestMetadata, "validationError">,
  ) => void;
  /** in milliseconds */
  websocketPingInterval?: number;
};

type RequiredPick<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Represents the central system, can communicate with charge points
 *
 * @example
 * import { CentralSystem } from 'ts-ocpp';
 *
 * // port and request handler as arguments
 * const centralSystem = new CentralSystem(3000, (req, { chargePointId }) => {
 *   switch (req.action) {
 *     case 'Heartbeat':
 *       // returns a successful response
 *       // (we pass the action so typescript knows which fields are needed)
 *       return {
 *         action: req.action,
 *         currentTime: new Date().toISOString()
 *       };
 *   }
 *   throw new Error('message not supported');
 * });
 *
 * @category Central System
 */
export default class CentralSystem {
  private cpHandler: RequestHandler<ChargePointAction, RequestMetadata>;
  private connections: Record<string, Connection<ChargePointAction>> = {};
  private listeners: ConnectionListener[] = [];
  private websocketsServer: WebSocket.Server;
  private httpServer: Server;
  private options: RequiredPick<
    CentralSystemOptions,
    "websocketPingInterval" | "rejectInvalidRequests"
  >;

  constructor(
    port: number,
    cpHandler: RequestHandler<ChargePointAction, RequestMetadata>,
    options: CentralSystemOptions = {},
  ) {
    this.cpHandler = cpHandler;
    const host = options.host ?? "0.0.0.0";
    this.options = {
      ...options,
      rejectInvalidRequests: options.rejectInvalidRequests ?? true,
      websocketPingInterval: 30_000,
    };

    this.httpServer = createServer();
    this.httpServer.on("connection", (socket) => {
      options.onRawSocketData && socket.on("data", (data) => options.onRawSocketData?.(data));
    });
    this.httpServer.listen(port, host);
    this.websocketsServer = this.setupWebsocketsServer();
  }

  public addConnectionListener(listener: ConnectionListener) {
    this.listeners.push(listener);
  }

  public close() {
    this.httpServer.close();
    this.websocketsServer.close();
  }

  sendRequest<T extends CentralSystemAction>(args: CSSendRequestArgs<T>): Promise<Response<T>> {
    const { chargePointId, payload, action } = args;
    if (!chargePointId) throw new OCPPRequestError("charge point id was not provided");
    // @ts-ignore - TS somehow doesn't understand that this is right
    const request: Request<T> = { ...payload, action };

    const connection = this.connections[args.chargePointId];
    if (!connection) throw new OCPPRequestError("there is no connection to this charge point");

    return connection.sendRequest(action, request as Request<T>);
  }

  /** @internal */
  private setupWebsocketsServer(): WebSocket.Server {
    const server = new WebSocket.Server({ server: this.httpServer, handleProtocols });
    server.on("error", console.error);
    server.on("upgrade", console.info);
    server.on("connection", (socket, request) => this.handleConnection(socket, request));
    return server;
  }

  /** @internal */
  private decodeChargepointId(url: string | undefined) {
    // determine and translate chargepoint identifier
    let chargePointId = url?.split("/").pop();
    // decode url to convert %20 to blanks
    if (chargePointId) {
      chargePointId = decodeURI(chargePointId);
    }
    // strip potential site identifiers like keba1@Hotel 23
    if (chargePointId?.includes("@") && chargePointId.split("@")[0]) {
      chargePointId = chargePointId.split("@")[0];
    }
    // also allow charge point ids in format "?<chargePoint>", which is needed if
    // path matching is not supported by ocpp backend (like AWS AppGateway)
    if (chargePointId?.includes("?") && chargePointId.split("?")[1]) {
      chargePointId = chargePointId.split("?")[1];
    }
    // also allow charge point ids in format "?chargerId=<chargePoint>", just in case
    if (chargePointId?.includes("=") && chargePointId.split("=")[1]) {
      chargePointId = chargePointId.split("=")[1];
    }
    return chargePointId;
  }

  /** @internal */
  private handleConnection(socket: WebSocket, httpRequest: IncomingMessage) {
    if (!socket.protocol) {
      socket.close();
      return;
    }
    // determine and translate chargepoint identifier
    const chargePointId = this.decodeChargepointId(httpRequest.url);
    if (!chargePointId) {
      socket.close();
      return;
    }

    this.listeners.forEach((f) => f(chargePointId!, "connected"));

    const metadata: RequestMetadata = { chargePointId, httpRequest };

    function noop() {}
    const pingInterval = setInterval(() => {
      socket.ping(noop);
    }, this.options.websocketPingInterval);

    const connection = new Connection(
      socket,
      // @ts-ignore, TS is not good with dependent typing, it doesn't realize that the function
      // returns OCPP v1.6 responses when the request is a OCPP v1.6 request
      (request, validationError) => this.cpHandler(request, { ...metadata, validationError }),
      chargePointActions,
      centralSystemActions,
      this.options.rejectInvalidRequests,
    );
    this.connections[chargePointId] = connection;

    socket.on("message", (data) => {
      this.options.onRawWebsocketData?.(data, metadata);
      connection.handleWebsocketData(data);
    });
    socket.on("close", () => {
      delete this.connections[chargePointId!];
      clearInterval(pingInterval);
      this.listeners.forEach((f) => f(chargePointId!, "disconnected"));
    });
  }
}
