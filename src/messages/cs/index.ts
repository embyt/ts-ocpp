import { OCPPVersion, OCPPVersionV16 } from "../../types";
import JSONCentralSystemMessage from "./json";

type CentralSystemMessage<V extends OCPPVersion = OCPPVersion> = V extends OCPPVersionV16
  ? JSONCentralSystemMessage
  : never;

export type CentralSystemAction<
  V extends OCPPVersion = OCPPVersion
> = keyof CentralSystemMessage<V>;

export const centralSystemActions: CentralSystemAction<"v1.6-json">[] = [
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

export type CentralSystemRequest<
  T extends CentralSystemAction,
  V extends OCPPVersion = OCPPVersion
> = CentralSystemMessage<V>[T]["request"];
export type CentralSystemResponse<
  T extends CentralSystemAction,
  V extends OCPPVersion = OCPPVersion
> = CentralSystemMessage<V>[T]["response"];

export default CentralSystemMessage;
