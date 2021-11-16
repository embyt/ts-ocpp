import { MessageType, OCPPJMessage } from "./types";
import { ValidationError } from "../errors";
import WebSocket from "ws";

export const parseOCPPMessage = (raw: WebSocket.Data): OCPPJMessage => {
  try {
    if (typeof raw !== "string") {
      throw new ValidationError("only string is supported");
    }

    const [type, id, ...rest] = JSON.parse(raw) as Array<any>;
    switch (type as MessageType) {
      case MessageType.CALL: {
        const [action, payload] = rest;
        return {
          type: MessageType.CALL,
          id,
          action,
          ...(payload ? { payload } : {}),
        };
      }
      case MessageType.CALLRESULT: {
        const [payload] = rest;
        return {
          type: MessageType.CALLRESULT,
          id,
          ...(payload ? { payload } : {}),
        };
      }
      case MessageType.CALLERROR: {
        const [errorCode, errorDescription, errorDetails] = rest;
        return {
          type: MessageType.CALLERROR,
          id,
          errorCode,
          errorDescription,
          ...(errorDetails ? { errorDetails } : {}),
        };
      }
      default:
        throw new ValidationError(`Not supported message type: ${type}`);
    }
  } catch (err) {
    throw new ValidationError(`An error occurred when trying to parse message: "${raw}"`);
  }
};

export const stringifyOCPPMessage = (message: OCPPJMessage): string => {
  switch (message.type) {
    case MessageType.CALL: {
      const { type, id, action, payload } = message;
      return JSON.stringify([type, id, action, ...(payload ? [payload] : [])]);
    }
    case MessageType.CALLRESULT: {
      const { type, id, payload } = message;
      return JSON.stringify([type, id, ...(payload ? [payload] : [])]);
    }
    case MessageType.CALLERROR: {
      const { type, id, errorCode, errorDescription, errorDetails } = message;
      return JSON.stringify([
        type,
        id,
        errorCode,
        errorDescription,
        ...(errorDetails ? [errorDetails] : []),
      ]);
    }
  }
};
