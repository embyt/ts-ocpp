import { ValidationError } from "../errors";
import { ActionName, Request, Response } from ".";
import { validate } from "jsonschema";

type ReqRes<Action extends ActionName> = {
  request: Request<Action>;
  response: Response<Action>;
};

const validateMessage = <Action extends ActionName, T extends "request" | "response">(
  type: T,
  action: string,
  body: object,
  acceptedActions: Action[],
): ReqRes<Action>[T] => {
  if (!acceptedActions.includes(action as Action)) throw new ValidationError("action is not valid");

  const schema = require(`./json/${type}/${action}.json`);
  const result = validate(body, schema);

  if (!result.valid) {
    throw new ValidationError(`jsonschema errors: ${result.errors.map((err) => err.toString())}`);
  }

  return {
    action,
    ...body,
  } as ReqRes<Action>[T];
};

export const validateMessageRequest = <T extends ActionName>(
  action: string,
  body: object,
  acceptedActions: T[],
): Request<T> => validateMessage("request", action, body, acceptedActions);

export const validateMessageResponse = <T extends ActionName>(
  action: string,
  body: object,
  acceptedActions: T[],
): Response<T> => validateMessage("response", action, body, acceptedActions);
