import JSONChargePointMessage from "./json";

type ChargePointMessage = JSONChargePointMessage;

export type ChargePointAction = keyof ChargePointMessage;

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

export type ChargePointRequest<T extends ChargePointAction> = ChargePointMessage[T]["request"];
export type ChargePointResponse<T extends ChargePointAction> = ChargePointMessage[T]["response"];

export default ChargePointMessage;
