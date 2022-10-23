import express from "express";
import {
  getAllConversation,
  getAllConversationByUser,
  getAllFriend,
  getAllMessageByConversation,
} from "../controllers/ChatController.js";

const ChatRouter = express.Router();

ChatRouter.get("/", getAllConversation);
ChatRouter.get("/allmessage/:id", getAllMessageByConversation);
ChatRouter.get("/:id", getAllConversationByUser);

ChatRouter.get("/friend/:id", getAllFriend);

export default ChatRouter;
