## Chat-And-Play

The goal of this project was to create a real-time chat app with an option to play an online game with another person. 
The only requirement was to deploy it with Azure. Technologies were of my choosing. 

* Back-end: NodeJS, using Express and mainly Socket.IO.
* Front-end: ReactJS.
* Cloud: Azure.

Application:
1.	New users can register, providing username and password that will be saved in the system.
2.	Existing users can login with correct username and password that will be cross checked with the user details in the system.
3.	Once the users are logged in, they will see two lists: online users to chat with, and offline users.
4.	The user can pick someone to chat with from the online list, and send them an invite. 
5.	If the other person accepts, both users will enter a private chat room.
6.	If the other person refuses to join the room, the inviting user will get an alert about it.
7.	In the chat room, there can only be two people. They can chat with one another and play tic-tac-toe.
8.	Once one of the users leaves the room, both of the users are redirected back to the user lists page. 

 ![](https://github.com/Lena-Kalmikov/Chat-And-Play/blob/main/ChatAndPlay1.gif)
