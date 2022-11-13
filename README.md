# LibMan
LibMan is a simple Library Management Application made using HTML, CSS, JavaScript, NodeJS and MongoDB.

To use LibMan the user needs to be a registered user.
For new registration use email, password and a photo id.
![Screenshot (938)](https://user-images.githubusercontent.com/91361031/201533458-4eb957d8-4fb3-431a-9264-748be6571bee.png)

Then simply the user can signin with the registered email and password.
![Screenshot (940)](https://user-images.githubusercontent.com/91361031/201533516-62ff3243-265e-4092-9bea-f368550bc3cd.png)


The users can see all the available books, if any, in the library at that instant.
![Screenshot (942)](https://user-images.githubusercontent.com/91361031/201533633-05a72000-5414-4649-9254-b0b0f74d98ec.png)

After the users are logged in they can search, donate, issue, return, remove the books from the library very easily.

If you have to use the app directly via the PostMan or any other equivalent app, then also you have to signin with the registered credentials.
You can do this by making a post call to https://libman.herokuapp.com/signin

For searching make a post call to https://libman.herokuapp.com/searchBook

For donating book make a post call to https://libman.herokuapp.com/addBook with the title and author of the book.

To issue a book you need to be logged in as a registered user and make a post call to https://libman.herokuapp.com/issueBook with the title of the book.

To return the book the user has issued make a post call to https://libman.herokuapp.com/returnBook with the title of the book.

To remove the book from the library make a post call to https://libman.herokuapp.com/removeBook with the title of the book.

All the entries are to be made via the body of the requests.

The update feature for a book is not incorporated because the author of any title cannot be changed after the book is published by the author and vice versa.

The update feature for any user is not added because the photo id of a user is added only once which might not get updated.

The follow up for this project would be to add a forgot password feature where the user will be able to change the password.
