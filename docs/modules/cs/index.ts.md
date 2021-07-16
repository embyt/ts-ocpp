---
title: cs/index.ts
nav_order: 2
parent: Modules
---

## index overview

Sets up a central system, that can communicate with charge points

---

<h2 class="text-delta">Table of contents</h2>

- [Central System](#central-system)
  - [CentralSystem (class)](#centralsystem-class)
    - [addConnectionListener (method)](#addconnectionlistener-method)
    - [close (method)](#close-method)
    - [sendRequest (method)](#sendrequest-method)
- [utils](#utils)
  - [CSSendRequestArgs (type alias)](#cssendrequestargs-type-alias)
  - [CentralSystemOptions (type alias)](#centralsystemoptions-type-alias)
  - [RequestMetadata (type alias)](#requestmetadata-type-alias)

---

# Central System

## CentralSystem (class)

Represents the central system, can communicate with charge points

**Signature**

```ts
export declare class CentralSystem {
  constructor(
    port: number,
    cpHandler: RequestHandler<ChargePointAction, RequestMetadata>,
    options: CentralSystemOptions = {},
  );
}
```

**Example**

```ts
import { CentralSystem } from "ts-ocpp";

// port and request handler as arguments
const centralSystem = new CentralSystem(3000, (req, { chargePointId }) => {
  switch (req.action) {
    case "Heartbeat":
      // returns a successful response
      // (we pass the action so typescript knows which fields are needed)
      return {
        action: req.action,
        currentTime: new Date().toISOString(),
      };
  }
  throw new Error("message not supported");
});
```

### addConnectionListener (method)

**Signature**

```ts
public addConnectionListener(listener: ConnectionListener)
```

### close (method)

**Signature**

```ts
public close()
```

### sendRequest (method)

**Signature**

```ts
sendRequest<T extends CentralSystemAction>(args: CSSendRequestArgs<T>): EitherAsync<OCPPRequestError, Response<T>>
```

# utils

## CSSendRequestArgs (type alias)

**Signature**

```ts
export type CSSendRequestArgs<T extends CentralSystemAction> = {
  chargePointId: string;
  payload: Omit<Request<T>, "action">;
  action: T;
};
```

## CentralSystemOptions (type alias)

**Signature**

```ts
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
```

## RequestMetadata (type alias)

**Signature**

```ts
export type RequestMetadata = {
  chargePointId: string;
  httpRequest: IncomingMessage;
  validationError?: ValidationError;
};
```
