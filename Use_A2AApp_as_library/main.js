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
* Set services depend on each script. For example, those are LockService and PropertiesService.
* For example, if you don't set these properties, you cannot use this as a library.
* If you want to use A2AApp as a library, please set the services.
*
* In the current stage, only LockService is used and PropertiesService is not used in A2AApp. PropertiesService is for the future update.
*
* @param {Object} services Array including the services you want to use.
* @params {LockService.Lock} services.lock One of LockService.getDocumentLock(), LockService.getScriptLock(), or LockService.getUserLock(). Default is LockService.getScriptLock().
* @params {PropertiesService.Properties} services.properties  One of PropertiesService.getDocumentProperties(), PropertiesService.getScriptProperties(), or PropertiesService.getUserProperties(). Default is PropertiesService.getScriptProperties().
* @return {A2AApp}
*/
function setServices(services) {
  const { lock, properties } = services;
  if (lock) {
    /** @private */
    this.a2aApp.lock = lock;
  }
  if (properties) {
    /** @private */
    this.a2aApp.properties = properties;
  }
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

/**
 * ### Description
 * Return HtmlService.HtmlOutput for UI of A2A client.
 *
 * @return {HtmlService.HtmlOutput}
 */
function getClientIndex() {
  return HtmlService.createHtmlOutputFromFile("index_client").setTitle("A2A client from A2AApp");
}
