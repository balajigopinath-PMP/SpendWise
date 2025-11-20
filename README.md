💰 SpendWise

SpendWise is a lightweight web application designed to help users track their expenses efficiently. Built on Google Apps Script, it runs entirely within the Google ecosystem, requiring no external hosting.

📂 Project Structure

code.gs: Server-side logic (Google Apps Script). Handles database interactions (Google Sheets) and serves the web app.

index.html: Client-side interface. Contains the HTML, CSS, and JavaScript for the user UI.

🚀 Installation & Setup

Since this is a Google Apps Script project, you don't "install" it like a normal program. Follow these steps to deploy your own copy:

1. Create the Script

Go to script.google.com and click "New Project".

Rename the project to SpendWise.

2. Add the Code

Open the Code.gs file in the online editor.

Copy the contents of code.gs from this repository and paste it there.

Click the + icon next to "Files", select HTML, and name it index.

Copy the contents of index.html from this repository and paste it into your new index.html file.

Save all files (Ctrl/Cmd + S).

3. Deploy as Web App

Click the Deploy button (top right) > New deployment.

Click the "Select type" gear icon > Web app.

Fill in the details:

Description: SpendWise v1

Execute as: Me (your email)

Who has access: Anyone with Google Account (or "Only myself" for private use)

Click Deploy.

Grant the necessary permissions when prompted.

🎉 Done! You will receive a URL. This is your live SpendWise app link.

🛠️ Technologies Used

Google Apps Script

HTML5 / CSS3

JavaScript (ES6)

Google Sheets (as the database)

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
