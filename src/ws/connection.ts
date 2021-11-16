import WebSocket from "ws";
import { parseOCPPMessage, stringifyOCPPMessage } from "./format";
import { MessageType, OCPPJMessage } from "./types";
import { ActionName, Request, RequestHandler, Response } from "../messages";
import { OCPPRequestError } from "../errors/index";
import { validateMessageRequest } from "../messages/validation";
import * as uuid from "uuid";

export default class Connection<ReqAction extends ActionName> {
  private messageTriggers: Record<string, (m: OCPPJMessage) => void> = {};
  constructor(
    private readonly socket: WebSocket,
    private readonly requestHandler: RequestHandler<ReqAction>,
    private readonly requestedActions: ReqAction[],
    private readonly respondedActions: ActionName[],
    private readonly rejectInvalidRequests: boolean = true,
  ) {}

  public async sendRequest<T extends ActionName>(
    action: T,
    { action: _, ...payload }: Request<T>,
  ): Promise<Response<T>> {
    const id = uuid.v4();
    const waitResponse: Promise<OCPPJMessage> = new Promise((resolve) => {
      this.messageTriggers[id] = resolve;
    });
    // this will throw in case of errors
    validateMessageRequest(action, payload, this.respondedActions);

    await this.sendOCPPMessage({
      id,
      type: MessageType.CALL,
      action,
      payload,
    });
    const message = await waitResponse;

    if (message.type === MessageType.CALL)
      throw new OCPPRequestError(
        "response received was of CALL type, should be either CALLRESULT or CALLERROR",
      );
    if (message.type === MessageType.CALLERROR)
      throw new OCPPRequestError(
        "other side responded with error",
        message.errorCode,
        message.errorDescription,
        message.errorDetails,
      );

    return message.payload as Response<T>;
  }

  public handleWebsocketData(data: WebSocket.Data) {
    this.handleOCPPMessage(parseOCPPMessage(data)).then((response) => {
      if (response) {
        this.sendOCPPMessage(response);
      }
    });
  }

  public close() {
    this.socket.close();
  }

  private async sendOCPPMessage(message: OCPPJMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.send(stringifyOCPPMessage(message), (err) => {
        err ? reject(err) : resolve();
      });
    });
  }

  private async handleOCPPMessage(message: OCPPJMessage): Promise<OCPPJMessage | undefined> {
    switch (message.type) {
      case MessageType.CALL:
        let response;
        try {
          const req = validateMessageRequest(
            message.action,
            message.payload ?? {},
            this.requestedActions,
          );
          response = await this.requestHandler(req, undefined);
          const { action: _action, ...payload } = response;
          return {
            type: MessageType.CALLRESULT,
            id: message.id,
            payload,
          };
        } catch (error) {
          return {
            id: message.id,
            type: MessageType.CALLERROR,
            errorCode: "GenericError",
            errorDescription: `${error}`,
            errorDetails: undefined,
          };
        }
      case MessageType.CALLERROR:
      case MessageType.CALLRESULT:
        this.messageTriggers[message.id](message);
    }
  }
}
