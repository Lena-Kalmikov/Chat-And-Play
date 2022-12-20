## ChatAndPlay

The goal of this project was to create a real-time chat app with an option to play an online game with another person. 
The only requirement was to deploy it with Azure. Technologies were of my choosing. 

* Back-end: NodeJS, using Express and mainly Socket.IO.
* Front-end: JavaScript using ReactJS, HTML, CSS.
* Cloud: Azure.

Application:
1.	New users can register, providing username and password that will be saved in the system.
2.	Existing users can login with correct username and password that will be cross checked with the user details in the system.
3.	Once the users are logged in, they will see two lists: online users to chat with, and offline users.
4.	The user can pick someone to chat with, and send them an invite. If the other person accepts, both users will enter a private chat room.
5.	If the other person refuses to join the room, the inviting user will get an alert about it.
6.	In the chat room, there can only be two people. They can chat with one another and play tic-tac-toe. There is a known bug in the game – the board sometimes will not render correctly, and the scores change at random. Due to time constraints, this was left as is.
7.	Once one of the users leave the room, both of the users are redirected to the user lists page. 
8.	If a user chooses someone who is already in a private chat room, they will get an alert about it. 

 ![](https://github.com/Lena-Kalmikov/Chat-And-Play/blob/main/ChatAndPlay1.gif)
