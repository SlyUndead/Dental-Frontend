import { takeEvery, put, call } from "redux-saga/effects";

// Chat Redux States
import {
  DELETE_MESSAGE,
  GET_CHATS,
  GET_CONTACTS,
  GET_GROUPS,
  GET_MESSAGES,
  POST_ADD_MESSAGE,
} from "./actionTypes";
import {
  getChatsSuccess,
  getChatsFail,
  getGroupsSuccess,
  getGroupsFail,
  getContactsSuccess,
  getContactsFail,
  getMessagesSuccess,
  getMessagesFail,
  addMessageSuccess,
  addMessageFail,
  deleteMessageSuccess,
  deleteMessageFail,
} from "./actions";

//Include Both Helper File with needed methods
import {
  getChats,
  getGroups,
  getContacts,
  getMessages,
  addMessage,
  deleteMessage,
} from "../../helpers/fakebackend_helper";
import { toast } from "react-toastify";

function* onGetChats() {
  try {
    const response = yield call(getChats);
    yield put(getChatsSuccess(response));
  } catch (error) {
    yield put(getChatsFail(error));
  }
}

function* onGetGroups() {
  try {
    const response = yield call(getGroups);
    yield put(getGroupsSuccess(response));
  } catch (error) {
    yield put(getGroupsFail(error));
  }
}

function* onGetContacts() {
  try {
    const response = yield call(getContacts);
    yield put(getContactsSuccess(response));
  } catch (error) {
    yield put(getContactsFail(error));
  }
}

function* onGetMessages({ roomId }) {
  try {
    const response = yield call(getMessages, roomId);
    yield put(getMessagesSuccess(response));
  } catch (error) {
    yield put(getMessagesFail(error));
  }
}

function* onAddMessage({ message }) {
  try {
    const response = yield call(addMessage, message);
    yield put(addMessageSuccess(response));
  } catch (error) {
    yield put(addMessageFail(error));
  }
}

function* OnDeleteMessage({ payload: data }) {
  try {
    const response = yield call(deleteMessage, data)
    yield put(deleteMessageSuccess(response))
    toast.success("Message Deleted Successfully", { autoClose: 2000 });
  } catch (error) {
    yield put(deleteMessageFail(error))
    toast.error("Message Deleted Failed", { autoClose: 2000 });
  }
}

function* chatSaga() {
  yield takeEvery(GET_CHATS, onGetChats);
  yield takeEvery(GET_GROUPS, onGetGroups);
  yield takeEvery(GET_CONTACTS, onGetContacts);
  yield takeEvery(GET_MESSAGES, onGetMessages);
  yield takeEvery(POST_ADD_MESSAGE, onAddMessage);
  yield takeEvery(DELETE_MESSAGE, OnDeleteMessage);

}

export default chatSaga;
