# ts-ocpp

:zap: OCPP (Open Charge Point Protocol) implemented in Typescript. Supports OCPP-JSON v1.6.

## install

```bash
npm install github:embyt/ts-ocpp --save
```

## instruction

### central system

defining a central system that accepts OCPP requests:

```typescript
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

sending a request to the chargepoint "123":

```typescript
// Returns a Either(Error or Success) object(functional, will not throw on error)
const response = await centralSystem.sendRequest({
  chargePointId: "123",
  action: "GetConfiguration",
  payload: {},
});
// it can be used in a functional way
response.map(({ configurationKey }) => configurationKey[0].key);
// or can be used in the standard JS way(will throw if there was an error)
const unsafeResponse = response.unsafeCoerce();
```

### chargepoint

defining a chargepoint that accepts OCPP requests:

```typescript
// port, request handler and central system URL as arguments
const chargepoint = new ChargePoint(3001, (req) => {
  switch (action) {
    case "GetConfiguration":
      // returns a successful response
      // (we pass the action so typescript knows which fields are needed)
      return {
        action: req.action,
        configurationKey: [],
      };
  }
  throw new Error("message not supported");
});
```

sending a request to the central system(see central system's section to understand the return type):

```typescript
const response = await chargepoint.sendRequest({ action: 'Heartbeat', payload: {} );
```
