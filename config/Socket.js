import { Server } from "socket.io";
import {
  createConversation,
  joinConversation,
  saveMessage,
  seenMessage,
  updateLastMesssage,
} from "../controllers/ChatController.js";
import {
  acceptFriend,
  addFriend,
  deleteRequestFriend,
  DontAcceptFriend,
  unFriend,
} from "../controllers/UserController.js";

export const ConnectSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    // --------------- ADD FRIEND
    socket.on("join_room", (User) => {
      console.log("join-room");
      socket.join(User._id);
    });

    socket.on("add_friend", async (data) => {
      const { userFrom, userTo } = data;
      await addFriend(userFrom, userTo);

      io.emit("add_friend_success");
      io.to(userTo).emit("new_request_friend", userTo);
    });

    socket.on("delete_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await deleteRequestFriend(userFrom, userTo);
      io.emit("delete_request_friend_success");
      io.to(userTo).emit("person_delete_request_friend", userTo);
    });

    socket.on("accept_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await acceptFriend(userFrom, userTo);

      io.emit("accept_request_friend_success", userFrom);
      io.to(userTo).emit("accept_request_friend", userTo);
    });

    socket.on("dont_accept_request_friend", async (data) => {
      const { userFrom, userTo } = data;
      await DontAcceptFriend(userFrom, userTo);

      io.emit("dont_accept_request_friend_success", userFrom);
      io.to(userTo).emit("dont_accept_request_friend", userTo);
    });

    socket.on("un_friend", async (data) => {
      const { userFrom, userTo, idConversation } = data;
      await unFriend(userFrom, userTo, idConversation);

      io.emit("un_friend_success", userFrom);
      io.to(userTo).emit("un_friend", userTo);
    });

    // --------------- CHAT
    socket.on("join_conversation", (idConversation) => {
      socket.join(idConversation);
    });
    socket.on("join_all_conversation", (array) => {
      socket.join(array);
    });
    socket.on("seen_message", async (idConversation) => {
      await seenMessage(idConversation);
      io.to(idConversation).emit("seen_message");
    });
    socket.on("send_message", async (data) => {
      const newMessage = await saveMessage(data);
      await updateLastMesssage({
        idConversation: newMessage.idConversation,
        message: newMessage._id,
      });

      io.to(newMessage.idConversation.toString()).emit(
        "new_message",
        newMessage
      );
    });
  });
};
