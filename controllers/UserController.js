import { UsersModel } from "../models/UserModel.js";
import { generateToken } from "../utils/index.js";
import { mailer } from "../utils/mailer.js";
import cloudinary from "cloudinary";
import { ConversationModel } from "../models/ConversationModel.js";
import { MessageModel } from "../models/MessageModel.js";

export const getUser = async (req, res) => {
  const users = await UsersModel.find();
  res.send(users);
};

export const getUserById = async (req, res) => {
  const user = await UsersModel.findOne({ _id: req.params.id });
  if (user) {
    res.send(user);
  } else {
    res.status(403).send({ message: "user not found" });
  }
};

export const updateRefeshToken = (user, refeshToken) => {
  user.refeshToken = refeshToken;
  user.save();
};

export const Login = async (req, res) => {
  const user = await UsersModel.findOne(req.body);
  if (user) {
    const tokens = generateToken(user);
    updateRefeshToken(user, tokens.refeshToken);

    res.send({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      password: user.password,
      otp: user.otp || null,
      token: tokens.accessToken,
      refeshToken: tokens.refeshToken,
    });
  } else {
    res.status(403).send({ message: "Tài khoản hoặc mật khẩu không đúng" });
  }
};

export const Register = async (req, res) => {
  console.log(req.body)
  const userExists = await UsersModel.findOne({ phone: req.body.phone });
  console.log(userExists)
  if (userExists) {
    res.status(400).send({ message: "Tài khoản này đã đăng kí tài khoản" });
  } else {
    const user = new UsersModel(req.body);
    user.avatar =
      "https://res.cloudinary.com/t-engine/image/upload/v1666532834/zaloclone/anonymous_bujoil_lxxdwd.jpg";
    await user.save();

    // const refeshToken = generateToken(user).refeshToken;
    // updateRefeshToken(user, refeshToken);

    res.status(200).send({
      _id: user._id,
      name: user.name,
      // password: user.password,
      password: Math.random().toString(36).slice(-8),
      phone: user.phone,
      otp: "",
    });
  }
};

export const getNewToken = async (req, res) => {
  const refeshToken = req.body;
  const userExists = await UsersModel.findOne(refeshToken);
  if (userExists) {
    const tokens = generateToken(userExists);
    updateRefeshToken(userExists, tokens.refeshToken);
    res.send(tokens);
  } else {
    res.status(403).send({ message: "no refesh token" });
  }
};

export const UpdatePassword = async (req, res) => {
  const userExist = await UsersModel.findOne({ phone: req.body.email });
  if (userExist) {
    userExist.password = req.body.password;
    await userExist.save();
    res.send({ message: "Cập nhật mật khẩu thành công" });
  } else {
    res.status(403).send({ message: "Email này chưa đăng kí tài khoản" });
  }
};

function countDownOtp(time, user) {
  setTimeout(() => {
    user.otp = "";
    user.save();
  }, time);
}

export const sendMail = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    const userExist = await UsersModel.findOne({ phone: email });
    if (userExist) {
      countDownOtp(60000, userExist);
      userExist.otp = String(otp);
      await userExist.save();
      await mailer(
        String(email),
        "GET CODE OTP",
        `<b>Your code is: ${otp}</b>`
      );
      res.send({ message: "send code to your email" });
    } else {
      res.status(403).send({ message: "Email này chưa đăng kí tài khoản" });
    }
  } catch (error) {
    console.log(error);
    res.status(403).send({ message: "Không gửi được" });
  }
};

export const checkCodeOtp = async (req, res) => {
  console.log(req.body);
  const userExist = await UsersModel.findOne({ phone: req.body.email });
  if (userExist) {
    if (req.body.otp === userExist.otp) {
      res.send({ message: "OTp đã đúng" });
    } else {
      res.status(403).send({ message: "OTP không đúng" });
    }
  } else {
    res.status(403).send({ message: "Email này chưa đăng kí tài khoản" });
  }
};

export const changeAvatar = async (req, res) => {
  const userExist = await UsersModel.findById(req.body._id);
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: "zalo",
  });

  if (userExist) {
    if (
      userExist.avatar ===
      "https://res.cloudinary.com/t-engine/image/upload/v1666532834/zaloclone/anonymous_bujoil_lxxdwd.jpg"
    ) {
      console.log("image default");
    } else {
      cloudinary.uploader.destroy(userExist.cloudinary_id);
    }

    userExist.avatar = result.secure_url;
    userExist.cloulinary_id = result.public_id;

    await userExist.save();
    res.send(userExist);
  } else {
    res.status(403).send({ mesage: "user not found" });
  }
};

export const searchUser = async (req, res) => {
  const user = await UsersModel.findOne({ phone: req.body.phone });
  if (user) {
    res.send(user);
  } else {
    res.status(403).send({ message: "Số điện thoại hoặc email không đúng" });
  }
};

export const addFriend = async (userFrom, userTo) => {
  const userToAccount = await UsersModel.findById(userTo);
  const userFromAccount = await UsersModel.findById(userFrom);
  console.log(userFrom, userTo);

  if (userToAccount && userFromAccount) {
    userToAccount.peopleRequest.push({ idUser: userFrom });
    userFromAccount.myRequest.push({ idUser: userTo });

    await userToAccount.save();
    await userFromAccount.save();
  }
};

export const deleteRequestFriend = async (userFrom, userTo) => {
  const userToAccount = await UsersModel.findOne({ _id: userTo });
  const userFromAccount = await UsersModel.findOne({ _id: userFrom });

  if (userToAccount && userFromAccount) {
    userFromAccount.myRequest = userFromAccount.myRequest.filter(
      (x) => x.idUser != userTo
    );
    userToAccount.peopleRequest = userToAccount.peopleRequest.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const acceptFriend = async (userFrom, userTo) => {
  const userFromAccount = await UsersModel.findOne({ _id: userFrom });
  const userToAccount = await UsersModel.findOne({ _id: userTo });

  if (userFromAccount && userToAccount) {
    // ------------ CREATE NEW CONVERSATION
    const newConversation = new ConversationModel({
      type: "single",
      members: [],
    });
    console.log(newConversation);
    newConversation.members.push({ idUser: userFrom });
    newConversation.members.push({ idUser: userTo });
    await newConversation.save();
    console.log("new-conversation: ", newConversation._id);

    // ------------ CODE LOGIC
    userFromAccount.peopleRequest = userFromAccount.peopleRequest.filter(
      (x) => x.idUser != userTo
    );
    userFromAccount.friends.push({
      idUser: userTo,
      idConversation: newConversation._id,
    });

    userToAccount.myRequest = userToAccount.myRequest.filter(
      (x) => x.idUser != userFrom
    );
    userToAccount.friends.push({
      idUser: userFrom,
      idConversation: newConversation._id,
    });
    console.log("userToAccount: ", userToAccount);

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const DontAcceptFriend = async (userFrom, userTo) => {
  const userFromAccount = await UsersModel.findOne({ _id: userFrom });
  const userToAccount = await UsersModel.findOne({ _id: userTo });

  if (userFromAccount && userToAccount) {
    userFromAccount.peopleRequest = userFromAccount.peopleRequest.filter(
      (x) => x.idUser != userTo
    );

    userToAccount.myRequest = userToAccount.myRequest.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const unFriend = async (userFrom, userTo, idConversation) => {
  await ConversationModel.findByIdAndDelete(idConversation);
  await MessageModel.deleteMany({ idConversation: idConversation });

  const userFromAccount = await UsersModel.findOne({ _id: userFrom });
  const userToAccount = await UsersModel.findOne({ _id: userTo });

  if (userFromAccount && userToAccount) {
    userFromAccount.friends = userFromAccount.friends.filter(
      (x) => x.idUser != userTo
    );

    userToAccount.friends = userToAccount.friends.filter(
      (x) => x.idUser != userFrom
    );

    await userFromAccount.save();
    await userToAccount.save();
  }
};

export const getAllPeopleRequestByUser = async (req, res) => {
  const list = await UsersModel.findById(req.params.id).populate({
    path: "peopleRequest.idUser",
    select: { name: 1, avatar: 1 },
  });
  res.send(list.peopleRequest);
};

export const getAllFriendByUser = async (req, res) => {
  const list = await UsersModel.findById(req.params.id).populate({
    path: "friends.idUser",
    select: { name: 1, avatar: 1 },
  });

  res.send(list.friends);
};

export const Demo = (req, res) => {
  res.send("dnsahbc");
};
