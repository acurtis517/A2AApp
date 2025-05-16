/**
 * Class object for A2AApp.
 * This is used for building an Agent2Agent (A2A) server with Google Apps Script.
 * 
 * Author: Kanshi Tanaike
 * version 1.0.0
 * @class
 */
class A2AApp {

  /**
  * @param {Object} object Object using this script.
  * @param {String} object.accessKey Default is no value. This key is used for accessing the Web Apps.
  * @param {Boolean} object.log Default is false. When this is true, the log between A2A client and A2A server is stored to Google Sheets.
  * @param {String} object.spreadsheetId Spreadsheet ID. Log is storead to "Log" sheet of this spreadsheet.
  */
  constructor(object = {}) {
    const { accessKey = null, log = false, spreadsheetId } = object;

    /** @private */
    this.accessKey = accessKey;

    this.model = "models/gemini-2.0-flash";

    /** @private */
    this.date = new Date();

    /** @private */
    this.log = log;

    if (this.log) {
      const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.create("Log_A2AApp");

      /** @private */
      this.sheet = ss.getSheetByName("log") || ss.insertSheet("log");
    }

    /** @private */
    this.values = [];

    /** 
     * TaskState Enum
     * Ref: https://google.github.io/A2A/specification/#63-taskstate-enum
     * @private
     */
    this.TaskState = {
      submitted: 'submitted', // Task received by server, acknowledged, but processing has not yet actively started.
      working: 'working', // Task is actively being processed by the agent.
      input_required: 'input-required', // Agent requires additional input from the client/user to proceed. (Task is paused)
      completed: 'completed', // Task finished successfully. (Terminal state)
      canceled: 'canceled', // Task was canceled by the client or potentially by the server. (Terminal state)
      failed: 'failed', // Task terminated due to an error during processing. (Terminal state)
      unknown: 'unknown', // The state of the task cannot be determined (e.g., task ID invalid or expired). (Effectively a terminal state from client's PoV for that ID)
    };

    /**
     * Error codes.
     * Ref: https://google.github.io/A2A/specification/#8-error-handling
     * @private
     */
    this.ErrorCode = {
      // Standard JSON-RPC Errors
      "Invalid JSON payload": -32700,
      "Invalid JSON-RPC Request": -32600,
      "Method not found": -32601,
      "Invalid method parameters": -32602,
      "Internal server error": -32603,
      "(Server-defined)": -32000,

      // A2A-Specific Errors
      "Task not found": -32001,
      "Task cannot be canceled": -32002,
      "Push Notification is not supported": -32003,
      "This operation is not supported": -32004,
      "Incompatible content types": -32005,
      "Streaming is not supported": -32006,
      "Authentication required": -32007,
      "Authorization failed": -32008,
      "Invalid task state for operation": -32009,
      "Rate limit exceeded": -32010,
      "A required resource is unavailable": -32011
    };

  }

  /**
  * ### Description
  * Method for the A2A server.
  *
  * @param {Object} object Object using this script.
  * @param {Object} object.eventObject Event object from doPost and doGet functions.
  * @param {Object} object.apiKey API key for using Gemini API.
  * @param {Object} object.agentCard Object for registering your agent card.
  * @param {Object} object.functions Functions.
  * @return {ContentService.TextOutput}
  */
  server(object = {}) {
    this.errorProcess_(object);
    let id = "No ID";
    const lock = LockService.getScriptLock();
    if (lock.tryLock(350000)) {
      try {
        let obj = {};
        if (object.eventObject.postData) {
          obj = this.parseObj_(object.eventObject);
          if (obj.hasOwnProperty("id")) {
            id = obj.id;
          }
        }
        const res = this.createResponse_({ ...object, obj, id });
        if (this.log) {
          this.log_();
        }
        return res;
      } catch ({ stack }) {
        const err = "Internal server error";
        const errObj = { "error": { "code": this.ErrorCode[err], "message": `${err}. Error message: ${stack}` }, "jsonrpc": "2.0", id };
        this.values.push([this.date, null, id, "server --> client", JSON.stringify(errObj)]);
        if (this.log) {
          this.log_();
        }
        return this.createContent_(errObj);
      } finally {
        lock.releaseLock();
      }
    } else {
      const err = "Internal server error";
      const errObj = { "error": { "code": this.ErrorCode[err], "message": `${err}. Error message: Timeout.` }, "jsonrpc": "2.0", id };
      this.values.push([this.date, null, id, "server --> client", JSON.stringify(errObj)]);
      if (this.log) {
        this.log_();
      }
      return this.createContent_(errObj);
    }
  }

  /**
  * ### Description
  * Check parameters.
  *
  * @param {Object} object Object using this script.
  * @return {void}
  * @private
  */
  errorProcess_(object) {
    if (!object.eventObject) {
      throw new Error("Please set event object from doPost and doGet.");
    }
    if (!object.apiKey) {
      throw new Error("Please set your API key for using Gemini API.");
    }
  }

  /**
  * ### Description
  * Create the response to A2A client.
  *
  * @param {Object} object Object using this script.
  * @param {Object} object.eventObject Event object from doPost function.
  * @param {Object} object.apiKey API key for using Gemini API.
  * @param {Object} object.agentCard Object for agent card.
  * @param {Object} object.functions Functions.
  * @param {Object} object.obj
  * @param {Object} object.id
  * @return {ContentService.TextOutput}
  * @private
  */
  createResponse_(object) {
    const { eventObject, apiKey, agentCard, functions, obj, id } = object;
    const { pathInfo } = eventObject;
    if (pathInfo == ".well-known/agent.json") {
      if (!agentCard || typeof agentCard != "function") {
        throw new Error("Agent card was not found.");
      }
      const agentCardObj = agentCard();
      this.values.push([this.date, null, id, "server --> client", JSON.stringify(agentCardObj)]);
      return this.createContent_(agentCardObj);
    }
    if (!obj.hasOwnProperty("method")) return null;
    const method = obj.method.toLowerCase();
    this.values.push([this.date, method, id, "client --> server", JSON.stringify(obj)]);

    if (this.accessKey && eventObject.parameter.accessKey && eventObject.parameter.accessKey != this.accessKey) {
      this.values.push([this.date, method, id, "At server", "Invalid accessKey."]);
      const err = "Authorization failed";
      const errObj = { "error": { "code": this.ErrorCode[err], "message": `${err}. Invalid access key.` }, "jsonrpc": "2.0", id };
      this.values.push([this.date, method, id, "server --> client", JSON.stringify(errObj)]);
      return this.createContent_(errObj);
    }

    if (method == "tasks/send" && functions) {
      if (typeof functions != "function") {
        const err = "Internal server error";
        const errObj = { "error": { "code": this.ErrorCode[err], "message": `${err}. Invalid functions.` }, "jsonrpc": "2.0", id };
        this.values.push([this.date, method, id, "server --> client", JSON.stringify(errObj)]);
        return this.createContent_(errObj);
      }

      const functionObj = functions();
      const { params } = obj;
      const { message } = params;
      delete message.metadata;
      message.parts = message.parts.map(oo => {
        delete oo.type;
        delete oo.metadata;
        return oo;
      });
      const q1stquestion = message.parts[0].text;
      const g = new GeminiWithFiles({ apiKey, functions: functionObj, model: this.model });
      const res1 = g.generateContent(message);
      let returnThis;
      const lh = g.history[g.history.length - 1];
      if (lh.role == "function") {
        const r = lh.parts[0].functionResponse.response.content;
        returnThis = r.returnThis;
        lh.parts[0].functionResponse.response.content = r.result;
      }
      let resObj = {};
      if (returnThis) {
        resObj = {
          jsonrpc: "2.0",
          result: {
            id: params.id,
            sessionId: params.sessionId,
            status: { state: "completed", timestamp: this.date.toISOString() },
            artifacts: [
              {
                name: "Answer",
                index: 0,
                parts: [res1.functionResponse.result]
              }
            ]
          },
          id,
        }
      } else {
        g.functions = [];
        const res2 = g.generateContent({ q: q1stquestion });
        resObj = {
          jsonrpc: "2.0",
          result: {
            id: params.id,
            sessionId: params.sessionId,
            status: {
              state: "completed",
              message: { role: "agent", parts: [{ type: "text", text: res2 }] },
              timestamp: this.date.toISOString()
            },
            artifacts: [
              {
                name: "Answer",
                index: 0,
                parts: [{ type: "text", text: res2 }]
              }
            ]
          },
          id,
        };
      }
      this.values.push([this.date, method, id, "server --> client", JSON.stringify(resObj)]);
      return this.createContent_(resObj);
    }
    return null;
  }

  /**
  * ### Description
  * Parse object of the request body from doPost.
  *
  * @param {Object} e Object
  * @return {Object} object
  * @private
  */
  parseObj_(e) {
    let obj = {};
    if (e.postData.contents) {
      obj = JSON.parse(e.postData.contents);
    }
    return obj;
  }

  /**
  * ### Description
  * Convert text to an object of ContentService.TextOutput.
  *
  * @param {Object|String} data JSON object or Text.
  * @return {ContentService.TextOutput} object
  * @private
  */
  createContent_(data) {
    const d = typeof data == "object" ? JSON.stringify(data) : data;
    return ContentService.createTextOutput(d).setMimeType(ContentService.MimeType.JSON);
  }

  /**
  * ### Description
  * Store logs to Google Sheets.
  *
  * @return {void}
  * @private
  */
  log_() {
    this.values = this.values.map(r => r.map(c => typeof c == "string" ? c.substring(0, 40000) : c));
    this.sheet.getRange(this.sheet.getLastRow() + 1, 1, this.values.length, this.values[0].length).setValues(this.values);
  }
}
