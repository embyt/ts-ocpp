import { OCPPVersion, OCPPVersionV16 } from "../../types";
import JSONChargePointMessage from "./json";

type ChargePointMessage<V extends OCPPVersion = OCPPVersion> = V extends OCPPVersionV16
  ? JSONChargePointMessage
  : never;

export type ChargePointAction<V extends OCPPVersion = OCPPVersion> = keyof ChargePointMessage<V>;

export const chargePointActions: ChargePointAction[] = [
  "Authorize",
  "BootNotification",
  "DataTransfer",
  "DiagnosticsStatusNotification",
  "FirmwareStatusNotification",
  "Heartbeat",
  "MeterValues",
  "StartTransaction",
  "StatusNotification",
  "StopTransaction",
];

export type ChargePointRequest<
  V extends OCPPVersion,
  T extends ChargePointAction
> = ChargePointMessage<V>[T]["request"];
export type ChargePointResponse<
  V extends OCPPVersion,
  T extends ChargePointAction
> = ChargePointMessage<V>[T]["response"];

export default ChargePointMessage;
