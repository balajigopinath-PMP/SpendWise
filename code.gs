// --- Configuration ---
const DB_NAME = "SpendWise_Data_v1"; // Name of the file in User's Drive
const TRANS_SHEET = "Transactions";
const TRIPS_SHEET = "Trips";

function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setTitle('SpendWise');
}

// --- SMART DATABASE CONNECTION ---
// This is the magic function. It searches the CURRENT USER'S Drive.
// If they have a DB, it opens it. If not, it creates one for them.
function getDatabase() {
  // Search user's drive for the file
  const files = DriveApp.getFilesByName(DB_NAME);
  
  if (files.hasNext()) {
    // File exists, open it
    return SpreadsheetApp.open(files.next());
  } else {
    // File doesn't exist, create it
    const ss = SpreadsheetApp.create(DB_NAME);
    setupNewSheetStructure(ss);
    return ss;
  }
}

function setupNewSheetStructure(ss) {
  // 1. Create Transactions Sheet
  let tSheet = ss.getSheetByName(TRANS_SHEET);
  if (!tSheet) {
    tSheet = ss.insertSheet(TRANS_SHEET);
    // Headers: id, type, category, amount, date, notes, createdAt
    tSheet.appendRow(["id", "type", "category", "amount", "date", "notes", "createdAt"]); 
    // Delete default 'Sheet1' if it exists to keep it clean
    const defaultSheet = ss.getSheetByName('Sheet1');
    if (defaultSheet) ss.deleteSheet(defaultSheet);
  }

  // 2. Create Trips Sheet
  let tripSheet = ss.getSheetByName(TRIPS_SHEET);
  if (!tripSheet) {
    tripSheet = ss.insertSheet(TRIPS_SHEET);
    // Headers: id, name, members (JSON), expenses (JSON), createdAt
    tripSheet.appendRow(["id", "name", "members", "expenses", "createdAt"]); 
  }
  
  // Populate with some starter data so the app isn't empty
  populateDummyData(tSheet, tripSheet);
}


// --- Helper: Dummy Data ---
function populateDummyData(tSheet, tripSheet) {
  const now = new Date();
  const d = (day) => {
    const date = new Date(now.getFullYear(), now.getMonth(), day);
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd");
  };

  const dummyTrans = [
    [new Date().getTime() + "1", "income", "Salary", 85000, d(1), "Monthly Stipend (Demo)", new Date()],
    [new Date().getTime() + "2", "expense", "Food", 450, d(3), "Team Lunch (Demo)", new Date()],
    [new Date().getTime() + "3", "expense", "Utilities", 1200, d(5), "Broadband Bill (Demo)", new Date()],
    [new Date().getTime() + "4", "emi", "Gadgets", 3500, d(10), "Laptop EMI (Demo) (1/12)", new Date()],
    [new Date().getTime() + "5", "investment", "Mutual Fund", 5000, d(2), "SIP Investment {{r:12}} (1/12)", new Date()]
  ];
  
  if (dummyTrans.length > 0) {
    tSheet.getRange(2, 1, dummyTrans.length, dummyTrans[0].length).setValues(dummyTrans);
  }
}

function clearDatabase() {
  const ss = getDatabase();
  const tSheet = ss.getSheetByName(TRANS_SHEET);
  const tripSheet = ss.getSheetByName(TRIPS_SHEET);

  if (tSheet && tSheet.getLastRow() > 1) tSheet.deleteRows(2, tSheet.getLastRow() - 1);
  if (tripSheet && tripSheet.getLastRow() > 1) tripSheet.deleteRows(2, tripSheet.getLastRow() - 1);
  
  return { success: true };
}

// --- API: User ---
function getUserProfile() {
  const email = Session.getActiveUser().getEmail();
  let name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return { email: email, name: name, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FA715E&color=fff` };
}

// --- API: Transactions ---
function getTransactions() {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRANS_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return []; 

  const data = sheet.getRange(2, 1, lastRow - 1, 6).getValues(); 
  return data.map(row => ({
    id: row[0], type: row[1], category: row[2], amount: row[3],
    date: formatDate(row[4]), notes: row[5]
  })).reverse();
}

function addTransaction(data) {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRANS_SHEET);
  const baseId = new Date().getTime().toString();
  
  // Recurrence Logic
  const isSalary = (data.type === 'income' && data.category === 'Salary');
  const isEMI = (data.type === 'emi');
  const isSIP = (data.type === 'investment' && data.isSIP); 

  let tenure = 1;
  if (isSalary || isEMI || isSIP) {
    tenure = data.tenure ? parseInt(data.tenure) : (isSalary ? 12 : 1);
  }
  
  for (let i = 0; i < tenure; i++) {
    let dateObj = new Date(data.date);
    dateObj.setMonth(dateObj.getMonth() + i);
    if (isSalary) dateObj.setDate(1);
    
    let dateStr = formatDate(dateObj);
    let note = data.notes;
    
    if (data.rate) {
       note += ` {{r:${data.rate}}}`;
    }

    if (tenure > 1) note += ` (${i + 1}/${tenure})`;

    sheet.appendRow([baseId + "_" + i, data.type, data.category, data.amount, dateStr, note, new Date()]);
  }
  return { success: true };
}

function deleteTransaction(id) {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRANS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false };
}

// --- API: Trips ---
function getTrips() {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRIPS_SHEET);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  return data.map(row => ({ id: row[0], name: row[1], members: row[2] ? JSON.parse(row[2]) : [], expenses: row[3] ? JSON.parse(row[3]) : [] }));
}

function addTrip(data) {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRIPS_SHEET);
  sheet.appendRow([new Date().getTime().toString(), data.name, JSON.stringify(data.members), JSON.stringify([]), new Date()]);
  return { success: true };
}

function addTripExpense(tripId, expenseData) {
  const ss = getDatabase();
  const sheet = ss.getSheetByName(TRIPS_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(tripId)) {
      let currentExpenses = data[i][3] ? JSON.parse(data[i][3]) : [];
      currentExpenses.push({ id: new Date().getTime().toString(), ...expenseData });
      sheet.getRange(i + 1, 4).setValue(JSON.stringify(currentExpenses));
      return { success: true };
    }
  }
  return { success: false };
}

function formatDate(dateObj) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj;
  try {
    return Utilities.formatDate(new Date(dateObj), Session.getScriptTimeZone(), "yyyy-MM-dd");
  } catch (e) { return String(dateObj); }
}