/**
 * GitHub  https://github.com/tanaikech/A2AApp<br>
 * Library name
 * @type {string}
 * @const {string}
 * @readonly
 */
var appName = "A2AApp";

/**
 * Main Class
 * 
 * @param {Object} object Object using this script.
 * @param {Boolean} object.log Default is false. When this is true, the log between A2A is stored to Google Sheets.
 * @param {String} object.spreadsheetId Spreadsheet ID. Log is storead to "Log" sheet of this spreadsheet.
 * @returns {A2AApp}
 */
function a2aApp(object) {
  this.a2aApp = new A2AApp(object);
  return this.a2aApp;
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
function server(object) {
  return this.a2aApp.server(object);
}
