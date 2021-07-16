import ChargePointMessage, { ChargePointAction } from "./cp";
import CentralSystemMessage, { CentralSystemAction } from "./cs";

export type ActionName = ChargePointAction | CentralSystemAction;

type ReqRes<T extends ActionName> = T extends ChargePointAction
  ? ChargePointMessage[T]
  : T extends CentralSystemAction
  ? CentralSystemMessage[T]
  : never;

/**
 * @example
 * import { Request } from 'ts-ocpp';
 *
 * type ChargeRelatedRequest = Request<'StartTransaction' | 'StopTransaction'>;
 *
 * @category Message Type
 */ // @ts-ignore, TS somehow doesn't recognize that there is a request property
export type Request<T extends ActionName> = ReqRes<T>["request"];

/**
 * @example
 * import { Response } from 'ts-ocpp';
 *
 * type ChargeRelatedResponse = Response<'StartTransaction' | 'StopTransaction'>;
 *
 * @category Message Type
 */ // @ts-ignore, TS somehow doesn't recognize that there is a response property
export type Response<T extends ActionName> = ReqRes<T>["response"];

type Result<T> = Promise<T> | T;

/**
 * TS is still not very good with dependent-typing
 * (i.e. making the return type differ on the input type)
 * so when using this it is advisable to do type assertions.
 *
 * @category Handler
 */
export type RequestHandler<T extends ActionName, Metadata = undefined> = (
  request: Request<T>,
  extra: Metadata,
) => Result<Response<T>>;
