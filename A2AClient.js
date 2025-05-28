
const apiKey = "###"; // Please set your API key for using Gemini API.

// Please set Web Apps URLS to the following array.
const agentCardUrls = [
  "https://script.google.com/macros/s/###/dev?accessKey=sample", // Web Apps URL of A2A server 1_Google Sheets Manager Agent
  "https://script.google.com/macros/s/###/dev?accessKey=sample", // Web Apps URL of A2A server 2_Google Drive Manager Agent
  "https://script.google.com/macros/s/###/dev?accessKey=sample", // Web Apps URL of A2A server 3_Google Calendar Manager Agent
  "https://script.google.com/macros/s/###/dev?accessKey=sample", // Web Apps URL of A2A server 4_APIs Manager Agent
];

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Run").addItem("Open sidebar", "openSidebar").addToUi();
}

function openSidebar() {
  SpreadsheetApp.getUi().showSidebar(HtmlService.createHtmlOutputFromFile("index").setTitle("A2A client"));
}

/**
 * The function name "a2aClient" is used by the HTML".
 */
function a2aClient(o = {}) {
  const { prompt, history = [], agentCards = [] } = o;
  // history.length = 0; // If you want to be independent in each chat in the chat application, please use this.


  // This is a sample additional function.
  const functions = {
    params_: {
      getActiveCells: {
        description: [
          "Use this to get A1Notation of the active cells, sheet name, and spreadsheet ID.",
          "Use this when the information of the active cell is required.",
        ].join("\n"),
      }
    },

    getActiveCells: () => {
      console.log("Run the function getActiveCells.");
      let res;
      try {
        const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        const activeSheet = activeSpreadsheet.getActiveSheet();
        const activeCell = activeSheet.getActiveRange();
        res = [
          `Spreadsheet ID of the active Spreadsheet: ${activeSpreadsheet.getId()}`,
          `Sheet name of the active sheet: ${activeSheet.getSheetName()}`,
          `Cell range of the active cell: ${activeCell.getA1Notation()}`,
        ].join();
      } catch ({ stack }) {
        res = stack;
      }
      console.log(res); // Check response.
      return { result: res };
      // return { result: { type: "text", text: res, metadata: null } };
    }
  };

  const object = { apiKey, agentCardUrls, prompt, history, fileAsBlob: true, agentCards, functions };
  const obj = new A2AApp().client(object);
  if (!obj.history || !obj.agentCards || !obj.result) {
    return { history: [], agentCards: [], result: ["Internal error. Please try again."] };
  }
  obj.result = obj.result.map(e => {
    if (e.toString() == "Blob") {
      return {
        name: e.getName(),
        mimeType: e.getContentType(),
        data: `data:${e.getContentType()};base64,${Utilities.base64Encode(e.getBytes())}`,
      };
    }
    return e;
  });
  return obj;
}
