---
title: messages/index.ts
nav_order: 3
parent: Modules
---

## index overview

---

<h2 class="text-delta">Table of contents</h2>

- [Handler](#handler)
  - [RequestHandler (type alias)](#requesthandler-type-alias)
- [Message Type](#message-type)
  - [Request (type alias)](#request-type-alias)
  - [Response (type alias)](#response-type-alias)
- [utils](#utils)
  - [ActionName (type alias)](#actionname-type-alias)

---

# Handler

## RequestHandler (type alias)

TS is still not very good with dependent-typing
(i.e. making the return type differ on the input type)
so when using this it is advisable to do type assertions.

**Signature**

```ts
export type RequestHandler<T extends ActionName, Metadata = undefined> = (
  request: Request<T>,
  extra: Metadata,
) => Result<Response<T>>;
```

# Message Type

## Request (type alias)

**Signature**

```ts
export type Request<T extends ActionName> = ReqRes<T>["request"];
```

**Example**

```ts
import { Request } from "ts-ocpp";

type ChargeRelatedRequest = Request<"StartTransaction" | "StopTransaction">;
```

## Response (type alias)

**Signature**

```ts
export type Response<T extends ActionName> = ReqRes<T>["response"];
```

**Example**

```ts
import { Response } from "ts-ocpp";

type ChargeRelatedResponse = Response<"StartTransaction" | "StopTransaction">;
```

# utils

## ActionName (type alias)

**Signature**

```ts
export type ActionName = ChargePointAction | CentralSystemAction;
```
