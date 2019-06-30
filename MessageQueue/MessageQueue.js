/*
	Message Queue in Google Apps Script

	BSD 2-Clause License

	Copyright (c) 2019, Daniel Lorch
	All rights reserved.

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer.

	2. Redistributions in binary form must reproduce the above copyright notice,
       this list of conditions and the following disclaimer in the documentation
       and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
	FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
	DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
	SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
	CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
	OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
	OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var data_column_index = 0;
var reader_column_index = 1;
var label_read = "read";
var label_unread = "unread";
var long_poll_sleep = 200;

function deQueue(blocking) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var textFinder = sheet.createTextFinder(label_unread);
  
  var found = find_label(textFinder);
  while(blocking && found == null) {
    Utilities.sleep(long_poll_sleep);    
    found = find_label(textFinder);
  }

  var data = sheet.getDataRange().getValues();
  var result;
  if(found != null) {
    result = data[found.getRow()-1][data_column_index]; // sometimes, indices start at 0, sometimes at 1. But why? https://www.xkcd.com/163/
    sheet.getRange(found.getRow(), reader_column_index + 1).setValue(label_read);
  } else {
    result = null;
  }
    
  return result;
}

function find_label(textFinder) {
  var found = textFinder.findNext();
  while(found != null && found.getColumn() != (reader_column_index + 1)) { // only consider "reader" column
    found = textFinder.findNext();    
  }

  return found;
}
  
function enQueue(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.appendRow([data, label_unread]);
}

function doGet(request) {
  var result = {};
  
  if(request.parameter["action"] == "deQueue") {
    var blocking = (request.parameter["blocking"] == "true");
    var message = deQueue(blocking);

    if(message != null) {  
      var result = {
        result: "OK",
        message: message
      };
    }
  } else if(request.parameter["action"] == "enQueue") {
    var message = request.parameter["message"];
    
    enQueue(message);
    
    var result = {
      result: "OK"
    };
  } else {
    var result = {
      result: "Error",
      error: "Unrecognized action"
    };
  }
  
  var jsonpOutput = ContentService.createTextOutput();
  jsonpOutput.setMimeType(ContentService.MimeType.JAVASCRIPT); // JSON-P
  jsonpOutput.append(JSON.stringify(result));
  return jsonpOutput;
}