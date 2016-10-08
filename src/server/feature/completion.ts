import * as merlin from "../../shared/merlin";
import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as rpc from "vscode-jsonrpc";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.CompletionItem[], void> {
  return async (event, token) => {
    let prefix: null | string = null;
    try {
      prefix = await method.getPrefix(session, event);
      if (token.isCancellationRequested) return [];
    } catch (err) {
      // ignore errors from completing ' .'
    }
    if (prefix == null) return [];
    const position = merlin.Position.fromCode(event.position);
    const request = merlin.Query.complete.prefix(prefix).at(position).with.doc();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return [];
    if (response.class !== "return") return new rpc.ResponseError(-1, "onCompletion: failed", undefined);
    const entries = response.value.entries || [];
    return entries.map(merlin.Completion.intoCode);
  };
}