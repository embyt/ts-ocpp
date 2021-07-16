import JSONCentralSystemMessage from "./json";

type CentralSystemMessage = JSONCentralSystemMessage;

export type CentralSystemAction = keyof CentralSystemMessage;

export const centralSystemActions: CentralSystemAction[] = [
  "CancelReservation",
  "ChangeAvailability",
  "ChangeConfiguration",
  "ClearCache",
  "ClearChargingProfile",
  "DataTransfer",
  "GetCompositeSchedule",
  "GetConfiguration",
  "GetDiagnostics",
  "GetLocalListVersion",
  "RemoteStartTransaction",
  "RemoteStopTransaction",
  "ReserveNow",
  "Reset",
  "SendLocalList",
  "SetChargingProfile",
  "TriggerMessage",
  "UnlockConnector",
  "UpdateFirmware",
];

export type CentralSystemRequest<T extends CentralSystemAction> =
  CentralSystemMessage[T]["request"];
export type CentralSystemResponse<T extends CentralSystemAction> =
  CentralSystemMessage[T]["response"];

export default CentralSystemMessage;
