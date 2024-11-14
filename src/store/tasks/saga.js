import { call, put, takeEvery } from "redux-saga/effects"

// Crypto Redux States
import {
  GET_TASKS,
  DELETE_KANBAN,
  ADD_CARD_DATA,
  UPDATE_CARD_DATA,
} from "./actionTypes"
import {
  getTasksSuccess,
  getTasksFail,
  deleteKanbanSuccess,
  deleteKanbanFail,
  addCardDataSuccess,
  addCardDataFail,
  updateCardDataSuccess,
  updateCardDataFail,
} from "./actions"

import { toast } from "react-toastify"

// Include Both Helper File with needed methods
import {
  getTasks,
  deleteKanban,
  addCardData,
  updateCardData,
} from "helpers/fakebackend_helper"

function* fetchTasks() {
  try {
    const response = yield call(getTasks)
    yield put(getTasksSuccess(response))
  } catch (error) {
    yield put(getTasksFail(error))
  }
}

function* onDeleteKanban({ payload: kanban }) {
  try {
    const response = yield call(deleteKanban, kanban)
    yield put(deleteKanbanSuccess(response))
    toast.success("KanBan Delete Successfully", { autoClose: 2000 });
  } catch (error) {
    yield put(deleteKanbanFail(error))
    toast.error("KanBan Delete Failed", { autoClose: 2000 });
  }
}

function* onAddCardData({ payload: cardData }) {
  try {
    const response = yield call(addCardData, cardData)
    yield put(addCardDataSuccess(response))
    toast.success("KanBan Added Successfully", { autoClose: 2000 });
  } catch (error) {
    yield put(addCardDataFail(error))
    toast.error("KanBan Added Failed", { autoClose: 2000 });
  }
}

function* onUpdateCardData({ payload: card }) {
  try {
    const response = yield call(updateCardData, card)
    yield put(updateCardDataSuccess(response))
    toast.success("KanBan Update Successfully", { autoClose: 2000 });
  } catch (error) {
    yield put(updateCardDataFail(error))
    toast.error("KanBan Update Failed", { autoClose: 2000 });
  }
}

function* tasksSaga() {
  yield takeEvery(GET_TASKS, fetchTasks)
  yield takeEvery(UPDATE_CARD_DATA, onUpdateCardData)
  yield takeEvery(DELETE_KANBAN, onDeleteKanban)
  yield takeEvery(ADD_CARD_DATA, onAddCardData)
}

export default tasksSaga
