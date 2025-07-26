// === Sheet Names ===
const SHEET_NAMES = {
  books: "Books",
  users: "Users",
  librarians: "Librarians",
  issuedBooks: "IssuedBooks",
  history: "HistoryLog"
};

// === GET Method Handler ===
function doGet(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.parameter.data || '{}');

  switch (action) {
    case "getBooks":
      return getSheetData(SHEET_NAMES.books);
    case "getUsers":
      return getSheetData(SHEET_NAMES.users);
    case "getIssuedBooks":
      return getSheetData(SHEET_NAMES.issuedBooks);
    case "getHistory":
      return getSheetData(SHEET_NAMES.history);
    case "addBook":
      return addSheetData(SHEET_NAMES.books, data);
    case "addUser":
      return addSheetData(SHEET_NAMES.users, data);
    case "issueBook":
      return issueBook(data);
    case "returnBook":
      return returnBook(data);
    default:
      return ContentService.createTextOutput("Invalid action");
  }
}

// === Get Data from Sheet ===
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const rows = data.slice(1).map(row => {
    return headers.reduce((obj, key, i) => {
      obj[key] = row[i];
      return obj;
    }, {});
  });

  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

// === Add Data to Sheet ===
function addSheetData(sheetName, data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => data[h] || "");
  sheet.appendRow(row);

  return ContentService.createTextOutput("Success");
}

// === Issue Book Function ===
function issueBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.issuedBooks);
  const historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.history);

  const headers = sheet.getDataRange().getValues()[0];
  const row = headers.map(h => data[h] || "");
  sheet.appendRow(row);

  // Log to History
  const historyHeaders = historySheet.getDataRange().getValues()[0];
  const historyRow = historyHeaders.map(h => data[h] || "");
  historySheet.appendRow(historyRow);

  return ContentService.createTextOutput("Book Issued & Logged");
}

// === Return Book Function ===
function returnBook(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.issuedBooks);
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data["BookID"] && rows[i][1] === data["UserID"]) {
      sheet.deleteRow(i + 1);
      break;
    }
  }

  // Log to History
  const historySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.history);
  const historyHeaders = historySheet.getDataRange().getValues()[0];
  const returnRow = historyHeaders.map(h => data[h] || "");
  historySheet.appendRow(returnRow);

  return ContentService.createTextOutput("Book Returned & Logged");
}

fetch('https://script.google.com/macros/s/AKfycbyodw43BMOCBDcMu6y4isSat5cTgjr6gIxrMAL-YvNp2uRJ4nM5enOYPhYDwUx0PGUYOw/exec')
  .then(res => res.json())
  .then(data => console.log(data));



// --- Configuration ---
// Removed APPS_SCRIPT_WEB_APP_URL as backend is removed.





// Global variables (now purely local)
let isAppReady = false; // Flag to ensure app is ready

// --- Data Models (These will now be populated and managed locally) ---
let myLibrary = []; // Represents all books in the catalog
let users = []; // Stores user data (id, name, type, class)
let issuedBooks = []; // Stores currently issued book records
let historyLog = []; // Stores all issue/return transactions
let librarians = []; // Stores librarian data (id, name, position)

// For edit mode
let editingBookId = null;
let editingUserId = null;
let editingLibrarianId = null; // New: For librarian edit mode

// For issue/return section
let selectedBookForIssue = null;
let selectedUserForIssue = null; // Stores the selected user object from the input field
let selectedLibrarianForIssue = null; // New: Stores the selected librarian object

// Callback for confirmation modal
let confirmationCallback = null;

// --- DOM Elements ---
const currentLoggedInUserIdDisplay = document.getElementById('currentLoggedInUserIdDisplay');
const loadingOverlay = document.getElementById('loadingOverlay');

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section-content');

// Catalog Section Elements
const bookForm = document.getElementById('bookForm');
const bookFormTitle = document.getElementById('bookFormTitle');
const bookFormSubmitBtn = document.getElementById('bookFormSubmitBtn');
const cancelBookEditBtn = document.getElementById('cancelBookEditBtn');
const bookListDiv = document.getElementById('bookList');
const noBooksMessage = document.getElementById('noBooksMessage');

// Issue Section Elements
const issueBookForm = document.getElementById('issueBookForm');
const catalogNumberSearchInput = document.getElementById('catalogNumberSearch');
const searchBookBtn = document.getElementById('searchBookBtn');
const issueUserIdSearchInput = document.getElementById('issueUserIdSearch');
const searchUserInIssueBtn = document.getElementById('searchUserInIssueBtn');
const issueLibrarianSelect = document.getElementById('issueLibrarianSelect');
const selectedBookDisplay = document.getElementById('selectedBookDisplay');
const selectedBookTitle = document.getElementById('selectedBookTitle');
const selectedBookAuthor = document.getElementById('selectedBookAuthor');
const selectedBookISBN = document.getElementById('selectedBookISBN');
const selectedBookCatalogNumber = document.getElementById('selectedBookCatalogNumber');
const selectedBookAvailableCopies = document.getElementById('selectedBookAvailableCopies');
const selectedUserDisplay = document.getElementById('selectedUserDisplay');
const selectedUserName = document.getElementById('selectedUserName');
const selectedUserClass = document.getElementById('selectedUserClass');
const issueBookSubmitBtn = document.getElementById('issueBookSubmitBtn');
const issuedBooksListDiv = document.getElementById('issuedBooksList');
const noIssuedBooksMessage = document.getElementById('noIssuedBooksMessage');

// History Section Elements
const historyTableBody = document.getElementById('historyTableBody');
const historyUserIdSearchInput = document.getElementById('historyUserIdSearch');
const searchHistoryBtn = document.getElementById('searchHistoryBtn');
const noHistoryMessage = document.getElementById('noHistoryMessage');

// User Management Section
const addUserForm = document.getElementById('addUserForm');
const userFormTitle = document.getElementById('userFormTitle');
const userFormSubmitBtn = document.getElementById('userFormSubmitBtn');
const cancelUserEditBtn = document.getElementById('cancelUserEditBtn');
const newUserIdInput = document.getElementById('newUserId');
const newUserNameInput = document.getElementById('newUserName');
const newUserTypeSelect = document.getElementById('newUserType');
const newUserClassGroup = document.getElementById('newUserClassGroup');
const newUserClassSelect = document.getElementById('newUserClass');
const userListDiv = document.getElementById('userList');
const usthadListDiv = document.getElementById('usthadList');
const usthadUsersContainer = document.getElementById('usthadUsersContainer');
const noUsthadMessage = document.getElementById('noUsthadMessage');

// Librarian Section Elements
const addLibrarianForm = document.getElementById('addLibrarianForm');
const librarianFormTitle = document.getElementById('librarianFormTitle');
const librarianFormSubmitBtn = document.getElementById('librarianFormSubmitBtn');
const cancelLibrarianEditBtn = document.getElementById('cancelLibrarianEditBtn');
const newLibrarianNameInput = document.getElementById('newLibrarianName');
const newLibrarianPositionSelect = document.getElementById('newLibrarianPosition');
const librarianListDiv = document.getElementById('librarianList');
const noLibrariansMessage = document.getElementById('noLibrariansMessage');

// Dashboard Elements
const totalBooksCount = document.getElementById('totalBooksCount');
const issuedBooksCount = document.getElementById('issuedBooksCount');
const totalUsersCount = document.getElementById('totalUsersCount');
const totalLibrariansCount = document.getElementById('totalLibrariansCount');

// Status Section Elements
const currentTimeSpan = document.getElementById('currentTime');
const lastSyncTimeSpan = document.getElementById('lastSyncTime');
const totalRecordsSpan = document.getElementById('totalRecords');
const frequentReadersList = document.getElementById('frequentReadersList');
const noFrequentReadersMessage = document.getElementById('noFrequentReadersMessage');
const popularBooksList = document.getElementById('popularBooksList');
const noPopularBooksMessage = document.getElementById('noPopularBooksMessage');

// Confirmation Modal Elements
const confirmationModal = document.getElementById('confirmationModal');
const confirmationModalTitle = document.getElementById('confirmationModalTitle');
const confirmationModalMessage = document.getElementById('confirmationModalMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

// Message box utility
function showMessage(message, type = 'success') {
    const messageBox = document.getElementById('messageBox');
    messageBox.textContent = message;
    messageBox.className = `message-box show ${type}`;
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, 3000);
}

// Custom confirmation modal function
function showConfirmationModal(title, message, callback) {
    confirmationModalTitle.textContent = title;
    confirmationModalMessage.textContent = message;
    confirmationCallback = callback;
    confirmationModal.classList.add('show');
}

function hideConfirmationModal() {
    confirmationModal.classList.remove('show');
    confirmationCallback = null;
}

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// --- Data Persistence (Local Storage) ---
function saveToLocalStorage() {
    localStorage.setItem('myLibrary', JSON.stringify(myLibrary));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('issuedBooks', JSON.stringify(issuedBooks));
    localStorage.setItem('historyLog', JSON.stringify(historyLog));
    localStorage.setItem('librarians', JSON.stringify(librarians));
    lastSyncTimeSpan.textContent = new Date().toLocaleTimeString();
}

function loadFromLocalStorage() {
    myLibrary = JSON.parse(localStorage.getItem('myLibrary')) || [];
    users = JSON.parse(localStorage.getItem('users')) || [];
    issuedBooks = JSON.parse(localStorage.getItem('issuedBooks')) || [];
    historyLog = JSON.parse(localStorage.getItem('historyLog')) || [];
    librarians = JSON.parse(localStorage.getItem('librarians')) || [];
    lastSyncTimeSpan.textContent = localStorage.getItem('lastSyncTime') || 'N/A'; // Update this when saving
}


// --- Application Initialization ---
function initializeApp() {
    showLoading();
    loadFromLocalStorage(); // Load data from local storage

    isAppReady = true;
    currentLoggedInUserIdDisplay.textContent = '';
    showSection('dashboard-section');
    
    // Initial renders now rely on locally loaded data
    renderCatalog();
    renderUserManagement();
    renderIssuedBooks();
    renderHistoryLog();
    renderDashboard();
    populateNewUserClassDropdown();
    renderLibrarianManagement();
    populateLibrarianDropdownForIssue();
    updateStatusSection();

    toggleUserClassVisibility();
    hideLoading();
}

// --- User Management (Add/Edit/Delete User) Handlers ---
function handleAddOrUpdateUser(userId, name, userType, userClass) {
    showLoading();
    try {
        let userToSave = {
            id: userId || 'user-' + Date.now(), // Generate ID if not provided
            name: name,
            type: userType,
            userClass: userType === 'Student' ? userClass : null,
        };

        if (editingUserId) {
            // Update existing user
            const index = users.findIndex(user => user.id === editingUserId);
            if (index !== -1) {
                users[index] = { ...users[index], ...userToSave }; // Merge updates
                showMessage('User updated successfully!');
            } else {
                showMessage('User not found for update.', 'error');
            }
        } else {
            // Add new user
            if (users.some(user => user.id === userToSave.id)) {
                showMessage('User ID already exists. Please use a different ID or leave it empty for auto-generate.', 'error');
                hideLoading();
                return;
            }
            users.push(userToSave);
            showMessage('User added successfully!');
        }
        
        saveToLocalStorage(); // Save changes to local storage
        addUserForm.reset();
        resetUserFormForAdd();
        renderUserManagement();
        renderDashboard();
        updateStatusSection();
    } catch (error) {
        console.error("Error adding/updating user:", error);
        showMessage(`Failed to save user: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleEditUser(userId) {
    const userToEdit = users.find(user => user.id === userId);
    if (userToEdit) {
        editingUserId = userId;
        newUserIdInput.value = userToEdit.id;
        newUserNameInput.value = userToEdit.name;
        newUserTypeSelect.value = userToEdit.type;

        newUserIdInput.disabled = true; // User ID cannot be changed during edit
        newUserTypeSelect.disabled = true; // User Type cannot be changed during edit
        
        toggleUserClassVisibility();

        if (userToEdit.type === 'Student') {
            newUserClassSelect.value = userToEdit.userClass;
            newUserClassSelect.disabled = true; // Class cannot be changed during edit
        } else {
            newUserClassSelect.disabled = true;
        }
        
        userFormTitle.textContent = 'Edit User';
        userFormSubmitBtn.textContent = 'Update User';
        cancelUserEditBtn.classList.remove('hidden');
    } else {
        showMessage('User not found for editing.', 'error');
    }
}

function resetUserFormForAdd() {
    editingUserId = null;
    addUserForm.reset();
    newUserIdInput.disabled = false;
    newUserNameInput.disabled = false;
    newUserTypeSelect.disabled = false;
    newUserClassSelect.disabled = false;
    
    userFormTitle.textContent = 'Add New User';
    userFormSubmitBtn.textContent = 'Add User';
    cancelUserEditBtn.classList.add('hidden');
    toggleUserClassVisibility();
}

function handleRemoveUser(userId, userName) {
    showConfirmationModal(`Delete User`, `Are you sure you want to remove user "${userName}"? This action cannot be undone.`, (confirmed) => {
        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            const initialLength = users.length;
            users = users.filter(user => user.id !== userId);
            if (users.length < initialLength) {
                // Also remove any issued books by this user
                issuedBooks = issuedBooks.filter(issue => issue.userId !== userId);
                // Add a history log for user deletion (optional, but good for tracking)
                historyLog.push({
                    id: 'hist-' + Date.now(),
                    type: 'user_deleted',
                    userId: userId,
                    userName: userName,
                    timestamp: new Date().toISOString(),
                    details: `User "${userName}" (ID: ${userId}) was removed.`
                });
                showMessage('User removed successfully!');
                saveToLocalStorage();
                renderUserManagement();
                renderIssuedBooks(); // Update issued books list as well
                renderDashboard();
                resetIssueUserSelection();
                updateStatusSection();
            } else {
                showMessage('User not found.', 'error');
            }
        } catch (error) {
            console.error("Error removing user:", error);
            showMessage(`Failed to remove user: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}

// --- Book Management (Add/Edit/Delete Book) Handlers ---
function handleAddOrUpdateBook(bookData) {
    showLoading();
    try {
        if (editingBookId) {
            // Update existing book
            const index = myLibrary.findIndex(book => book.id === editingBookId);
            if (index !== -1) {
                myLibrary[index] = { ...myLibrary[index], ...bookData }; // Merge updates
                showMessage('Book updated successfully!');
            } else {
                showMessage('Book not found for update.', 'error');
            }
        } else {
            // Add new book
            if (myLibrary.some(book => book.isbn === bookData.isbn)) {
                showMessage('Book with this ISBN already exists.', 'error');
                hideLoading();
                return;
            }
            if (myLibrary.some(book => book.catalogNumber === bookData.catalogNumber)) {
                showMessage('Book with this Catalog Number already exists.', 'error');
                hideLoading();
                return;
            }
            const newBook = {
                id: 'book-' + Date.now(), // Simple ID generation
                ...bookData,
                availableCopies: bookData.totalCopies // Initially all copies are available
            };
            myLibrary.push(newBook);
            showMessage('Book added successfully!');
        }
        
        saveToLocalStorage(); // Save changes to local storage
        bookForm.reset();
        resetBookFormForAdd();
        renderCatalog();
        renderDashboard();
        updateStatusSection();
    }
    catch (error) {
        console.error("Error adding/updating book:", error);
        showMessage(`Failed to save book: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleEditBook(bookId) {
    const bookToEdit = myLibrary.find(book => book.id === bookId);
    if (bookToEdit) {
        editingBookId = bookId;
        document.getElementById('title').value = bookToEdit.title;
        document.getElementById('author').value = bookToEdit.author;
        document.getElementById('isbn').value = bookToEdit.isbn;
        document.getElementById('catalogNumber').value = bookToEdit.catalogNumber;
        document.getElementById('publishingYear').value = bookToEdit.publishingYear;
        document.getElementById('publisher').value = bookToEdit.publisher;
        document.getElementById('bookPrice').value = bookToEdit.bookPrice;
        document.getElementById('category').value = bookToEdit.category;
        document.getElementById('totalCopies').value = bookToEdit.totalCopies;
        document.getElementById('read').checked = bookToEdit.read;

        document.getElementById('isbn').disabled = true; // ISBN should not be editable after creation
        document.getElementById('catalogNumber').disabled = true; // Catalog Number should not be editable after creation
        
        bookFormTitle.textContent = 'Edit Book';
        bookFormSubmitBtn.innerHTML = '<i class="fas fa-edit mr-3"></i> Update Book';
        cancelBookEditBtn.classList.remove('hidden');
    } else {
        showMessage('Book not found for editing.', 'error');
    }
}

function resetBookFormForAdd() {
    editingBookId = null;
    bookForm.reset();
    document.getElementById('isbn').disabled = false;
    document.getElementById('catalogNumber').disabled = false;
    bookFormTitle.textContent = 'Add New Book';
    bookFormSubmitBtn.innerHTML = '<i class="fas fa-plus-circle mr-3"></i> Add Book';
    cancelBookEditBtn.classList.add('hidden');
}

function handleDeleteBook(bookId, bookTitle) {
    showConfirmationModal(`Delete Book`, `Are you sure you want to delete "${bookTitle}" from the catalog? This cannot be undone.`, (confirmed) => {
        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            const initialLength = myLibrary.length;
            myLibrary = myLibrary.filter(book => book.id !== bookId);
            if (myLibrary.length < initialLength) {
                // Also remove any issued books of this type
                issuedBooks = issuedBooks.filter(issue => issue.bookId !== bookId);
                // Add a history log for book deletion
                historyLog.push({
                    id: 'hist-' + Date.now(),
                    type: 'book_deleted',
                    bookId: bookId,
                    bookTitle: bookTitle,
                    timestamp: new Date().toISOString(),
                    details: `Book "${bookTitle}" (ID: ${bookId}) was removed from catalog.`
                });
                showMessage('Book deleted successfully!');
                saveToLocalStorage();
                renderCatalog();
                renderIssuedBooks(); // Update issued books list as well
                renderDashboard();
                updateStatusSection();
            } else {
                showMessage('Book not found.', 'error');
            }
        } catch (error) {
            console.error("Error deleting book:", error);
            showMessage(`Failed to delete book: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}

// --- Issue/Return Handlers ---
function handleIssueBook() {
    showLoading();
    try {
        if (!selectedBookForIssue) {
            showMessage('Please select a book to issue.', 'error');
            hideLoading();
            return;
        }
        if (!selectedUserForIssue) {
            showMessage('Please select a user to issue the book to.', 'error');
            hideLoading();
            return;
        }
        if (!selectedLibrarianForIssue) {
            showMessage('Please select a librarian to record the issue.', 'error');
            hideLoading();
            return;
        }

        if (selectedBookForIssue.availableCopies <= 0) {
            showMessage('No available copies of this book to issue.', 'error');
            hideLoading();
            return;
        }

        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(issueDate.getDate() + 14); // Due in 14 days

        const newIssuedBook = {
            id: 'issue-' + Date.now(), // Unique ID for this issue transaction
            bookId: selectedBookForIssue.id,
            bookTitle: selectedBookForIssue.title,
            bookAuthor: selectedBookForIssue.author,
            bookISBN: selectedBookForIssue.isbn,
            bookCatalogNumber: selectedBookForIssue.catalogNumber,
            userId: selectedUserForIssue.id,
            userName: selectedUserForIssue.name,
            issueDate: issueDate.toISOString(),
            dueDate: dueDate.toISOString(),
            librarianId: selectedLibrarianForIssue.id,
            librarianName: selectedLibrarianForIssue.name
        };

        issuedBooks.push(newIssuedBook);

        // Update available copies for the book
        const bookIndex = myLibrary.findIndex(book => book.id === selectedBookForIssue.id);
        if (bookIndex !== -1) {
            myLibrary[bookIndex].availableCopies--;
        }

        // Add to history log
        historyLog.push({
            id: 'hist-' + Date.now(),
            type: 'issue',
            bookId: selectedBookForIssue.id,
            bookTitle: selectedBookForIssue.title,
            userId: selectedUserForIssue.id,
            userName: selectedUserForIssue.name,
            issueDate: issueDate.toISOString(),
            dueDate: dueDate.toISOString(),
            librarianId: selectedLibrarianForIssue.id,
            librarianName: selectedLibrarianForIssue.name,
            timestamp: issueDate.toISOString() // Use issue date as timestamp for issues
        });

        showMessage('Book issued successfully!');
        saveToLocalStorage();
        resetIssueForm();
        renderCatalog();
        renderIssuedBooks();
        renderHistoryLog();
        renderDashboard();
        updateStatusSection();
    } catch (error) {
        console.error("Error issuing book:", error);
        showMessage(`Failed to issue book: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleReturnBook(issuedBookId, bookId, bookTitle, userName) {
    showConfirmationModal(`Return Book`, `Are you sure you want to return "${bookTitle}" from "${userName}"?`, (confirmed) => {
        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            const initialIssuedLength = issuedBooks.length;
            issuedBooks = issuedBooks.filter(issue => issue.id !== issuedBookId);

            if (issuedBooks.length < initialIssuedLength) {
                // Update available copies for the book
                const bookIndex = myLibrary.findIndex(book => book.id === bookId);
                if (bookIndex !== -1) {
                    myLibrary[bookIndex].availableCopies++;
                }

                // Add to history log as a return
                historyLog.push({
                    id: 'hist-' + Date.now(),
                    type: 'return',
                    bookId: bookId,
                    bookTitle: bookTitle,
                    userId: issuedBooks.find(issue => issue.id === issuedBookId)?.userId || 'N/A', // Try to get original user ID
                    userName: userName,
                    timestamp: new Date().toISOString() // Use current time for return
                });

                showMessage('Book returned successfully!');
                saveToLocalStorage();
                renderCatalog();
                renderIssuedBooks();
                renderHistoryLog();
                renderDashboard();
                updateStatusSection();
            } else {
                showMessage('Issued book record not found.', 'error');
            }
        } catch (error) {
            console.error("Error returning book:", error);
            showMessage(`Failed to return book: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}

// --- Rendering Functions ---

function renderCatalog() {
    bookListDiv.innerHTML = ''; // Clear previous entries

    if (myLibrary.length === 0) {
        noBooksMessage.classList.remove('hidden');
    } else {
        noBooksMessage.classList.add('hidden');

        const booksByCategory = {};
        myLibrary.forEach(book => {
            const category = book.category || 'Uncategorized';
            if (!booksByCategory[category]) {
                booksByCategory[category] = [];
            }
            booksByCategory[category].push(book);
        });

        const sortedCategories = Object.keys(booksByCategory).sort();

        sortedCategories.forEach(categoryName => {
            const categorySection = document.createElement('div');
            categorySection.className = 'mb-8 p-4 bg-gray-200 rounded-lg shadow-sm border border-gray-300';
            categorySection.innerHTML = `
                <h3 class="text-xl font-bold text-gray-800 mb-4 text-center">${categoryName} Books</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Title</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Author</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ISBN</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Catalog No.</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Pub. Year</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Publisher</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Available</th>
                                <th class="px-4 py-2 border-b-2 border-gray-300 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="categoryTableBody-${categoryName.replace(/\s/g, '-')}" class="divide-y divide-gray-200">
                            <!-- Books for this category will be inserted here -->
                        </tbody>
                    </table>
                </div>
            `;
            bookListDiv.appendChild(categorySection);

            const categoryTableBody = document.getElementById(`categoryTableBody-${categoryName.replace(/\s/g, '-')}`);
            booksByCategory[categoryName].forEach(book => {
                const bookRow = `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">${book.title}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${book.author}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${book.isbn}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${book.catalogNumber}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${book.publishingYear}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">${book.publisher}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-700">$${book.bookPrice ? parseFloat(book.bookPrice).toFixed(2) : '0.00'}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-sm font-bold ${book.availableCopies <= 0 ? 'text-red-600' : 'text-green-600'}">${book.availableCopies} / ${book.totalCopies}</td>
                        <td class="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                            <button class="edit-book-btn bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md transition duration-150 ease-in-out"
                                    data-book-id="${book.id}">
                                <i class="fas fa-edit"></i> <span class="sr-only">Edit</span>
                            </button>
                            <button class="delete-book-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md ml-2 transition duration-150 ease-in-out"
                                    data-book-id="${book.id}" data-book-title="${book.title}">
                                <i class="fas fa-trash-alt"></i> <span class="sr-only">Delete</span>
                            </button>
                        </td>
                    </tr>
                `;
                categoryTableBody.insertAdjacentHTML('beforeend', bookRow);
            });
        });

        bookListDiv.querySelectorAll('.edit-book-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const bookId = event.target.dataset.bookId || event.target.closest('button').dataset.bookId;
                handleEditBook(bookId);
            });
        });
        bookListDiv.querySelectorAll('.delete-book-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const bookId = event.target.dataset.bookId || event.target.closest('button').dataset.bookId;
                const bookTitle = event.target.dataset.bookTitle || event.target.closest('button').dataset.bookTitle;
                handleDeleteBook(bookId, bookTitle);
            });
        });
    }
}

function renderIssuedBooks() {
    const noIssuedBooksMessage = document.getElementById('noIssuedBooksMessage');
    issuedBooksListDiv.innerHTML = '';
    if (issuedBooks.length === 0) {
        noIssuedBooksMessage.classList.remove('hidden');
    } else {
        noIssuedBooksMessage.classList.add('hidden');
        issuedBooks.forEach(issued => {
            const issueDate = new Date(issued.issueDate).toLocaleDateString();
            const dueDate = new Date(issued.dueDate).toLocaleDateString();
            const issuedCard = `
                <div class="bg-white p-6 rounded-lg shadow-md border border-gray-300">
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${issued.bookTitle}</h3>
                    <p class="text-gray-700 mb-1"><strong>Issued to:</strong> ${issued.userName}</p>
                    <p class="text-700 mb-1"><strong>Catalog No.:</strong> ${issued.bookCatalogNumber}</p>
                    <p class="text-gray-700 mb-1"><strong>Issue Date:</strong> ${issueDate}</p>
                    <p class="text-gray-700 mb-1"><strong>Due Date:</strong> ${dueDate}</p>
                    <div class="mt-4 flex justify-end">
                        <button class="return-book-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition duration-150 ease-in-out"
                                data-issued-book-id="${issued.id}"
                                data-book-id="${issued.bookId}"
                                data-book-title="${issued.bookTitle}"
                                data-user-name="${issued.userName}">
                            <i class="fas fa-undo-alt mr-2"></i> Return Book
                        </button>
                    </div>
                </div>
            `;
            issuedBooksListDiv.insertAdjacentHTML('beforeend', issuedCard);
        });

        issuedBooksListDiv.querySelectorAll('.return-book-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const issuedBookId = event.target.dataset.issuedBookId || event.target.closest('button').dataset.issuedBookId;
                const bookId = event.target.dataset.bookId || event.target.closest('button').dataset.bookId;
                const bookTitle = event.target.dataset.bookTitle || event.target.closest('button').dataset.bookTitle;
                const userName = event.target.dataset.userName || event.target.closest('button').dataset.userName;
                handleReturnBook(issuedBookId, bookId, bookTitle, userName);
            });
        });
    }
}

function renderHistoryLog(filterUserId = null) {
    const noHistoryMessage = document.getElementById('noHistoryMessage');
    historyTableBody.innerHTML = '';

    let filteredHistory = historyLog;
    if (filterUserId) {
        filteredHistory = historyLog.filter(log => log.userId === filterUserId);
    }

    if (filteredHistory.length === 0) {
        noHistoryMessage.classList.remove('hidden');
    } else {
        noHistoryMessage.classList.add('hidden');
        filteredHistory.forEach(log => {
            const issueDateFormatted = log.issueDate ? new Date(log.issueDate).toLocaleDateString() : 'N/A';
            const returnDateFormatted = log.type === 'return' ? new Date(log.timestamp).toLocaleDateString() : 'N/A';
            const librarianName = log.librarianName || 'N/A';

            const row = `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-800">${log.bookTitle}</td>
                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-800">${log.userName}</td>
                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-800">${issueDateFormatted}</td>
                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-800">${returnDateFormatted}</td>
                    <td class="px-4 py-2 border-b border-gray-200 text-sm text-gray-800">${librarianName}</td>
                </tr>
            `;
            historyTableBody.insertAdjacentHTML('beforeend', row);
        });
    }
}

function renderUserManagement() {
    userListDiv.innerHTML = '';
    usthadUsersContainer.innerHTML = '';

    const studentUsers = users.filter(user => user.type === 'Student');
    const usthadUsers = users.filter(user => user.type === 'Usthad');
    
    if (studentUsers.length === 0) {
        const noStudentsMsg = document.createElement('p');
        noStudentsMsg.id = 'noUsersMessage';
        noStudentsMsg.className = 'text-center text-gray-500 mt-8 text-lg col-span-full';
        noStudentsMsg.textContent = 'No student users registered yet.';
        userListDiv.appendChild(noStudentsMsg);
    } else {
        const studentsByClass = {};
        for (let i = 1; i <= 7; i++) {
            studentsByClass[i] = [];
        }
        studentUsers.forEach(user => {
            if (typeof user.userClass === 'number' && user.userClass >= 1 && user.userClass <= 7) {
                studentsByClass[user.userClass].push(user);
            } else {
                console.warn(`Student user ${user.id} has invalid or missing userClass: ${user.userClass}`);
            }
        });

        for (let i = 1; i <= 7; i++) {
            const classColumn = document.createElement('div');
            classColumn.className = 'flex flex-col bg-gray-200 p-4 rounded-lg shadow-sm border border-gray-300';
            classColumn.innerHTML = `<h4 class="text-lg font-bold text-gray-800 mb-4 text-center">Class ${i}</h4>`;
            
            if (studentsByClass[i].length === 0) {
                classColumn.innerHTML += `<p class="text-center text-gray-500 text-sm">No users in this class.</p>`;
            } else {
                studentsByClass[i].forEach(user => {
                    const userCard = `
                        <div class="bg-white p-4 rounded-lg shadow-md border border-gray-300 mb-3 last:mb-0">
                            <h5 class="text-md font-semibold text-gray-800 mb-1">${user.name}</h5>
                            <p class="text-gray-700 text-sm"><strong>User ID:</strong> ${user.id}</p>
                            <p class="text-gray-700 text-sm"><strong>Type:</strong> ${user.type}</p>
                            <div class="mt-3 flex justify-end space-x-2">
                                <button class="edit-user-btn bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                        data-user-id="${user.id}">
                                    <i class="fas fa-edit"></i> <span class="sr-only">Edit</span>
                                </button>
                                <button class="remove-user-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                        data-user-id="${user.id}" data-user-name="${user.name}">
                                    <i class="fas fa-trash-alt"></i> <span class="sr-only">Delete</span>
                                </button>
                            </div>
                        </div>
                    `;
                    classColumn.insertAdjacentHTML('beforeend', userCard);
                });
            }
            userListDiv.appendChild(classColumn);
        }
    }

    if (usthadUsers.length === 0) {
        noUsthadMessage.classList.remove('hidden');
    } else {
        noUsthadMessage.classList.add('hidden');
        usthadUsersContainer.innerHTML = '';
        usthadUsers.forEach(user => {
            const usthadCard = `
                <div class="bg-white p-4 rounded-lg shadow-md border border-gray-300 mb-3 last:mb-0">
                    <h5 class="text-md font-semibold text-gray-800 mb-1">${user.name}</h5>
                    <p class="text-gray-700 text-sm"><strong>User ID:</strong> ${user.id}</p>
                    <p class="text-gray-700 text-sm"><strong>Type:</strong> ${user.type}</p>
                    <div class="mt-3 flex justify-end space-x-2">
                        <button class="edit-user-btn bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                data-user-id="${user.id}">
                            <i class="fas fa-edit"></i> <span class="sr-only">Edit</span>
                        </button>
                        <button class="remove-user-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                data-user-id="${user.id}" data-user-name="${user.name}">
                            <i class="fas fa-trash-alt"></i> <span class="sr-only">Delete</span>
                        </button>
                    </div>
                </div>
            `;
            usthadUsersContainer.insertAdjacentHTML('beforeend', usthadCard);
        });
    }

    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const userId = event.target.dataset.userId || event.target.closest('button').dataset.userId;
            handleEditUser(userId);
        });
    });
    document.querySelectorAll('.remove-user-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const userId = event.target.dataset.userId || event.target.closest('button').dataset.userId;
            const userName = event.target.dataset.userName || event.target.closest('button').dataset.userName;
            handleRemoveUser(userId, userName);
        });
    });
}

// --- Librarian Management Handlers and Renderers ---
function handleAddOrUpdateLibrarian(name, position) {
    showLoading();
    try {
        const librarianData = {
            id: 'librarian-' + Date.now(), // Simple ID generation
            name: name,
            position: position,
        };
        if (editingLibrarianId) {
            // Update existing librarian
            const index = librarians.findIndex(lib => lib.id === editingLibrarianId);
            if (index !== -1) {
                librarians[index] = { ...librarians[index], ...librarianData };
                showMessage('Librarian updated successfully!', 'success');
            } else {
                showMessage('Librarian not found for update.', 'error');
            }
        } else {
            // Add new librarian
            librarians.push(librarianData);
            showMessage('Librarian added successfully!', 'success');
        }
        
        saveToLocalStorage();
        addLibrarianForm.reset();
        resetLibrarianFormForAdd();
        renderLibrarianManagement();
        populateLibrarianDropdownForIssue();
        renderDashboard();
        updateStatusSection();
    } catch (error) {
        console.error("Error adding/updating librarian:", error);
        showMessage(`Failed to save librarian: ${error.message}`, 'error');
    } finally {
        hideLoading();
    }
}

function handleEditLibrarian(librarianId) {
    const librarianToEdit = librarians.find(lib => lib.id === librarianId);
    if (librarianToEdit) {
        editingLibrarianId = librarianId;
        newLibrarianNameInput.value = librarianToEdit.name;
        newLibrarianPositionSelect.value = librarianToEdit.position;
        
        librarianFormTitle.textContent = 'Edit Librarian';
        librarianFormSubmitBtn.innerHTML = '<i class="fas fa-edit mr-3"></i> Update Librarian';
        cancelLibrarianEditBtn.classList.remove('hidden');
    } else {
        showMessage('Librarian not found for editing.', 'error');
    }
}

function resetLibrarianFormForAdd() {
    editingLibrarianId = null;
    addLibrarianForm.reset();
    newLibrarianNameInput.disabled = false;
    newLibrarianPositionSelect.disabled = false;
    librarianFormTitle.textContent = 'Add New Librarian';
    librarianFormSubmitBtn.innerHTML = '<i class="fas fa-user-plus mr-3"></i> Add Librarian';
    cancelLibrarianEditBtn.classList.add('hidden');
}

function handleRemoveLibrarian(librarianId, librarianName) {
    showConfirmationModal(`Delete Librarian`, `Are you sure you want to remove librarian "${librarianName}"? This action cannot be undone.`, (confirmed) => {
        if (!confirmed) {
            return;
        }

        showLoading();
        try {
            const initialLength = librarians.length;
            librarians = librarians.filter(lib => lib.id !== librarianId);
            if (librarians.length < initialLength) {
                // Add a history log for librarian deletion
                historyLog.push({
                    id: 'hist-' + Date.now(),
                    type: 'librarian_deleted',
                    librarianId: librarianId,
                    librarianName: librarianName,
                    timestamp: new Date().toISOString(),
                    details: `Librarian "${librarianName}" (ID: ${librarianId}) was removed.`
                });
                showMessage('Librarian removed successfully!', 'success');
                saveToLocalStorage();
                renderLibrarianManagement();
                populateLibrarianDropdownForIssue(); // Refresh dropdown as a librarian might be removed
                renderDashboard();
                updateStatusSection();
            } else {
                showMessage('Librarian not found.', 'error');
            }
        } catch (error) {
            console.error("Error removing librarian:", error);
            showMessage(`Failed to remove librarian: ${error.message}`, 'error');
        } finally {
            hideLoading();
        }
    });
}

function renderLibrarianManagement() {
    const noLibrariansMessage = document.getElementById('noLibrariansMessage');
    librarianListDiv.innerHTML = '';
    if (librarians.length === 0) {
        noLibrariansMessage.classList.remove('hidden');
    } else {
        noLibrariansMessage.classList.add('hidden');
        librarians.forEach(librarian => {
            const librarianCard = `
                <div class="bg-white p-4 rounded-lg shadow-md border border-gray-300 mb-3 last:mb-0">
                    <h5 class="text-md font-semibold text-gray-800 mb-1">${librarian.name}</h5>
                    <p class="text-gray-700 text-sm"><strong>Position:</strong> ${librarian.position}</p>
                    <div class="mt-3 flex justify-end space-x-2">
                        <button class="edit-librarian-btn bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                data-librarian-id="${librarian.id}">
                            <i class="fas fa-edit"></i> <span class="sr-only">Edit</span>
                        </button>
                        <button class="remove-librarian-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition duration-150 ease-in-out"
                                data-librarian-id="${librarian.id}" data-librarian-name="${librarian.name}">
                            <i class="fas fa-trash-alt"></i> <span class="sr-only">Delete</span>
                        </button>
                    </div>
                </div>
            `;
            librarianListDiv.insertAdjacentHTML('beforeend', librarianCard);
        });

        librarianListDiv.querySelectorAll('.edit-librarian-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const librarianId = event.target.dataset.librarianId || event.target.closest('button').dataset.librarianId;
                handleEditLibrarian(librarianId);
            });
        });
        librarianListDiv.querySelectorAll('.remove-librarian-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const librarianId = event.target.dataset.librarianId || event.target.closest('button').dataset.librarianId;
                const librarianName = event.target.dataset.librarianName || event.target.closest('button').dataset.librarianName;
                handleRemoveLibrarian(librarianId, librarianName);
            });
        });
    }
}

function renderDashboard() {
    totalBooksCount.textContent = myLibrary.length;
    issuedBooksCount.textContent = issuedBooks.length;
    totalUsersCount.textContent = users.length;
    totalLibrariansCount.textContent = librarians.length;
}

// --- Status Section Update Function ---
function updateStatusSection() {
    const now = new Date();
    currentTimeSpan.textContent = now.toLocaleString();
    totalRecordsSpan.textContent = myLibrary.length + users.length + issuedBooks.length + historyLog.length + librarians.length;

    const readerCounts = {};
    historyLog.forEach(log => {
        if (log.type === 'issue') {
            readerCounts[log.userName] = (readerCounts[log.userName] || 0) + 1;
        }
    });
    const sortedReaders = Object.entries(readerCounts).sort(([, countA], [, countB]) => countB - countA);

    frequentReadersList.innerHTML = '';
    if (sortedReaders.length === 0) {
        noFrequentReadersMessage.classList.remove('hidden');
    } else {
        noFrequentReadersMessage.classList.add('hidden');
        sortedReaders.slice(0, 5).forEach(([readerName, count]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${readerName} (${count} issues)`;
            frequentReadersList.appendChild(listItem);
        });
    }

    const bookIssueCounts = {};
    historyLog.forEach(log => {
        if (log.type === 'issue') {
            bookIssueCounts[log.bookTitle] = (bookIssueCounts[log.bookTitle] || 0) + 1;
        }
    });
    const sortedBooks = Object.entries(bookIssueCounts).sort(([, countA], [, countB]) => countB - countA);

    popularBooksList.innerHTML = '';
    if (sortedBooks.length === 0) {
        noPopularBooksMessage.classList.remove('hidden');
    } else {
        noPopularBooksMessage.classList.add('hidden');
        sortedBooks.slice(0, 5).forEach(([bookTitle, count]) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${bookTitle} (${count} issues)`;
            popularBooksList.appendChild(listItem);
        });
    }
}


// --- Dropdown Population ---
function populateNewUserClassDropdown() {
    newUserClassSelect.innerHTML = '<option value="">-- Select Class --</option>';
    for (let i = 1; i <= 7; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Class ${i}`;
        newUserClassSelect.appendChild(option);
    }
}

function populateLibrarianDropdownForIssue() {
    issueLibrarianSelect.innerHTML = '<option value="">-- Select Librarian --</option>';
    librarians.forEach(librarian => {
        const option = document.createElement('option');
        option.value = librarian.id;
        option.textContent = `${librarian.name} (${librarian.position})`;
        issueLibrarianSelect.appendChild(option);
    });
    if (selectedLibrarianForIssue && !librarians.some(lib => lib.id === selectedLibrarianForIssue.id)) {
        selectedLibrarianForIssue = null;
        issueLibrarianSelect.value = '';
    }
}

// --- UI State Management ---
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    navLinks.forEach(link => {
        link.classList.remove('bg-gray-700', 'text-white');
        link.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
        if (link.dataset.section === sectionId) {
            link.classList.add('bg-gray-700', 'text-white');
            link.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
        }
    });
}

function updateIssueButtonState() {
    if (selectedBookForIssue && selectedUserForIssue && selectedLibrarianForIssue && selectedBookForIssue.availableCopies > 0) {
        issueBookSubmitBtn.disabled = false;
    } else {
        issueBookSubmitBtn.disabled = true;
    }
}

function resetIssueForm() {
    catalogNumberSearchInput.value = '';
    issueUserIdSearchInput.value = '';
    issueLibrarianSelect.value = '';
    selectedBookForIssue = null;
    selectedUserForIssue = null;
    selectedLibrarianForIssue = null;
    selectedBookDisplay.classList.add('hidden');
    selectedUserDisplay.classList.add('hidden');
    updateIssueButtonState();
}

function resetIssueUserSelection() {
    issueUserIdSearchInput.value = '';
    selectedUserForIssue = null;
    selectedUserDisplay.classList.add('hidden');
    updateIssueButtonState();
}

function toggleUserClassVisibility() {
    const userType = newUserTypeSelect.value;
    if (userType === 'Student') {
        newUserClassGroup.classList.remove('hidden');
        newUserClassSelect.setAttribute('required', 'true');
    } else {
        newUserClassGroup.classList.add('hidden');
        newUserClassSelect.removeAttribute('required');
        newUserClassSelect.value = '';
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            showSection(event.target.dataset.section);
        });
    });

    confirmYesBtn.addEventListener('click', () => {
        if (confirmationCallback) {
            confirmationCallback(true);
        }
        hideConfirmationModal();
    });

    confirmNoBtn.addEventListener('click', () => {
        if (confirmationCallback) {
            confirmationCallback(false);
        }
        hideConfirmationModal();
    });

    bookForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const bookData = {
            title: document.getElementById('title').value,
            author: document.getElementById('author').value,
            isbn: document.getElementById('isbn').value,
            catalogNumber: document.getElementById('catalogNumber').value,
            publishingYear: parseInt(document.getElementById('publishingYear').value, 10),
            publisher: document.getElementById('publisher').value,
            bookPrice: parseFloat(document.getElementById('bookPrice').value),
            category: document.getElementById('category').value,
            totalCopies: parseInt(document.getElementById('totalCopies').value, 10),
            read: document.getElementById('read').checked,
        };
        handleAddOrUpdateBook(bookData);
    });

    cancelBookEditBtn.addEventListener('click', resetBookFormForAdd);

    addUserForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userId = newUserIdInput.value.trim();
        const name = newUserNameInput.value.trim();
        const userType = newUserTypeSelect.value;
        const userClass = newUserClassSelect.value ? parseInt(newUserClassSelect.value, 10) : null;
        handleAddOrUpdateUser(userId, name, userType, userClass);
    });

    cancelUserEditBtn.addEventListener('click', resetUserFormForAdd);

    newUserIdInput.addEventListener('input', () => {
        if (editingUserId) return;

        const enteredUserId = newUserIdInput.value.trim();
        const foundUser = users.find(user => user.id === enteredUserId);

        if (foundUser) {
            newUserNameInput.value = foundUser.name;
            newUserTypeSelect.value = foundUser.type;
            if (foundUser.type === 'Student') {
                newUserClassSelect.value = foundUser.userClass;
            } else {
                newUserClassSelect.value = '';
            }
            toggleUserClassVisibility();
            showMessage('User ID found. Existing user details loaded.', 'info');
        } else {
            newUserNameInput.value = '';
            newUserTypeSelect.value = '';
            newUserClassSelect.value = '';
            newUserNameInput.disabled = false;
            newUserTypeSelect.disabled = false;
            newUserClassSelect.disabled = false;
            toggleUserClassVisibility();
        }
    });

    newUserTypeSelect.addEventListener('change', toggleUserClassVisibility);

    catalogNumberSearchInput.addEventListener('input', () => {
        const catalogNum = catalogNumberSearchInput.value.trim();
        selectedBookForIssue = myLibrary.find(book => book.catalogNumber === catalogNum);

        if (selectedBookForIssue) {
            selectedBookTitle.textContent = selectedBookForIssue.title;
            selectedBookAuthor.textContent = selectedBookForIssue.author;
            selectedBookISBN.textContent = selectedBookForIssue.isbn;
            selectedBookCatalogNumber.textContent = selectedBookForIssue.catalogNumber;
            selectedBookAvailableCopies.textContent = `${selectedBookForIssue.availableCopies} / ${selectedBookForIssue.totalCopies}`;
            selectedBookDisplay.classList.remove('hidden');
        } else {
            if (catalogNum !== '') {
                showMessage('Book not found with this catalog number.', 'error');
            }
            selectedBookDisplay.classList.add('hidden');
            selectedBookForIssue = null;
        }
        updateIssueButtonState();
    });

    searchBookBtn.addEventListener('click', () => {
        const catalogNum = catalogNumberSearchInput.value.trim();
        if (catalogNum === '') {
            showMessage('Please enter a catalog number to search.', 'error');
            return;
        }
        catalogNumberSearchInput.dispatchEvent(new Event('input'));
    });

    issueUserIdSearchInput.addEventListener('input', () => {
        const userIdToSearch = issueUserIdSearchInput.value.trim();
        const foundUser = users.find(user => user.id === userIdToSearch);

        if (foundUser) {
            selectedUserForIssue = foundUser;
            selectedUserName.textContent = foundUser.name;
            selectedUserClass.textContent = foundUser.type === 'Student' ? `Class ${foundUser.userClass}` : foundUser.type;
            selectedUserDisplay.classList.remove('hidden');
        } else {
            if (userIdToSearch !== '') {
                showMessage('User not found with this ID.', 'error');
            }
            selectedUserDisplay.classList.add('hidden');
            selectedUserForIssue = null;
        }
        updateIssueButtonState();
    });

    searchUserInIssueBtn.addEventListener('click', () => {
        const userIdToSearch = issueUserIdSearchInput.value.trim();
        if (userIdToSearch === '') {
            showMessage('Please enter a User ID to search.', 'error');
            return;
        }
        issueUserIdSearchInput.dispatchEvent(new Event('input'));
    });

    issueLibrarianSelect.addEventListener('change', () => {
        const librarianId = issueLibrarianSelect.value;
        selectedLibrarianForIssue = librarians.find(lib => lib.id === librarianId);
        updateIssueButtonState();
    });

    issueBookForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleIssueBook();
    });

    addLibrarianForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = newLibrarianNameInput.value.trim();
        const position = newLibrarianPositionSelect.value;
        handleAddOrUpdateLibrarian(name, position);
    });

    cancelLibrarianEditBtn.addEventListener('click', resetLibrarianFormForAdd);

    searchHistoryBtn.addEventListener('click', () => {
        const userId = historyUserIdSearchInput.value.trim();
        renderHistoryLog(userId);
    });

    historyUserIdSearchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchHistoryBtn.click();
        }
    });
});

